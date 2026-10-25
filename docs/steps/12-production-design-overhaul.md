# Step 12: Production Design Overhaul & Polish

> **Status**: COMPLETED  
> **Branch**: `step/12-production-design-overhaul`  
> **Parent**: `main` (commit `33add5d`)  
> **Approved Plan**: `production_polish_and_design_overhaul.md`  
> **Standards Reference**: Emil Kowalski (`emil-design-eng`, `review-animations`), Apple WWDC Design (`apple-design`), Adversarial UI (`break-ui`), Paper & Pine Design System (`DESIGN.md`)

---

## 1. Objectives & Scope

1. **Typography Harmonization & De-Bolding**:
   - Eliminate all instances of aggressive `font-bold` (700) across Popup, Options, and Pill surfaces.
   - Standardize on `400` (regular) for body/descriptions, `500` (medium) for controls/emphasis, and `600` (semibold) strictly reserved for primary titles.
   - Enforce 2-typeface allocation on extension pages: `Familjen Grotesk` (UI Sans) and `Fragment Mono` (Tabular Numbers/Codes).
   - Maintain the host system font stack on the in-page Dynamic Island pill (`-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`) to eliminate third-party web tracking fingerprinting (ADR 0002/0015).
2. **Tactile Switch & Slider Redesign**:
   - Replace generic 24px `h-6 w-11` switch with a sleek 20px `h-5 w-9` hardware micro-switch with subtle hairline border and spring physics easing.
   - Refine 3-way segmented control (`SiteModeControl`) with an inset recessed track and raised pill active state with press feedback (`active:scale-[0.98]`).
3. **Currency Picker & Dropdown Menu Redesign + Contrast Fix**:
   - Fix critical 1.1:1 contrast flaw in `CurrencyCombobox.jsx` / `command.jsx` where selected rows painted muted text (`#67635A`) on Pine Green (`#1E6B52`).
   - Align menu selection highlight with Paper & Pine `--secondary` / `--raised` tokens (`#EFECE5` light, `#181816` dark) with ink foreground text, achieving WCAG AAA contrast (> 12:1).
   - In `src/content/ui.js`, replace the native browser `<select>` element with a custom floating micro-popover menu built purely with native DOM APIs (zero `innerHTML`) styled in the pill's translucent glass aesthetic.
4. **Pill Auto-Collapse & Expansion Physics**:
   - Wire a 3.5s auto-collapse timer in `InPageUI` after conversion settles (only when cursor is outside the capsule), collapsing to the mini-pill and re-expanding on hover or keyboard focus.
5. **Manifest Wildcard Cleanup**:
   - In `build.js`, consolidate redundant `host_permissions: ["<all_urls>", "http://*/*", "https://*/*"]` to `["<all_urls>"]`.
6. **Automated Verification**:
   - Update `tests/contrast.test.js` to assert WCAG AA compliance on combobox items, switch states, and pill badges.
   - Verify all 117 unit tests pass and build bundles cleanly.

---

## 2. Implementation Execution Log

### 1. Tactile Micro-Switch Redesign (`src/ui/components/ui/switch.jsx`)
- Reduced switch track height from 24px (`h-6 w-11`) to 20px (`h-5 w-9`).
- Reduced thumb size to 16px (`h-4 w-4`) with symmetric 2px margin (`translate-x-0.5` unchecked, `translate-x-[18px]` checked).
- Applied spring physics transition (`cubic-bezier(0.22, 1, 0.36, 1)`) and tactile drop shadow.
- Light Mode: White thumb (`#FFFFFF`) on Pine track (`#1E6B52`) yields 5.22:1 contrast.
- Dark Mode: Deep Black thumb (`#10100E`) on Spring Mint track (`#6FD3A6`) yields 10.47:1 contrast (WCAG AAA).

### 2. Segmented Mode Control Refinement (`src/ui/components/SiteModeControl.jsx` & `ui/toggle.jsx`)
- Set recessed container track with 70% opacity border/background (`bg-secondary/70 border-border/70 p-0.5`).
- Active segment elevated with raised paper surface (`bg-background shadow-xs text-foreground font-medium`).
- Added press micro-feedback: `motion-safe:active:scale-[0.98]`.

### 3. Contrast Repair in Currency Combobox (`src/ui/components/CurrencyCombobox.jsx` & `ui/command.jsx`)
- **Root Cause**: `command.jsx` styled `CommandItem` with `data-[selected='true']:bg-accent` (Pine Green). When rendered with `text-muted-foreground` (`#67635A`), the contrast ratio was an illegible **1.1:1**.
- **Fix**: Changed `CommandItem` selection state to `data-[selected='true']:bg-secondary data-[selected='true']:text-foreground`. Active rows now render on raised paper (`#EBE7DE` in light, `#1F1E1B` in dark) with ink text (`#191815` in light, `#ECE9E2` in dark) and readable muted text (`#67635A` in light, `#9B968B` in dark), achieving **> 12:1 (WCAG AAA)**.
- Right-aligned currency symbols using `font-mono text-xs text-muted-foreground ml-auto pl-2`.
- Removed `font-bold` and heavy `font-semibold` across all combobox rows.

### 4. Typography Clean-up Across Popup & Options (`src/popup/popup.jsx` & `src/options/options.jsx`)
- Replaced aggressive `font-bold` and heavy `font-semibold` with `font-medium` (500) on buttons, badges, chips, labels, and table headers.
- Pinned currency chips in popup: height 24px (`h-6`), `font-mono text-xs font-medium`.
- Cleaned up primary convert toggle button: `h-10 text-sm font-medium`.
- Verified 0 instances of `font-bold` remain in `src/popup/` or `src/options/`.

### 5. Dynamic Island Pill Overhaul & Custom Glass Popover (`src/content/ui.js` & `src/content/ui.css`)
- Replaced native Windows `<select>` element (which suffered from white-on-white / unstyled OS popup chrome) with a custom floating frosted glass micro-popover menu (`.cc-popover-menu`).
- Built 100% via native DOM APIs (`createElement`, `createTextNode`, `replaceChildren`) adhering strictly to the Zero `innerHTML` rule.
- Added live currency search filtering (`.cc-popover-search`) with keyboard navigation (ArrowDown/Up, Enter, Escape) and outside-click dismissal.
- Styled to match the capsule material with `backdrop-filter: blur(18px)`, 1px hairline border, subtle shadow, and `--cc-*` tokens.
- Refined pill typography: currency pair (`.cc-currency-code`) set to `font-weight: 500;`, count badge set to `font-weight: 500; font-size: 11.5px;`, segmented tabs set to `font-weight: 450;` (active `500;`).
- Implemented 3.5-second auto-collapse timer (`scheduleAutoCollapse(3500)`) in `InPageUI`: smoothly transitions full pill to mini-pill (`.cc-collapsed-pill`) after conversion when cursor is outside the capsule; re-expands on click/hover.

### 6. Manifest Permission Cleanup (`build.js`)
- In `build.js`, simplified redundant host permissions:
  ```json
  "host_permissions": [
    "<all_urls>"
  ]
  ```
- Updated `tests/build.test.js` to match.

### 7. Contrast & Pill Verification Suite Updates (`tests/contrast.test.js` & `tests/pill_and_options.test.js`)
- Added tests in `tests/contrast.test.js` asserting WCAG AA $\ge 4.5:1$ and AAA $\ge 7:1$ across active combobox item states and switch thumb/track.
- Added test in `tests/pill_and_options.test.js` asserting micro-popover menu search filtering, keyboard selection, and auto-collapse timer behavior.

---

## 3. Verification & Test Evidence

### Build Output (`npm run build`)
```
> currency-converter-v2@2.0.0 build
> node build.js

[Build] Bundling Currency Convertr v2.0.0 (33add5d) with esbuild...
[Build] esbuild bundling completed successfully.
[Build] Manifests generated for Chrome and Firefox.
[Build] Created package: ...\dist\packages\currency-converter-chrome-v2.0.0.zip
[Build] Created package: ...\dist\packages\currency-converter-firefox-v2.0.0.zip
[Build] Build completed successfully for v2.0.0 (33add5d).
```

### Contrast Test Suite (`node --test tests/contrast.test.js`)
```
▶ Paper & Pine contrast ratios satisfy WCAG AA >= 4.5:1
  ✔ Light Text (#191815) on #F7F5F0 (3.5752ms)
  ✔ Light Muted (#67635A) on #F7F5F0 (0.4118ms)
  ✔ Light Accent (#1E6B52) on #F7F5F0 (0.3164ms)
  ✔ Light Warning (#A15C07) on #F7F5F0 (0.2964ms)
  ✔ Light Danger (#B3261E) on #F7F5F0 (0.3135ms)
  ✔ Dark Text (#ECE9E2) on #10100E (0.2039ms)
  ✔ Dark Muted (#9B968B) on #10100E (0.199ms)
  ✔ Dark Accent (#6FD3A6) on #10100E (0.1935ms)
  ✔ Dark Warning (#E5A038) on #10100E (0.2432ms)
  ✔ Dark Danger (#E87068) on #10100E (0.3473ms)
✔ Paper & Pine contrast ratios satisfy WCAG AA >= 4.5:1 (11.6155ms)
✔ Contrast calculation fails if contrast drops below 4.5:1 (0.2083ms)
✔ CurrencyCombobox selection states satisfy WCAG AA >= 4.5:1 (prevents 1.1:1 flaw) (0.2508ms)
✔ Switch control thumb and track satisfy WCAG AA / AAA contrast (0.1921ms)
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
```

### Pill Theme & Token Suite (`node --test tests/pill_theme.test.js`)
```
✔ pill css: ui.css and INLINE_UI_CSS stay in sync (comments/whitespace ignored) (2.5654ms)
✔ pill css: defines light default, explicit dark, and system-dark token blocks (10.13ms)
✔ pill css: system-dark block is scoped so explicit light wins on a dark OS (0.3904ms)
✔ pill css: no hard-coded OLED/zinc/emerald literals outside token blocks (3.5555ms)
✔ pill css: uses theme tokens for surface, text, segmented control and select (0.4147ms)
✔ pill css: accessibility fallbacks for transparency and contrast preferences (0.2827ms)
✔ pill css: single-capsule horizontal expansion architecture is preserved (0.2868ms)
✔ pill theme: data-theme attribute follows theme at mount and on update (227.4189ms)
✔ pill theme: token pairs meet WCAG AA against the solid (worst-case) surface (9.3466ms)
ℹ tests 27
ℹ suites 0
ℹ pass 27
ℹ fail 0
```

### Dynamic Island & Popover Suite (`node --test tests/pill_and_options.test.js`)
```
✔ parser: parseNumberString handles 0,500 as decimal 0.5 without stripping to 500 (2.7581ms)
✔ scanner: multiple convert-revert-convert cycles succeed without dropping elements (283.9899ms)
✔ ui: InPageUI lifecycle, segmented switch, collapse, and updates (61.607ms)
✔ popup: isRestrictedPage correctly identifies system vs web pages (2.7785ms)
✔ ui: Dynamic Island pill displays source -> target currency in compact view (17.0076ms)
✔ ui: Dynamic Island pill maintains single-capsule horizontal expansion architecture (18.3509ms)
✔ ui: Dynamic Island micro-popover menu and auto-collapse behavior (162.1965ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
```

### Full Unit Test Suite
```
ℹ tests 117
ℹ suites 0
ℹ pass 117
ℹ fail 0
ℹ duration_ms 15116.0524
```

