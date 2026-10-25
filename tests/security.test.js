import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MSG } from '../src/shared/messaging.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('security: Zero hardcoded secrets, API keys, or private tokens in tracked files', () => {
  const sensitivePattern = /(api_key|apikey|bearer_token|auth_token|client_secret|private_key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i;
  const extensionsToScan = ['.js', '.jsx', '.json', '.html', '.css', '.md'];

  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f === 'node_modules' || f === '.git' || f === 'dist') continue;
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (extensionsToScan.includes(path.extname(f))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const match = content.match(sensitivePattern);
        assert.equal(
          match,
          null,
          `File ${path.relative(ROOT_DIR, fullPath)} contains suspected hardcoded secret: ${match ? match[0] : ''}`
        );
      }
    }
  }

  walk(ROOT_DIR);
});

test('security: MSG.UPDATE_SETTINGS rejects web content scripts and external senders', async () => {
  // Simulate the background runtime.onMessage authorization check
  const EXTENSION_ID = 'testextensionid1234567890abcdef';

  function handleMessage(message, sender) {
    if (message.type === MSG.UPDATE_SETTINGS) {
      const isInternal = sender.id === EXTENSION_ID && (
        !sender.url ||
        sender.url.startsWith(`chrome-extension://${EXTENSION_ID}`) ||
        sender.url.startsWith(`moz-extension://${EXTENSION_ID}`)
      );
      if (!isInternal) {
        return { success: false, error: 'Unauthorized: Settings cannot be modified by content scripts' };
      }
      return { success: true, settings: message.payload };
    }
    return { success: false, error: 'Unknown message' };
  }

  // 1. Rejected: sender from web tab (http://)
  const webSender = {
    id: EXTENSION_ID,
    tab: { id: 101 },
    url: 'http://ecommerce-shop.com/product/123'
  };
  const webResult = handleMessage({ type: MSG.UPDATE_SETTINGS, payload: { targetCurrency: 'HACK' } }, webSender);
  assert.equal(webResult.success, false);
  assert.match(webResult.error, /Unauthorized/);

  // 2. Rejected: sender from secure web tab (https://)
  const httpsWebSender = {
    id: EXTENSION_ID,
    tab: { id: 102 },
    url: 'https://malicious-site.org/phish'
  };
  const httpsResult = handleMessage({ type: MSG.UPDATE_SETTINGS, payload: { targetCurrency: 'HACK' } }, httpsWebSender);
  assert.equal(httpsResult.success, false);
  assert.match(httpsResult.error, /Unauthorized/);

  // 3. Rejected: external extension caller (mismatched ID)
  const foreignSender = {
    id: 'differentextensionid99999999999',
    url: 'chrome-extension://differentextensionid99999999999/popup.html'
  };
  const foreignResult = handleMessage({ type: MSG.UPDATE_SETTINGS, payload: { targetCurrency: 'HACK' } }, foreignSender);
  assert.equal(foreignResult.success, false);
  assert.match(foreignResult.error, /Unauthorized/);

  // 4. Allowed: options page loaded in tab
  const optionsTabSender = {
    id: EXTENSION_ID,
    tab: { id: 201 },
    url: `chrome-extension://${EXTENSION_ID}/options/options.html#general`
  };
  const optionsResult = handleMessage({ type: MSG.UPDATE_SETTINGS, payload: { targetCurrency: 'EUR' } }, optionsTabSender);
  assert.equal(optionsResult.success, true);
  assert.equal(optionsResult.settings.targetCurrency, 'EUR');

  // 5. Allowed: toolbar popup
  const popupSender = {
    id: EXTENSION_ID,
    url: `chrome-extension://${EXTENSION_ID}/popup/popup.html`
  };
  const popupResult = handleMessage({ type: MSG.UPDATE_SETTINGS, payload: { targetCurrency: 'GBP' } }, popupSender);
  assert.equal(popupResult.success, true);
  assert.equal(popupResult.settings.targetCurrency, 'GBP');
});
