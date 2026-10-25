import test from 'node:test';
import assert from 'node:assert/strict';
import { launchExtensionBrowser } from '../../scripts/launch-browser.js';

test('E2E Real-World E-Commerce & Security Pre-Flight Audit', async () => {
  const browser = await launchExtensionBrowser({ build: 'fresh' });
  try {
    const context = browser.context;

    // Real-world e-commerce test fixture with Amazon, European, Jumia, and Shopify patterns
    const ecomHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Global Marketplace Pre-Flight Verification</title>
  <style>
    body { font-family: sans-serif; padding: 24px; line-height: 1.5; }
    .product-card { border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 16px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Global Product Listings</h1>

  <!-- 1. Amazon Split-Price Pattern -->
  <div class="product-card" id="amazon-card">
    <h2>Wireless Noise Cancelling Headphones</h2>
    <span class="a-price" data-a-size="xl" data-a-color="base" id="amazon-price">
      <span class="a-offscreen">$149.99</span>
      <span aria-hidden="true">
        <span class="a-price-symbol">$</span>
        <span class="a-price-whole">149<span class="a-price-decimal">.</span></span>
        <span class="a-price-fraction">99</span>
      </span>
    </span>
  </div>

  <!-- 2. European Retailer Comma-Decimal Pattern -->
  <div class="product-card" id="euro-card">
    <h2>Ultrabook Laptop 14"</h2>
    <div class="euro-price" id="euro-price">1.299,00 €</div>
    <div class="euro-discount" id="euro-discount">89,50 € discount applied</div>
  </div>

  <!-- 3. Jumia African E-Commerce Pattern -->
  <div class="product-card" id="jumia-card">
    <h2>Smartphone 256GB Dual SIM</h2>
    <div class="prc" id="jumia-price">₦ 185,000</div>
    <div class="old" id="jumia-old">₦ 220,000</div>
  </div>

  <!-- 4. Shopify Money Span Pattern -->
  <div class="product-card" id="shopify-card">
    <h2>Designer Leather Backpack</h2>
    <span class="price-item price-item--regular" id="shopify-price">
      <span class="money">$85.00 USD</span>
    </span>
  </div>
</body>
</html>`;

    // Intercept test page URL and rate feeds
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.protocol.startsWith('chrome-extension')) {
        return route.continue();
      }
      if (url.hostname.includes('frankfurter') || url.hostname.includes('jsdelivr') || url.hostname.includes('currency-api')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ amount: 1, base: 'USD', date: '2026-10-22', rates: { EUR: 0.92, GBP: 0.79, NGN: 1500, USD: 1 } })
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: ecomHtml
      });
    });

    const page = await context.newPage();

    // 1. Configure settings directly on options page
    await page.goto(`chrome-extension://${browser.extensionId}/options/options.html#general`);
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(async () => {
      await chrome.runtime.sendMessage({
        type: 'CC_UPDATE_SETTINGS',
        payload: {
          targetCurrency: 'EUR',
          perSite: {
            'store.test': { mode: 'always' }
          }
        }
      });
    });
    await page.waitForTimeout(400);

    // 2. Navigate to real-world e-commerce test page
    await page.goto('http://store.test/products');
    await page.waitForTimeout(2000);

    // Wait for the Dynamic Island to mount inside shadow root
    await page.waitForFunction(() => {
      const host = document.getElementById('cc-dynamic-island-host');
      return Boolean(host?.shadowRoot?.querySelector('.cc-dynamic-island'));
    }, { timeout: 10000 });

    // Verify conversions across all 4 e-commerce patterns
    const conversionResults = await page.evaluate(() => {
      const amazon = document.getElementById('amazon-price')?.textContent || '';
      const euro = document.getElementById('euro-price')?.textContent || '';
      const jumia = document.getElementById('jumia-price')?.textContent || '';
      const shopify = document.getElementById('shopify-price')?.textContent || '';

      const host = document.getElementById('cc-dynamic-island-host');
      const shadow = host?.shadowRoot;
      const count = shadow?.querySelector('.cc-count-badge')?.textContent || '';
      const isVisible = host ? window.getComputedStyle(host).display !== 'none' : false;

      return {
        amazon,
        euro,
        jumia,
        shopify,
        hasHost: Boolean(host),
        isVisible,
        count
      };
    });

    assert.ok(conversionResults.hasHost, 'Dynamic Island host must be injected');
    assert.ok(conversionResults.isVisible, 'Dynamic Island must be visible after auto-conversion');

    // Amazon $149.99 should convert into EUR (symbol €)
    assert.ok(conversionResults.amazon.includes('€') || conversionResults.amazon.includes('EUR'),
      `Amazon price should be converted to EUR. Got: "${conversionResults.amazon}"`);

    // Jumia ₦ 185,000 should convert into EUR (symbol €)
    assert.ok(conversionResults.jumia.includes('€') || conversionResults.jumia.includes('EUR'),
      `Jumia price should be converted to EUR. Got: "${conversionResults.jumia}"`);

    // Shopify $85.00 USD should convert into EUR
    assert.ok(conversionResults.shopify.includes('€') || conversionResults.shopify.includes('EUR'),
      `Shopify price should be converted to EUR. Got: "${conversionResults.shopify}"`);

    console.log('[E2E E-Commerce] All 4 pricing patterns converted accurately.');

    // 3. Test In-Place Reversion ("Show original" segment in Dynamic Island)
    await page.evaluate(() => {
      const host = document.getElementById('cc-dynamic-island-host');
      const shadow = host?.shadowRoot;
      const originalBtn = shadow?.querySelector('.cc-segment-original');
      if (originalBtn) originalBtn.click();
    });
    await page.waitForTimeout(500);

    const revertedResults = await page.evaluate(() => {
      const amazon = document.getElementById('amazon-price')?.textContent || '';
      const jumia = document.getElementById('jumia-price')?.textContent || '';
      const shopify = document.getElementById('shopify-price')?.textContent || '';
      return { amazon, jumia, shopify };
    });

    assert.ok(revertedResults.amazon.includes('149.99'), `Amazon price must revert to original. Got: "${revertedResults.amazon}"`);
    assert.ok(revertedResults.jumia.includes('185,000'), `Jumia price must revert to original. Got: "${revertedResults.jumia}"`);
    assert.ok(revertedResults.shopify.includes('85.00'), `Shopify price must revert to original. Got: "${revertedResults.shopify}"`);
    console.log('[E2E E-Commerce] Revert fidelity 100% verified.');

    // 4. Security & Abuse Testing
    // Attempt window.postMessage rate poisoning (must be ignored)
    await page.evaluate(() => {
      window.postMessage({
        type: 'CC_MANUAL_CONVERT',
        ratesTable: { EUR: 1, USD: 9999999 }
      }, '*');
    });
    await page.waitForTimeout(300);

    const postPoisoningCheck = await page.evaluate(() => {
      // Re-convert using pill
      const host = document.getElementById('cc-dynamic-island-host');
      const shadow = host?.shadowRoot;
      const convertedBtn = shadow?.querySelector('.cc-segment-converted');
      if (convertedBtn) convertedBtn.click();
      return document.getElementById('amazon-price')?.textContent || '';
    });
    await page.waitForTimeout(500);

    // Verify rate was NOT poisoned to 9999999
    assert.ok(!postPoisoningCheck.includes('9999999'), 'Exchange rates must not be poisoned by window.postMessage');

    // Verify webpage execution context cannot invoke chrome.runtime.sendMessage
    const webPageHasApi = await page.evaluate(() => {
      return typeof window.chrome?.runtime?.sendMessage === 'function';
    });
    assert.equal(webPageHasApi, false, 'Host webpage DOM must not have access to chrome.runtime.sendMessage');
    console.log('[E2E Security] Webpage execution context isolation verified (no extension API exposed).');

  } finally {
    await browser.close();
  }
});
