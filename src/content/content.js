// src/content/content.js
import { PageScanner } from './scanner.js';
import { InPageUI } from './ui.js';
import { MSG } from '../shared/messaging.js';
import { sendMessage, getBrowser } from '../shared/browser.js';
import { shouldAutoConvertPage, SETTINGS_STORAGE_KEY } from '../shared/settings.js';

// Inlined ui.css for complete self-contained Shadow DOM isolation
import uiCssText from './ui.css';

let currentScanner = null;
let currentUI = null;
let isConverted = false;
let globalRates = null;
let rateDate = null;
let rateProvider = null;
let currentSettings = null;
let cachedSettings = null;
let lastTooltipHideTime = 0;

// Theme and crypto settings for the in-page pill. Loaded on demand so the
// first paint already matches the user's choice (currentSettings is only populated by live
// storage changes and must not silently alter conversion fallbacks).
let pillThemeSetting = null;
let pillCryptoSetting = null;

const api = getBrowser();

const THEME_LOAD_TIMEOUT_MS = 800;

function resolvePillTheme() {
  return currentSettings?.theme || pillThemeSetting || 'system';
}

function resolvePillCrypto() {
  if (typeof currentSettings?.showCrypto === 'boolean') return currentSettings.showCrypto;
  if (typeof pillCryptoSetting === 'boolean') return pillCryptoSetting;
  return false;
}

/**
 * Fetches the saved settings (theme, showCrypto) once. Never throws and never blocks conversion for long:
 * on failure or timeout the pill falls back to defaults.
 */
async function ensurePillSettings() {
  if (cachedSettings && (currentSettings?.theme || pillThemeSetting) && (currentSettings?.showCrypto !== undefined || pillCryptoSetting !== null)) return;
  try {
    const settings = await Promise.race([
      sendMessage({ type: MSG.GET_SETTINGS }),
      new Promise((resolve) => setTimeout(() => resolve(null), THEME_LOAD_TIMEOUT_MS))
    ]);
    if (settings) {
      cachedSettings = settings;
      if (typeof settings.theme === 'string') {
        pillThemeSetting = settings.theme;
      }
      if (typeof settings.showCrypto === 'boolean') {
        pillCryptoSetting = settings.showCrypto;
      }
    }
  } catch {
    // Non-fatal: keep following default settings.
  }
}

function notifyBackgroundOfStatus() {
  try {
    sendMessage({
      type: MSG.PAGE_STATUS,
      payload: {
        isConverted,
        count: currentScanner ? currentScanner.convertedCount : 0,
        targetCurrency: currentScanner ? currentScanner.targetCurrency : null
      }
    }).catch(() => {});
  } catch {}
}

function ensureHighlightStyles(doc = document) {
  if (!doc || doc.getElementById('cc-highlight-styles')) return;
  const style = doc.createElement('style');
  style.id = 'cc-highlight-styles';
  style.textContent = `
    .cc-price-highlight {
      background-color: rgba(30, 107, 82, 0.10) !important;
      border-bottom: 1.5px dashed #1E6B52 !important;
      border-radius: 2px !important;
      padding: 0 2px !important;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
      cursor: help !important;
      transition: background-color 140ms ease !important;
    }
    @media (hover: hover) and (pointer: fine) {
      .cc-price-highlight:hover {
        background-color: rgba(30, 107, 82, 0.18) !important;
      }
    }
    @media (prefers-color-scheme: dark) {
      .cc-price-highlight {
        background-color: rgba(111, 211, 166, 0.15) !important;
        border-bottom-color: #6FD3A6 !important;
      }
      @media (hover: hover) and (pointer: fine) {
        .cc-price-highlight:hover {
          background-color: rgba(111, 211, 166, 0.25) !important;
        }
      }
    }
  `;
  (doc.head || doc.documentElement).appendChild(style);
}

async function performConversion(options = {}) {
  if (!currentSettings && !cachedSettings) {
    await ensurePillSettings();
  }
  const settingsSource = currentSettings || cachedSettings;
  const targetCurrency = options.targetCurrency || settingsSource?.targetCurrency || 'USD';
  const displayMode = options.displayMode || settingsSource?.displayMode || 'replace';
  if (displayMode === 'replace_highlight') {
    ensureHighlightStyles(document);
  }
  const roundWhole = options.roundWhole !== undefined ? options.roundWhole : (settingsSource?.roundWhole || false);
  const showInPageBar = options.showInPageBar !== undefined ? options.showInPageBar : (settingsSource?.showInPageBar !== false);
  const hostname = (typeof window !== 'undefined' && window.location?.hostname)
    ? window.location.hostname.replace(/^www\./, '').toLowerCase()
    : '';
  const siteOverride = options.siteOverride !== undefined
    ? options.siteOverride
    : (settingsSource?.perSite?.[hostname]?.assumedCurrency ?? currentScanner?.context?.siteOverride ?? null);
  const ambiguousDollarSetting = options.ambiguousDollarSetting !== undefined
    ? options.ambiguousDollarSetting
    : (settingsSource?.ambiguousDollar ?? currentScanner?.context?.ambiguousDollarSetting ?? 'USD');

  // Fetch rates if not cached in memory
  if (options.ratesTable) {
    globalRates = options.ratesTable;
    rateDate = options.rateDate || rateDate;
    rateProvider = options.provider || rateProvider;
  } else if (!globalRates || options.forceRefreshRates) {
    try {
      const response = await sendMessage({ type: MSG.GET_RATES });
      if (response && response.rates) {
        globalRates = response.rates;
        rateDate = response.date;
        rateProvider = response.provider;
      }
    } catch (err) {
      if (typeof window !== 'undefined' && window.mockRates) {
        globalRates = window.mockRates;
        rateDate = new Date().toISOString().split('T')[0];
        rateProvider = 'ECB (Mock)';
      } else {
        console.warn('[CurrencyConverter] Could not fetch rates from background:', err.message);
        return { success: false, error: err.message };
      }
    }
  }

  if (!globalRates) {
    return { success: false, error: 'Rates unavailable' };
  }

  // Recreate scanner if target currency, display mode, rounding, or currency disambiguation context changed
  const scannerNeedsRecreate =
    !currentScanner ||
    currentScanner.targetCurrency !== targetCurrency.toUpperCase() ||
    currentScanner.displayMode !== displayMode ||
    Boolean(currentScanner.roundWhole) !== Boolean(roundWhole) ||
    (currentScanner.context?.siteOverride || null) !== (siteOverride || null) ||
    (currentScanner.context?.ambiguousDollarSetting || 'USD') !== (ambiguousDollarSetting || 'USD');

  if (scannerNeedsRecreate) {
    if (currentScanner) {
      currentScanner.revert();
    }

    currentScanner = new PageScanner({
      doc: document,
      targetCurrency,
      ratesTable: globalRates,
      displayMode,
      roundWhole,
      context: {
        siteOverride: siteOverride || null,
        ambiguousDollarSetting: ambiguousDollarSetting || 'USD'
      },
      rateDate,
      provider: rateProvider,
      onConvertedCountChange: (count) => {
        if (currentUI) {
          currentUI.update({ mode: 'converted', count, isConverted: true });
        }
        notifyBackgroundOfStatus();
      }
    });

    currentScanner.convert();
  } else {
    // Same configuration: scan incrementally for newly added elements or after revert
    currentScanner.convert();
  }

  isConverted = true;
  currentScanner.startObserving();

  const convertedCount = currentScanner.convertedCount;

  // Mount or update Dynamic Island pill
  const isManual = Boolean(options.manual);
  const shouldShowPill = showInPageBar && (convertedCount > 0 || isManual);

  const primarySourceCurrency = currentScanner?.primarySourceCurrency ||
    (currentScanner?.detectedCurrencies && Array.from(currentScanner.detectedCurrencies)[0]) ||
    null;

  if (shouldShowPill) {
    // Resolve the saved theme before the first paint (no-op once known). The create check below
    // runs synchronously after this await, so concurrent conversions cannot mount two pills.
    if (!currentUI) await ensurePillSettings();
    const effectiveCrypto = resolvePillCrypto();
    if (!currentUI) {
      currentUI = new InPageUI({
        doc: document,
        mode: 'converted',
        targetCurrency,
        sourceCurrency: primarySourceCurrency,
        isConverted: true,
        convertedCount,
        rateDate,
        provider: rateProvider,
        theme: resolvePillTheme(),
        showCrypto: effectiveCrypto,
        autoCollapse: true,
        onShowOriginal: () => {
          performRevert();
        },
        onConvert: (cur) => {
          performConversion({ targetCurrency: cur, manual: true });
        },
        onChangeCurrency: (newCur) => {
          performConversion({ targetCurrency: newCur, manual: true });
        },
        onAcceptOffer: (cur) => {
          performConversion({ targetCurrency: cur, manual: true });
        },
        onAlwaysOnSite: (cur) => {
          if (hostname) {
            sendMessage({ type: MSG.ACCEPT_ALWAYS_SITE, payload: { hostname } }).catch(() => {});
          }
          performConversion({ targetCurrency: cur, manual: true });
        },
        onDismissOffer: () => {
          if (hostname) {
            sendMessage({ type: MSG.DISMISS_OFFER, payload: { hostname } }).catch(() => {});
          }
        }
      });
      currentUI.mount(uiCssText);
    } else {
      currentUI.update({
        mode: 'converted',
        isConverted: true,
        targetCurrency,
        sourceCurrency: primarySourceCurrency,
        count: convertedCount,
        rateDate,
        provider: rateProvider,
        theme: resolvePillTheme(),
        showCrypto: effectiveCrypto
      });
    }

    if (isManual) {
      currentUI.show();
    } else if (convertedCount > 0 && !currentUI.isDismissedForSession) {
      currentUI.show();
    }
  } else {
    // If a scan finishes with 0 foreign conversions and not manual, hide the pill.
    if (currentUI && convertedCount === 0 && !isManual) {
      currentUI.hide();
    }
  }

  notifyBackgroundOfStatus();
  return {
    success: true,
    count: convertedCount,
    convertedCount,
    targetCurrency,
    alreadyTarget: convertedCount === 0,
    ratesDate: rateDate,
    ratesProvider: rateProvider
  };
}

function performRevert() {
  if (currentScanner) {
    currentScanner.revert();
    currentScanner.stopObserving();
  }
  isConverted = false;
  if (currentUI) {
    currentUI.update({ mode: 'converted', isConverted: false, count: 0 });
  }
  notifyBackgroundOfStatus();
  return { success: true, count: 0 };
}

async function performOffer(options = {}) {
  if (isConverted) {
    return { success: true, offered: false, alreadyConverted: true };
  }
  if (!currentSettings && !cachedSettings) {
    await ensurePillSettings();
  }
  const settingsSource = currentSettings || cachedSettings;
  const showInPageBar = options.showInPageBar !== undefined
    ? options.showInPageBar
    : (settingsSource?.showInPageBar !== false);
  if (!showInPageBar) {
    return { success: true, offered: false, count: 0 };
  }

  const targetCurrency = options.targetCurrency || settingsSource?.targetCurrency || 'USD';
  const hostname = (typeof window !== 'undefined' && window.location?.hostname)
    ? window.location.hostname.replace(/^www\./, '').toLowerCase()
    : '';
  const siteOverride = options.siteOverride !== undefined
    ? options.siteOverride
    : (settingsSource?.perSite?.[hostname]?.assumedCurrency ?? null);
  const ambiguousDollarSetting = options.ambiguousDollarSetting !== undefined
    ? options.ambiguousDollarSetting
    : (settingsSource?.ambiguousDollar ?? 'USD');
  const minThreshold = options.minCandidateThreshold !== undefined ? options.minCandidateThreshold : 3;

  const dryScanner = new PageScanner({
    doc: document,
    targetCurrency,
    context: {
      siteOverride: siteOverride || null,
      ambiguousDollarSetting: ambiguousDollarSetting || 'USD'
    }
  });

  const { count, primaryCurrency } = dryScanner.scanCandidates(document.body);
  if (count < minThreshold) {
    return { success: true, offered: false, count };
  }

  await ensurePillSettings();
  const effectiveCrypto = resolvePillCrypto();

  if (!currentUI) {
    currentUI = new InPageUI({
      doc: document,
      mode: 'offer',
      targetCurrency,
      sourceCurrency: primaryCurrency,
      isConverted: false,
      convertedCount: count,
      theme: resolvePillTheme(),
      showCrypto: effectiveCrypto,
      autoCollapse: true,
      onShowOriginal: () => {
        performRevert();
      },
      onConvert: (cur) => {
        performConversion({ targetCurrency: cur, manual: true });
      },
      onChangeCurrency: (newCur) => {
        performConversion({ targetCurrency: newCur, manual: true });
      },
      onAcceptOffer: (cur) => {
        performConversion({ targetCurrency: cur, manual: true });
      },
      onAlwaysOnSite: (cur) => {
        if (hostname) {
          sendMessage({ type: MSG.ACCEPT_ALWAYS_SITE, payload: { hostname } }).catch(() => {});
        }
        performConversion({ targetCurrency: cur, manual: true });
      },
      onDismissOffer: () => {
        if (hostname) {
          sendMessage({ type: MSG.DISMISS_OFFER, payload: { hostname } }).catch(() => {});
        }
      }
    });
    currentUI.mount(uiCssText);
  } else {
    currentUI.update({
      mode: 'offer',
      isConverted: false,
      targetCurrency,
      sourceCurrency: primaryCurrency,
      count,
      theme: resolvePillTheme(),
      showCrypto: effectiveCrypto
    });
  }

  if (!currentUI.isDismissedForSession) {
    currentUI.show();
  }

  return {
    success: true,
    offered: !currentUI.isDismissedForSession,
    count,
    primaryCurrency,
    targetCurrency
  };
}

function initContentScript() {
  void ensurePillSettings();
  // Tooltip event delegation with 0ms warmup when moving between prices within 400ms
  document.addEventListener('mouseover', (e) => {
    if (!isConverted || !currentScanner || !currentUI) return;
    const target = e.target;
    if (!target || target.nodeType !== 1) return;

    const hoverHit = currentScanner.getHoverMetadata(target);
    if (!hoverHit) return;

    const { element: anchorEl, meta } = hoverHit;
    if (meta) {
      const isWarm = (Date.now() - lastTooltipHideTime) <= 400 || currentUI.tooltipElement?.classList.contains('visible');
      if (currentUI.tooltipElement) {
        currentUI.tooltipElement.style.transition = isWarm ? 'none' : '';
      }
      currentUI.showTooltip({
        originalAmount: meta.originalAmount,
        originalCurrency: meta.originalCurrency,
        convertedAmount: meta.convertedAmount,
        rate: meta.rate,
        date: meta.date,
        targetElement: anchorEl,
        x: e.clientX,
        y: e.clientY
      });
    }
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    if (!isConverted || !currentScanner || !currentUI) return;
    const target = e.target;
    if (!target || target.nodeType !== 1) return;

    if (currentScanner.getHoverMetadata(target)) {
      lastTooltipHideTime = Date.now();
      currentUI.hideTooltip();
    }
  }, { passive: true });

  // Message receiver from popup and background
  if (api && api.runtime && api.runtime.onMessage) {
    api.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || !message.type) return;

      if (message.type === MSG.CONVERT_PAGE) {
        performConversion(message.payload || {})
          .then(result => sendResponse(result))
          .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // Keep channel open for async response
      }

      if (message.type === MSG.OFFER_PAGE) {
        performOffer(message.payload || {})
          .then(result => sendResponse(result))
          .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
      }

      if (message.type === MSG.REVERT_PAGE) {
        const res = performRevert();
        sendResponse(res);
        return false;
      }

      if (message.type === MSG.GET_PAGE_STATUS) {
        sendResponse({
          isConverted,
          count: currentScanner ? currentScanner.convertedCount : 0,
          targetCurrency: currentScanner ? currentScanner.targetCurrency : null,
          rateDate,
          rateProvider
        });
        return false;
      }
    });
  }

  // Live storage synchronization from options and popup
  if (api && api.storage && api.storage.onChanged) {
    api.storage.onChanged.addListener((changes, area) => {
      if ((area === 'local' || area === 'sync') && changes[SETTINGS_STORAGE_KEY]) {
        const nextSettings = changes[SETTINGS_STORAGE_KEY].newValue;
        if (!nextSettings) return;
        currentSettings = nextSettings;
        cachedSettings = nextSettings;
        if (currentUI) {
          if (currentSettings.theme) {
            pillThemeSetting = currentSettings.theme;
          }
          if (typeof currentSettings.showCrypto === 'boolean') {
            pillCryptoSetting = currentSettings.showCrypto;
          }
          currentUI.update({
            theme: currentSettings.theme,
            showCrypto: currentSettings.showCrypto
          });
        }
        if (isConverted && currentScanner) {
          const host = (typeof window !== 'undefined' && window.location?.hostname)
            ? window.location.hostname.replace(/^www\./, '').toLowerCase()
            : '';
          const nextSiteOverride = (host && nextSettings.perSite?.[host]?.assumedCurrency) || null;
          const nextAmbiguous = nextSettings.ambiguousDollar || 'USD';
          const configChanged =
            (nextSettings.displayMode && nextSettings.displayMode !== currentScanner.displayMode) ||
            (typeof nextSettings.roundWhole === 'boolean' && nextSettings.roundWhole !== Boolean(currentScanner.roundWhole)) ||
            nextSiteOverride !== (currentScanner.context?.siteOverride || null) ||
            nextAmbiguous !== (currentScanner.context?.ambiguousDollarSetting || 'USD');
          if (configChanged) {
            void performConversion({
              targetCurrency: currentScanner.targetCurrency,
              displayMode: nextSettings.displayMode,
              roundWhole: nextSettings.roundWhole,
              siteOverride: nextSiteOverride,
              ambiguousDollarSetting: nextAmbiguous
            });
          }
        }
      }
    });
  }
}

// Top-level idempotency guard: re-injection is a clean no-op leaving existing instance intact
// Top frame only: iframes are not converted for now
if (typeof window !== 'undefined') {
  if (window !== window.top) {
    // Child frame / iframe: do not mount or run
  } else if (window.__CC_CONTENT_SCRIPT_INJECTED__) {
    // Already initialized in this frame; do nothing
  } else {
    window.__CC_CONTENT_SCRIPT_INJECTED__ = true;
    initContentScript();
  }
}
