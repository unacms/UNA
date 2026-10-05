import i18n from 'i18next';

export type I18nResources = Record<string, { translation?: Record<string, unknown> } | undefined>;

/** Add translation bundles i18n does not have yet. */
export function addI18nResources(resources: I18nResources | null | undefined): void {
    if (!resources || !i18n.store) return;
    for (const [lng, bundle] of Object.entries(resources)) {
        if (bundle?.translation && !i18n.hasResourceBundle(lng, 'translation')) {
            i18n.addResourceBundle(lng, 'translation', bundle.translation, true, true);
        }
    }
}

/**
 * Switch the UI language. On web a page ships only its own language (+ `en`
 * fallback) — see apps/next/app/layout.js — so strings for any other language
 * come from one lazily loaded chunk with all of `customization/translation`.
 */
export async function changeI18nLanguage(lng: string): Promise<void> {
    if (lng && i18n.store && !i18n.hasResourceBundle(lng, 'translation')) {
        const { resources } = await import('app/customization/translation');
        addI18nResources(resources);
    }
    await i18n.changeLanguage(lng);
}
