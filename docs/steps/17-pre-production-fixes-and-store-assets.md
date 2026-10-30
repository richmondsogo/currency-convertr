# Step 17: Pre-Production Audit Fixes, Canji Rebrand & Store Asset Verification

**Branch**: `step/17-pre-production-fixes-and-store-assets`  
**Pull Request**: [#23](https://github.com/richmondsogo/currency-convertr/pull/23)  
**First Commit**: `0b69be2`  
**Last Commit**: `0b69be2`  
**Merge Commit**: `5bb5d62`  
**Target Version**: `2.0.0`  
**Repository Remote**: `https://github.com/richmondsogo/currency-convertr.git`  
**Date**: 2026-10-30  

---

## 1. Objective & Scope

Resolve all findings uncovered during the pre-production codebase and live-browser dogfooding audit across four categories:

### A. Absolutely Do Better (Critical Functional & Store Readiness Fixes)
1. **End-to-End `assumedCurrency` (`siteOverride`) & `ambiguousDollar` (`ambiguousDollarSetting`) Wiring**:
   - Pass `{ siteOverride, ambiguousDollarSetting }` context into `new PageScanner(...)` in `src/content/content.js`.
   - Include `siteOverride` and `ambiguousDollarSetting` in `MSG.CONVERT_PAGE` payloads from both `src/background.js` (`convertPageOnTab`) and `src/popup/popup.jsx`.
   - Re-trigger conversion immediately in `src/popup/popup.jsx` (`handleAssumedCurrencyChange`) when the user changes "Prices on this site are in" while a page is already converted.
2. **In-Page Hover Tooltips on Standard Text-Node Prices in `Replace` & `Append` Modes**:
   - Add `PageScanner.prototype.getHoverMetadata(target)` in `src/content/scanner.js` so `mouseover` and `mouseout` delegation in `src/content/content.js` resolves metadata both on `[data-cc-converted]` wrapper elements (`replace_highlight` and split-element prices) and on elements whose direct child `Text` node was converted in-place (`replace` and `append` modes).
3. **Dynamic Island `.cc-expanded` State While Currency Popover Menu Is Open**:
   - Toggle `.cc-expanded` on `this.barElement` in `_openPopover()` and `_closePopover()` in `src/content/ui.js` so the Dynamic Island capsule stays expanded while focus moves into the sibling `.cc-popover-menu` search input or list items.
4. **Chrome Web Store `1280x800` Screenshots & Unclipped Framing**:
   - Update `scripts/capture-production-screenshots.js` so all 5 screenshots (`screenshot-inpage-bar.png`, `screenshot-popup.png`, `screenshot-combobox.png`, `screenshot-options.png`, `real-work-test-context-menu.png`) render at exact `1280x800` Chrome Web Store dimensions with visible hover tooltips, active per-site controls, and unclipped context menus.
5. **Out-of-the-Box Firefox 140+ Smoke Test Reliability (`npm test`)**:
   - Set `process.env.MOZ_REMOTE_ALLOW_SYSTEM_ACCESS = '1'` in `tests/firefox-smoke.test.js` so Marionette `driver.setContext('chrome')` succeeds automatically during `npm test`.

### B. Do Better (UX, State Sync & Edge-Case Improvements)
1. **Live Scanner Reconfiguration & Storage Sync (`src/content/content.js`)**:
   - Recreate `PageScanner` whenever `targetCurrency`, `displayMode`, `roundWhole`, `siteOverride`, or `ambiguousDollarSetting` changes (cleaning up prior conversions via `currentScanner.revert()` first).
   - Re-run conversion automatically in `storage.onChanged` when `displayMode`, `roundWhole`, `ambiguousDollar`, or per-site `assumedCurrency` changes while the page is converted.
2. **Collapsed Mini-Pill Drag vs. Click Suppression (`src/content/ui.js`)**:
   - Guard `.cc-collapsed-pill` click handler with `if (this.hasMovedDrag)` so dragging the collapsed pill does not immediately expand it on pointer release.
3. **Dynamic Island Popover Keyboard Navigation & Tooltip Edge Cases (`src/content/ui.js`, `src/content/ui.css`)**:
   - Support `ArrowDown` and `ArrowUp` keyboard navigation across `.cc-popover-item` buttons and back to `.cc-popover-search`.
   - Add `.cc-tooltip.flipped .cc-tooltip-caret` rule to `src/content/ui.css` and `INLINE_UI_CSS` in `src/content/ui.js`.
   - Format sub-cent exchange rates (`rate < 0.01`) with `toPrecision(4)` in `showTooltip` so low-unit currencies (`IDR`, `VND`, `NGN`, `JPY`) and crypto (`BTC`, `ETH`) never display `0.0000`.
4. **Context Menu Selection Conversion Settings Parity (`src/background.js`)**:
   - Pass `{ siteOverride, ambiguousDollarSetting }` to `detectCurrency` and `{ roundWhole: Boolean(settings.roundWhole) }` to `formatCurrency` in `handleSelectionConversion`.
5. **Options Per-Site `"Always"` Origin Permission Request (`src/options/options.jsx`)**:
   - Request origin permission (`https://${domain}/*`) when adding or updating a site rule to `"always"` in Options → Sites, matching Popup behavior.

### C. Minor Corrections (Links, Copy, Dead Files & Design System Alignment)
1. Fix GitHub repository URLs in `src/options/options.jsx` (`currency-converter-v2` -> `currency-convertr`).
2. Update stale `"OLED Dynamic Island"` copy in `src/options/options.jsx` to `"Paper & Pine Dynamic Island"`.
3. Remove unused legacy stylesheet `src/popup/popup.css`.
4. Wire `validateImportContent` in `src/options/options.jsx` (`handleImportJson`) and remove unused imports.
5. Align Pinned Currencies and About rows in `src/options/options.jsx` with the `DESIGN.md` §4 flat hairline rule.
6. Synchronize `CONTEXT.md` and `CHROMEWEBSTORE.md` with current architecture, permissions, and Step 15–17 index.

### D. Canji Rebrand, Optical Symbol System & UI/UX Redesign
1. **Rebrand to Canji (`canji` — *"Prices, in your currency"*)**:
   - Installed pre-rendered extension icons (`16px`, `32px`, `48px`, `128px`) from `canji-kit/icons/extension/` into `src/icons/`.
   - Created `src/ui/components/CanjiLogo.jsx` implementing `<CanjiSymbol cut="small" | "main" | "feature" />` and `<CanjiLockup />` with the 3 optical cuts from `canji-kit/symbol/`.
   - Updated `package.json`, `build.js`, `src/background.js`, `README.md`, `CHROMEWEBSTORE.md`, `CONTEXT.md`, and `DESIGN.md` with the `Canji` brand identity and `canji-chrome-v2.0.0.zip` / `canji-firefox-v2.0.0.zip` package names.
2. **Popup, Dynamic Island Pill & Options UI/UX Redesign**:
   - Added a collapsible **Quick Scratchpad Calculator** (`#btn-toggle-scratchpad`, `#scratchpad-amount-input`, click-to-copy badge) and unified **"This site"** card in `src/popup/popup.jsx`.
   - Mounted `createCanjiSmallMark` (`svg.cc-brand-mark` via `document.createElementNS`, zero `innerHTML`) in `.cc-island-compact` and `.cc-collapsed-pill` in `src/content/ui.js`, and upgraded `.cc-tooltip-title` to show `Original: €249.00 → $277.14`.
   - Upgraded **Appearance → Display Mode** in `src/options/options.jsx` into 3-column interactive visual preview cards and added a 72px Feature-cut **Canji Brand Hero** in **About**.
3. **Repaired `components.json`**:
   - Updated `"iconLibrary"` to `"lucide"`, `"style"` to `"new-york"`, fixed `@coss` and `@cultui` registry URLs, and removed dead `@originui` / `@twentyone` endpoints.

---

## 2. Files Touched

- `src/content/scanner.js`
- `src/content/content.js`
- `src/content/ui.js`
- `src/content/ui.css`
- `src/background.js`
- `src/popup/popup.jsx`
- `src/options/options.jsx`
- `src/popup/popup.css` (deleted)
- `scripts/capture-production-screenshots.js`
- `screenshots/*`
- `tests/firefox-smoke.test.js`
- `tests/scanner.test.js`
- `tests/ui.test.js`
- `CONTEXT.md`
- `CHROMEWEBSTORE.md`

---

## 3. Verification & Objective Evidence

### A. Live Dogfooding Verification (`node scratch/dogfood.js`)
```text
Extension ID: ddkbifkdgpmbaogfabockohogbhkkemh
1a. First price (text node): $277.14 | Second price (split element): $756.84
1b. Tooltip visible on standard text-node price (.price-main[0]): true
1c. Tooltip visible on split-element price (.price-main[1]): {
  visible: true,
  text: 'Original: €680.001 EUR = 1.1130 USD · Rates: 2026-10-29'
}
2. Dynamic Island popover state when search input is focused: {
  popoverVisible: true,
  activeElInShadow: 'cc-popover-search',
  islandHasFocusWithin: false,
  islandHasExpandedClass: true,
  computedColsWhenFocusInPopover: '258.575px'
}
3. Mystery shop (target=USD, assumedCurrency=CAD, ambiguousDollar=CAD):
   #p-bare text (was $100.00): $71.45
   #p-split text (was $50.00): $35.73
   Did any conversion happen (island mounted)?: true
```
**Status**: PASS

### B. Unit & Regression Suite (`npm test`)
```text
ℹ tests 123
ℹ suites 0
ℹ pass 123
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 14620.189
[Test Suite] Running Currency Converter unit tests...
[Test Suite] All unit tests passed successfully.
```
**Status**: PASS (`123/123` passing, including `tests/firefox-smoke.test.js`)

### C. Real-Browser Playwright E2E Suite (`npm run test:e2e`)
```text
ℹ tests 15
ℹ suites 0
ℹ pass 15
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 180512.9753
```
**Status**: PASS (`15/15` passing)

### D. Firefox MV3 Compliance Linter (`npm run lint:firefox`)
```text
Validation Summary:
errors          0
notices         0
warnings        4
```
**Status**: PASS (`0` errors, `0` notices)
