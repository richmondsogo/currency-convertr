# Canji logo guide

## The idea
A hexagonal **C**, echoed inward. The outer ink layer is the original price; the inner pine layer is the converted one. The shape comes from three stacked hexagons sharing one right edge.

## Files
| Folder | What it is |
|---|---|
| `symbol/` | Main symbol, small-size cut, feature version, each in colour and reversed. `one-colour/` has black, white, pine, square and favicon masters |
| `lockups/` | Horizontal, stacked and wordmark, in colour and reversed (SVG), plus PNGs |
| `icons/` | Extension icons (16, 32, 48, 128), tile icons, and `web/` with favicon.ico, apple-touch, PWA icons, manifest and `<head>` snippet |
| `board/` | Presentation board (HTML) |

## Which version where
- **Feature (3 layers):** hero art, store listing banner, README header. Never below 120 px.
- **Main (2 layers):** default. 32 px and up, and print from 10 mm.
- **Small cut (heavy):** 16 to 31 px: toolbar, favicon, tab icons.

## Colour (Paper & Pine)
| Role | Light | RGB | Dark |
|---|---|---|---|
| Ink (outer layer, wordmark) | `#191815` | 25, 24, 21 | `#ECE9E2` |
| Pine (inner layer) | `#1E6B52` | 30, 107, 82 | `#6FD3A6` |
| Paper (background) | `#F7F5F0` | 247, 245, 240 | `#10100E` |

One-colour: the symbol works in solid black, white or pine (`symbol/one-colour/`). CMYK and Pantone values are not specified; match them on a physical proof before printing.

## Construction
Pointy-top hexagon, circumradius 104 on a 256 grid. The arms of every layer run on to one shared vertical edge and are cut flush. The inner layer is the outer scaled to 0.60 toward that edge. Stroke 12 (11 reversed, thinned for the irradiation effect). Small cut: scale 0.46, stroke 17.

## Wordmark
Lowercase "canji" set in Familjen Grotesk Medium (500), tracking -2%, converted to outlines. The font is SIL Open Font License, which allows logo use. Letters are the stock design, not custom drawn.

## Clear space and sizes
- Clear space on every side: one quarter of the symbol's height.
- Horizontal lockup minimum: 96 px wide. Symbol alone: 32 px (main), 16 px (small cut).

## Backgrounds
Approved: Paper `#F7F5F0`, white, Ink `#191815`, Dark `#10100E`, and photography only where the area behind the mark is plain. Use the reversed files on dark.

## Do not
- Redraw the layers, change the layer count at a given size, or re-space the arms.
- Add shadows, gradients, outlines or 3D effects.
- Recolour the inner layer in a colour other than pine or mint.
- Stretch, rotate or put the mark in a container other than the supplied tiles.
- Use the wordmark in a different typeface.

## Limits
Trademark clearance has not been checked. Search trademark databases and run a reverse image search before launch. The presentation board is an HTML file that has not been checked in a browser.
