# Notes for coding agents

## Studio app icons (`studio/template/images/icons/wi-*.svg`, module `template/images/icons/std-icon.svg`)

Every launcher tile is one SVG with three layers, in this order:

1. **Plate** – a full-size `<rect>` filled with a vertical `linearGradient`, lighter at the top, darker at the bottom (e.g. gray `#71717A → #3F3F46`, blue `#0284C7 → #1E40AF`, purple `#7C3AED → #5B21B6`).
2. **Glyph** – the Lucide icon, flattened to one outline and filled (`fill-rule="evenodd"`) with a vertical white gradient, `white` at the top to `white` at 60% opacity at the bottom. Lucide draws a glyph as several stroked paths; layered translucent, every place two strokes overlap shows twice as dark, so expand each stroke to its outline (2 units wide, round caps and joins) and unite them first. `scripts/studio_icon_from_lucide.py` does this (shapely + svgpathtools; add the icon to its table and run it). Older tiles still carry the raw stroked paths (`stroke-linecap="round"`, `stroke-linejoin="round"`); flatten them when they are touched.
3. **Shadow** – an exact copy of the glyph outline, drawn *after* the glyph, shifted 1px down, filled `black` with `fill-opacity="0.1"` (older stroked tiles: stroked `black` with `stroke-opacity="0.1"`).

Placement: keep the outline in Lucide's 24-unit space and wrap each copy in `<g transform="translate(x y) scale(s)">` so the 24-unit box lands centred on the plate with a stroke width of 2 units (which scales to 4px on a 72px canvas at `scale(2)`, or 4.4px on an 80px canvas at `scale(2.2)`). The shadow group uses the same transform with `y + 1`. Studio's own tiles are 72×72 (`translate(12 12) scale(2)`, shadow `translate(12 13)`); newer module icons are 80×80 (`translate(13.6 13.6) scale(2.2)`, shadow `translate(13.6 14.6)`). Gradient `y1`/`y2` for the glyph are given in the group's own units (2 to 22).

Plate colours follow the app category: gray `#71717A → #3F3F46` system, green `#059669 → #065F46` content, orange `#D97706 → #92400E` profiles, purple `#7C3AED → #5B21B6` templates, red `#F43F5E → #BE123C` contexts (groups, spaces, events, courses), white `#F3F4F6 → #E5E7EB` languages; integrations sit on white or their brand colour.

Pick glyphs from https://lucide.dev; the vendored copies live in `plugins_public/lucide/icons/`. `modules/boonex/mapshow/template/images/icons/std-icon.svg` (flattened, 80px) and `studio/template/images/modules/bx_polls.svg` (flattened, 72px) are reference implementations.
