import { getGlyph, glyphs } from 'tagsets';
import { makeTagGlyphIcon } from './tag-glyph-icon';
import type { TagGlyphIcon } from './tag-glyph-icon.types';

/**
 * Language glyphs from tagsets (https://github.com/componext/tagsets): `LocaleEn` draws "EN", `LocaleRu` "RU",
 * and so on for 26 languages. `Icon` finds them by name after the `icons-svg` registry, so a fork can still
 * replace one there.
 */
export const tagGlyphIcons: Readonly<Record<string, TagGlyphIcon>> = Object.fromEntries(
    Object.values(glyphs)
        .filter((glyph) => glyph.tagset === 'locales')
        .map((glyph) => [glyph.component, makeTagGlyphIcon(glyph)])
);

/** The icon name for a UNA language code (`en`, `pt-BR`, `nb`), or undefined when tagsets has no glyph for it. */
export function localeIconName(code: string | null | undefined): string | undefined {
    const glyph = getGlyph('locales', code);
    return glyph && tagGlyphIcons[glyph.component] ? glyph.component : undefined;
}
