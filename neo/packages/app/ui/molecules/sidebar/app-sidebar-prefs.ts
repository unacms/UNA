import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { appSetting } from 'app/lib/util';
import { useLayoutSettings } from 'app/context/layout-settings';
import { useMenuData } from 'app/context/menu-data';
import { SOUND_LEVEL_ITEMS, useSoundsLevel } from 'app/lib/hooks/use-sounds-level';
import type { DrawerPref } from './app-sidebar.types';

const THEMES = [
    { id: 'auto', titleKey: 'theme_footer_auto', icon: 'Eclipse' },
    { id: 'light', titleKey: 'theme_footer_light', icon: 'Sun' },
    { id: 'dark', titleKey: 'theme_footer_dark', icon: 'Moon' },
];

/**
 * The drawer's Preferences: language, theme and sounds, the switchers the footer has on the web
 * (components/nav/menu-footer.tsx), each shown under the same rule as there. The language switcher offers the
 * languages UNA's footer menu names in its `switch_language` item, which comes while the site has two or more.
 */
export function useDrawerPrefs(): DrawerPref[] {
    const { t } = useTranslation();
    const { hydrated, lang, langCode, autoLangCode, setLang, themeName, setThemeName } = useLayoutSettings();
    const { available: soundsAvailable, level, setLevel } = useSoundsLevel();
    const { menuData } = useMenuData(hydrated ? appSetting('menu_items', 'objects', 'footer') : null);

    const languages = useMemo((): string[] => {
        const configured = appSetting('layout', 'avaliable_langs');
        const item = (Array.isArray(menuData?.items) ? menuData.items : []).find((entry: { name?: string }) => entry?.name === 'switch_language');
        const site: unknown = item?.languages;
        if (!Array.isArray(configured) || !Array.isArray(site)) return [];
        const offered = configured.filter((language: string) => language === 'auto' || site.includes(language));
        return offered.filter((language: string) => language !== 'auto').length > 1 ? offered : [];
    }, [menuData]);

    const prefs: DrawerPref[] = [];
    if (hydrated && languages.length) {
        const chosen = [lang, langCode].find((value) => !!value && languages.includes(value)) ?? languages[0] ?? '';
        prefs.push({
            key: 'language',
            title: t('Language'),
            icon: 'Languages',
            value: chosen,
            options: languages.map((language) => ({
                id: language,
                title: language === 'auto' && autoLangCode ? `${t('lang_auto')} (${autoLangCode.toUpperCase()})` : t('lang_' + language),
            })),
            onSelect: (id) => setLang(id),
        });
    }
    if (appSetting('dashboard', 'switch_theme')) {
        const current = THEMES.find((theme) => theme.id === themeName) ?? THEMES[0]!;
        prefs.push({
            key: 'theme',
            title: t('theme'),
            icon: current.icon,
            value: current.id,
            options: THEMES.map((theme) => ({ id: theme.id, title: t(theme.titleKey) })),
            onSelect: (id) => setThemeName(id),
        });
    }
    if (hydrated && soundsAvailable) {
        const current = SOUND_LEVEL_ITEMS.find((option) => option.id === level) ?? SOUND_LEVEL_ITEMS[0]!;
        prefs.push({
            key: 'sounds',
            title: t('Sounds'),
            icon: current.icon,
            value: current.id,
            options: SOUND_LEVEL_ITEMS.map((option) => ({ id: option.id, title: t(option.titleKey) })),
            onSelect: (id) => {
                const next = SOUND_LEVEL_ITEMS.find((option) => option.id === id);
                if (next) setLevel(next.id);
            },
        });
    }
    return prefs;
}
