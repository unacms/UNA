# Notes for coding agents

## Studio app icons (`studio/template/images/icons/wi-*.svg`, module `template/images/icons/std-icon.svg`)

Every launcher tile is one SVG with three layers, in this order:

1. **Plate** – a full-size `<rect>` filled with a vertical `linearGradient`, lighter at the top, darker at the bottom (e.g. gray `#71717A → #3F3F46`, blue `#0284C7 → #1E40AF`, purple `#7C3AED → #5B21B6`).
2. **Glyph** – the Lucide icon paths, stroked (never filled) with a vertical white gradient, `white` at the top to `white` at 60% opacity at the bottom, using `stroke-linecap="round"` and `stroke-linejoin="round"`.
3. **Shadow** – an exact copy of the glyph paths, drawn *after* the glyph, shifted 1px down, stroked `black` with `stroke-opacity="0.1"` (fill-based glyphs use `fill="black" fill-opacity="0.1"`).

Placement: keep the Lucide 24-unit paths unchanged and wrap each copy in `<g transform="translate(x y) scale(s)">` so the 24-unit box lands centred on the plate with a stroke width of 2 units (which scales to 4px on a 72px canvas at `scale(2)`, or 4.4px on an 80px canvas at `scale(2.2)`). The shadow group uses the same transform with `y + 1`. Studio's own tiles are 72×72 (`translate(12 12) scale(2)`, shadow `translate(12 13)`); newer module icons are 80×80 (`translate(13.6 13.6) scale(2.2)`, shadow `translate(13.6 14.6)`). Gradient `y1`/`y2` for the glyph are given in the group's own units (2 to 22).

Pick glyphs from https://lucide.dev; the vendored copies live in `plugins_public/lucide/icons/`. `studio/template/images/icons/wi-store.svg` and `modules/boonex/artificer/template/images/icons/std-icon.svg` are reference implementations.
