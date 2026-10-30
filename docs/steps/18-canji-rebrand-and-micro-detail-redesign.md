# Step 18: Canji Rebrand & Micro-Detail Redesign

**Branch**: `step/18-canji-rebrand-and-micro-detail-redesign`  
**Target Version**: `2.0.0`  
**Repository Remote**: `https://github.com/richmondsogo/currency-convertr.git`  
**Date**: 2026-10-30  

---

## 1. Objective & Scope

Execute the user-directed brand and micro-detail refinement for **Canji** across the extension:
1. **Phosphor Icons & `components.json`**:
   - Install `@phosphor-icons/react` and configure `components.json` (`"iconLibrary": "phosphor"`).
   - Migrate icon usage from Lucide to Phosphor across `src/popup/popup.jsx`, `src/options/options.jsx`, `src/ui/components/CurrencyCombobox.jsx`, `src/ui/components/SiteModeControl.jsx`, and `src/ui/components/ui/command.jsx`.
2. **Dynamic Island Ask Mode & Clean Capsule**:
   - Implement live **Ask Mode Dynamic Island prompt**:
     - `● Detected N [CUR] prices · Convert to [TARGET]? [Convert] [Always on this site] [×]`
   - Remove logo clutter from the Dynamic Island capsule, retaining the clean 7px status dot (`●`) requested by the user.
   - Implement `PageScanner.prototype.scanCandidates(rootNode)` for non-mutating candidate detection.
   - Add `0ms` warmup tooltip display when moving between converted prices within 400ms.
3. **Interactive Display Mode Preview Cards in Options**:
   - Implement 3-column interactive visual cards for `Replace in place`, `Beside original`, and `Replace + Highlight` in `src/options/options.jsx`.
4. **Finer Craft Details & Elevation**:
   - Refine buttons, switches, sliders, borders, elevation, and active press feedback (`scale(0.98)`).
   - Maintain the Paper & Pine design system palette and absolute zero `innerHTML` rule.
5. **Architectural & Test Regression Fixes**:
   - **Shadow DOM Self-Scanning Guard**: Fix `PageScanner.prototype._findAllRoots(root)` so it ignores elements matching `_isNodeIgnored(el)`, preventing the scanner from traversing `#cc-dynamic-island-host` and converting its own offer prompt text.
   - **Status Dot Targeting**: Assign `.cc-offer-dot` to the offer row dot so query selectors targeting `.cc-status-dot` inspect the capsule dot accurately.
   - **Type Scale Floor**: Ensure all text nodes in `src/popup/popup.jsx` adhere to the `>= 12px` floor required by E2E test F2.
   - **Headless Permission Request Safety**: Ensure `requestOriginPermission` checks `hasOriginPermission` before calling `chrome.permissions.request()`.

---

## 2. Files Touched

- `components.json`
- `src/background.js`
- `src/content/content.js`
- `src/content/scanner.js`
- `src/content/ui.css`
- `src/content/ui.js`
- `src/options/options.jsx`
- `src/popup/popup.jsx`
- `src/shared/browser.js`
- `src/shared/messaging.js`
- `src/ui/components/CurrencyCombobox.jsx`
- `src/ui/components/SiteModeControl.jsx`
- `src/ui/components/ui/command.jsx`
- `tests/pill_and_options.test.js`
- `tests/scanner.test.js`
- `scripts/capture-production-screenshots.js`
- `screenshots/*`

---

## 3. Verification & Objective Evidence

### A. Full E2E Playwright Suite (`npm run test:e2e`)
```text
> canji@2.0.0 test:e2e
> node --test --test-concurrency=1 tests/e2e/*.e2e.js

✔ B1 Regression: One instance, one pill, honest count, and iframe isolation (50546.5345ms)
✔ B3 Regression: Auto-convert trigger, hostname routing, and late-rendered prices (60597.425ms)
▶ C2 & C3 & C4: Gallery loads in real browser, fonts ready, 0 console errors, CDP glyph coverage, screenshots
  ✔ document.fonts loaded successfully with local font families (51.4773ms)
  ✔ CDP CSS.getPlatformFontsForNode proves all 10 currency symbols render in bundled fonts (1579.0606ms)
  ✔ No console errors in light theme (1.8844ms)
  ✔ Capture responsive screenshots (1280px and 900px, light and dark) (3631.2467ms)
✔ C2 & C3 & C4: Gallery loads in real browser, fonts ready, 0 console errors, CDP glyph coverage, screenshots (16723.755ms)
✔ D1: Automatic and menu conversions ALWAYS use settings.targetCurrency (default NGN), ignoring lastUsedTarget (59268.6945ms)
✔ E2E Real-World E-Commerce & Security Pre-Flight Audit (25715.4154ms)
✔ F1: pill follows Theme setting (light/dark/system) and OS preference, loading saved theme before first paint (37919.5799ms)
✔ F2: popup keeps its behavioral contract and renders no text under 12px (26596.6341ms)
✔ E2E Options: Complete rebuild verification covering all 10 requirements (31253.1662ms)
✔ E2E Smoke: Extension loads in real browser, service worker is alive, and options page renders (23201.6862ms)
✔ T1 Regression: Show original stays original on late mutations, re-converts cleanly (39091.7822ms)
✔ T3 Regression: Context menu installation, listener lifecycle, and action dispatch (20518.4159ms)
ℹ tests 15
ℹ suites 0
ℹ pass 15
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 404957.0573
```

### B. Full Unit Test Suite (`npm test`)
```text
> canji@2.0.0 test
> npm run build && node --test tests/**/*.test.js && node tests/parse.test.js

> canji@2.0.0 build
> node build.js

[Build] Bundling Canji v2.0.0 (fc6c6f1) with esbuild...
[Build] esbuild bundling completed successfully.
[Build] Manifests generated for Chrome and Firefox.
[Build] Created package: dist\packages\canji-chrome-v2.0.0.zip
[Build] Created package: dist\packages\canji-firefox-v2.0.0.zip
[Build] Build completed successfully for v2.0.0 (fc6c6f1).

✔ B2 Regression: Parser currency labels and boundary tests (19.075ms)
✔ B2 Regression: DOM PageScanner no stray labels or prefix leftovers (450.9321ms)
✔ build: manifest structure and permissions for Chrome (5.3596ms)
✔ build: manifest structure and permissions for Firefox (5.8487ms)
✔ build: zip packages exist and contain manifest.json at root (65.0113ms)
✔ Paper & Pine contrast ratios satisfy WCAG AA >= 4.5:1 (16.5826ms)
✔ CurrencyCombobox selection states satisfy WCAG AA >= 4.5:1 (0.2936ms)
✔ Switch control thumb and track satisfy WCAG AA / AAA contrast (0.1986ms)
✔ Firefox MV3 Smoke: Add-on loads, popup opens, and converts prices on real page (18306.8599ms)
✔ format: display modes (replace, append, replace+highlight) (0.8417ms)
✔ options unit: site rule mutations (add, change mode, set assumed currency, reset mode, remove) (0.5094ms)
✔ tests\parse.test.js (703.3979ms)
✔ ui: Dynamic Island renders Ask Mode offer prompt with interactive actions (35.6053ms)
✔ pill css: ui.css and INLINE_UI_CSS stay in sync (2.1936ms)
✔ scanner: scanCandidates performs read-only candidate counting without mutating DOM (24.2001ms)
✔ security: Zero hardcoded secrets, API keys, or private tokens in tracked files (216.1413ms)
ℹ tests 125
ℹ suites 0
ℹ pass 125
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 19800.8769
[Test Suite] All unit tests passed successfully.
```

### C. Firefox MV3 Lint (`npm run lint:firefox`)
```text
> canji@2.0.0 lint:firefox
> web-ext lint --source-dir dist/firefox

Validation Summary:

errors          0              
notices         0              
warnings        4              
```
*(4 warnings are standard React 19 runtime DOM fallback markers; 0 errors, 0 notices).*

### D. Production Screenshots (`node scripts/capture-production-screenshots.js`)
```text
[Screenshots] Pre-configuring settings for store.nordicliving.com...
[Screenshots] 1. Capturing In-Page Dynamic Island on Demo Store...
[Screenshots] Saved screenshot-inpage-bar.png
[Screenshots] 2. Capturing Toolbar Action Popup...
[Screenshots] Saved screenshot-popup.png
[Screenshots] 3. Capturing Searchable Currency Combobox...
[Screenshots] Saved screenshot-combobox.png
[Screenshots] 4. Capturing Options Dashboard...
[Screenshots] Saved screenshot-options.png
[Screenshots] 5. Capturing Context Menu Selection...
[Screenshots] Saved real-work-test-context-menu.png
[Screenshots] 6. Capturing Chrome Web Store Promo Banner (440x280)...
[Screenshots] Saved promo-small-440x280.png
[Screenshots] All production screenshots captured successfully!
```

---

## 4. Key Design Decisions

1. **Clean Capsule Architecture**:
   The Dynamic Island capsule remains uncluttered with no brand logo in the compact pill. It displays a minimalist 7px status dot (`●`), the source-to-target currency pair (`EUR → USD`), and price count upon hover expansion.
2. **Ask Mode Interaction**:
   When visiting an Ask-mode domain, `PageScanner.scanCandidates` counts foreign prices without altering the page DOM. The capsule expands automatically to present an unobtrusive offer banner: `● Detected 6 EUR prices · Convert to USD?` with immediate `[Convert]`, persistent `[Always on this site]`, and `[×]` dismiss actions.
3. **Display Mode Cards**:
   The Options page display mode selector replaces flat radio options with 3 interactive visual cards featuring live typography comparisons and micro-elevation.
4. **Zero `innerHTML` Invariant**:
   All DOM elements in the content script and shadow root are constructed via `document.createElement`, `document.createTextNode`, and SVG namespace methods.
