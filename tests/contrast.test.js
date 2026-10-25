import test from 'node:test';
import assert from 'node:assert/strict';

// WCAG relative luminance calculation
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16)
  };
}

function sRgbToLinear(c) {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * sRgbToLinear(r) +
    0.7152 * sRgbToLinear(g) +
    0.0722 * sRgbToLinear(b)
  );
}

function getContrastRatio(hex1, hex2) {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

test('Paper & Pine contrast ratios satisfy WCAG AA >= 4.5:1', async (t) => {
  const palettes = [
    {
      name: 'Light',
      bg: '#F7F5F0',
      pairs: [
        { role: 'Text', hex: '#191815', minRatio: 4.5 },
        { role: 'Muted', hex: '#67635A', minRatio: 4.5 },
        { role: 'Accent', hex: '#1E6B52', minRatio: 4.5 },
        { role: 'Warning', hex: '#A15C07', minRatio: 4.5 },
        { role: 'Danger', hex: '#B3261E', minRatio: 4.5 },
      ]
    },
    {
      name: 'Dark',
      bg: '#10100E',
      pairs: [
        { role: 'Text', hex: '#ECE9E2', minRatio: 4.5 },
        { role: 'Muted', hex: '#9B968B', minRatio: 4.5 },
        { role: 'Accent', hex: '#6FD3A6', minRatio: 4.5 },
        { role: 'Warning', hex: '#E5A038', minRatio: 4.5 },
        { role: 'Danger', hex: '#E87068', minRatio: 4.5 },
      ]
    }
  ];

  for (const pal of palettes) {
    for (const item of pal.pairs) {
      await t.test(`${pal.name} ${item.role} (${item.hex}) on ${pal.bg}`, () => {
        const ratio = getContrastRatio(item.hex, pal.bg);
        assert.ok(
          ratio >= item.minRatio,
          `Expected contrast ratio >= ${item.minRatio}:1, got ${ratio.toFixed(2)}:1 for ${item.role} on ${pal.bg}`
        );
      });
    }
  }
});

test('Contrast calculation fails if contrast drops below 4.5:1', () => {
  // Test that low contrast is correctly caught
  const poorContrastRatio = getContrastRatio('#888888', '#F7F5F0');
  assert.ok(poorContrastRatio < 4.5, `Expected < 4.5:1, got ${poorContrastRatio.toFixed(2)}:1`);
});

test('CurrencyCombobox selection states satisfy WCAG AA >= 4.5:1 (prevents 1.1:1 flaw)', () => {
  // Verifies fix where active row uses raised paper surface (--secondary) instead of saturated green
  const lightPaperBg = '#EBE7DE'; // Light --secondary raised paper
  const lightInkText = '#191815'; // Light text-foreground
  const lightMutedText = '#67635A'; // Light text-muted-foreground

  const darkPaperBg = '#1F1E1B'; // Dark --secondary raised paper
  const darkInkText = '#ECE9E2'; // Dark text-foreground
  const darkMutedText = '#9B968B'; // Dark text-muted-foreground

  // Light Mode active combobox item
  const lightInkRatio = getContrastRatio(lightInkText, lightPaperBg);
  const lightMutedRatio = getContrastRatio(lightMutedText, lightPaperBg);
  assert.ok(lightInkRatio >= 7.0, `Light ink on secondary must meet AAA (>= 7:1), got ${lightInkRatio.toFixed(2)}:1`);
  assert.ok(lightMutedRatio >= 4.5, `Light muted on secondary must meet AA (>= 4.5:1), got ${lightMutedRatio.toFixed(2)}:1`);

  // Dark Mode active combobox item
  const darkInkRatio = getContrastRatio(darkInkText, darkPaperBg);
  const darkMutedRatio = getContrastRatio(darkMutedText, darkPaperBg);
  assert.ok(darkInkRatio >= 7.0, `Dark ink on secondary must meet AAA (>= 7:1), got ${darkInkRatio.toFixed(2)}:1`);
  assert.ok(darkMutedRatio >= 4.5, `Dark muted on secondary must meet AA (>= 4.5:1), got ${darkMutedRatio.toFixed(2)}:1`);

  // Regression check: verify old flawed pattern fails
  const oldFlawedAccentBg = '#1E6B52';
  const flawedRatio = getContrastRatio(lightMutedText, oldFlawedAccentBg);
  assert.ok(flawedRatio < 2.0, `Expected old flawed combination to fail (< 2:1), got ${flawedRatio.toFixed(2)}:1`);
});

test('Switch control thumb and track satisfy WCAG AA / AAA contrast', () => {
  // Light Mode: White thumb on Pine Green track
  const lightThumb = '#FFFFFF';
  const lightTrack = '#1E6B52';
  const lightSwitchRatio = getContrastRatio(lightThumb, lightTrack);
  assert.ok(lightSwitchRatio >= 4.5, `Light switch thumb on track must meet AA (>= 4.5:1), got ${lightSwitchRatio.toFixed(2)}:1`);

  // Dark Mode: Deep Black thumb on Spring Mint track
  const darkThumb = '#10100E';
  const darkTrack = '#6FD3A6';
  const darkSwitchRatio = getContrastRatio(darkThumb, darkTrack);
  assert.ok(darkSwitchRatio >= 7.0, `Dark switch thumb on track must meet AAA (>= 7:1), got ${darkSwitchRatio.toFixed(2)}:1`);
});

