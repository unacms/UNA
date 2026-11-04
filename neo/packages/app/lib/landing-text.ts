import type { TFunction, i18n as I18n } from 'i18next';

/**
 * A word of the apps' own landing pages (the home splash, Sign up). A project's own text wins: a
 * translation of `key` it adds in `customization/translation.js` (core NEO ships none of these keys).
 * Else UNA's (`texts` in the page data: Studio's language strings, in the viewer's language), else
 * NEO's English, for an older UNA or a page UNA couldn't send.
 */
export function landingText(t: TFunction, i18n: I18n, key: string, unaText: unknown, fallback: string): string {
    if (i18n?.exists?.(key)) return t(key);
    return typeof unaText === 'string' && unaText ? unaText : fallback;
}
