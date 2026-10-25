import { View } from 'app/design/view'
import { appSetting, menuItemsByName, menuItemsByNameNew } from 'app/lib/util'
import { useTranslation } from 'react-i18next';
import { useMemo, memo } from 'react';
import { NeoButtonLink } from 'app/design/controls'
import { useCurrentUserNoCounters } from 'app/context/user';
import { useMenuData } from 'app/context/menu-data';
import { useLayoutSettings } from 'app/context/layout-settings';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { localeIconName } from 'app/ui/atoms/tag-glyph-icons';
import { SOUND_LEVEL_ITEMS, useSoundsLevel } from 'app/lib/hooks/use-sounds-level';

export const MENU_FOOTER_CLASSES = 'flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-1 p-4 min-h-16';
// Settings use the historical misspelling; keep this key aligned with settings/layout.js.
const AVAILABLE_LANGS_SETTING_KEY = 'avaliable_langs';
const FOOTER_THEME_ITEMS = [
    { id: 'auto', titleKey: 'theme_footer_auto', labelKey: 'theme_level_auto', icon: 'Eclipse' },
    { id: 'light', titleKey: 'theme_footer_light', labelKey: 'theme_level_light', icon: 'Sun' },
    { id: 'dark', titleKey: 'theme_footer_dark', labelKey: 'theme_level_dark', icon: 'Moon' },
];

const linkVariantToNeoStyle = {
    default: 'plain',
    secondary: 'borderless',
    accent: 'link',
    primary: 'borderedProminent',
    ghost: 'borderless',
    link: 'link',
};

const linkSizeToNeoControlSize = {
    xs: 'mini',
    sm: 'small',
    md: 'regular',
    base: 'regular',
    lg: 'large',
};

const normalizeFooterHref = (href = '') => {
    const value = typeof href === 'string' ? href.trim() : '';
    if (!value) return '';
    if (
        value.startsWith('/') ||
        value.startsWith('#') ||
        value.startsWith('//') ||
        /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)
    ) {
        return value;
    }
    return `/${value}`;
};

const resolveFooterLang = (langs, lang, langCode) => {
    if (lang && langs.includes(lang)) return lang;
    if (langCode && langs.includes(langCode)) return langCode;
    return langs[0] || '';
};

const menuFooterSkeletonWidths = ['w-12', 'w-12', 'w-12', 'w-12', 'w-12'];

function MenuFooterSkeleton({ cntClasses, children, role }) {
    return (
        <View className={cntClasses} role={role}>
            {menuFooterSkeletonWidths.map((width, index) => (
                <View
                    key={`menu-footer-skeleton-${index}`}
                    className={`h-5 my-2 mx-1 ${width} rounded-full bg-muted animate-pulse`}
                />
            ))}
            {children}
        </View>
    );
}

function FooterThemeSwitcher({ visualProps }) {
    const { t } = useTranslation();
    const { themeName, setThemeName } = useLayoutSettings();
    const currentThemeName = themeName || 'auto';

    const items = useMemo(() => (
        FOOTER_THEME_ITEMS.map((theme) => ({
            key: theme.id,
            id: theme.id,
            name: theme.id,
            title: t(theme.titleKey),
            icon: theme.icon,
            selected: currentThemeName === theme.id,
        }))
    ), [currentThemeName, t]);
    const currentThemeItem = FOOTER_THEME_ITEMS.find((theme) => theme.id === currentThemeName) ?? FOOTER_THEME_ITEMS[0];
    const themeLabel = t(currentThemeItem.labelKey);

    // Icon only: the icon shows the current theme, and the menu names each one.
    return (
        <DropdownMenu
            items={items}
            onSelect={(item) => setThemeName(item.id)}
            buttonProps={{
                image: currentThemeItem.icon,
                accessibilityLabel: themeLabel,
                tooltip: themeLabel,
                style: visualProps.style,
                controlSize: visualProps.controlSize,
                className: visualProps.className,
                textClassName: visualProps.textClassName,
            }}
        />
    );
}

function FooterSoundsLevel({ visualProps }) {
    const { t } = useTranslation();
    const { level, setLevel } = useSoundsLevel();

    // The chosen level answers itself (`setLevel` plays it at the new level), so its option makes no sound of its own.
    const items = SOUND_LEVEL_ITEMS.map((option) => ({
        key: option.id,
        id: option.id,
        name: option.id,
        title: t(option.titleKey),
        icon: option.icon,
        selected: level === option.id,
        sound: false,
    }));
    const current = SOUND_LEVEL_ITEMS.find((option) => option.id === level) ?? SOUND_LEVEL_ITEMS[0];
    const label = t(current.labelKey);

    // Icon only, like the theme switcher: the icon shows the level, and the menu names each one.
    return (
        <DropdownMenu
            items={items}
            onSelect={(item) => setLevel(item.id)}
            buttonProps={{
                image: current.icon,
                accessibilityLabel: label,
                tooltip: label,
                style: visualProps.style,
                controlSize: visualProps.controlSize,
                className: visualProps.className,
                textClassName: visualProps.textClassName,
            }}
        />
    );
}

function FooterLanguageSwitcher({ visualProps }) {
    const { t } = useTranslation();
    const { lang, langCode, setLang } = useLayoutSettings();
    const configuredLangs = appSetting('layout', AVAILABLE_LANGS_SETTING_KEY);
    const langs = Array.isArray(configuredLangs) ? configuredLangs : [];
    // The chosen option ('auto' for System), and the language actually in use: in System mode the
    // device's language (langCode), which the trigger shows and the System option names.
    const currentLang = resolveFooterLang(langs, lang, langCode);
    const activeLang = currentLang === 'auto' ? langCode : currentLang;

    const items = useMemo(() => (
        langs.map((language) => ({
            key: language,
            id: language,
            name: language,
            title: language === 'auto' && activeLang
                ? `${t('lang_auto')} (${activeLang.toUpperCase()})`
                : t('lang_' + language),
            // The language's own glyph (EN, RU, ...); System and languages tagsets has no glyph for keep the generic icon.
            icon: localeIconName(language) || 'Languages',
            selected: currentLang === language,
        }))
    ), [activeLang, currentLang, langs, t]);

    if (langs.length <= 1 || !currentLang) return null;

    const langLabel = t('lang_' + activeLang);

    return (
        <DropdownMenu
            items={items}
            onSelect={(item) => setLang(item.id)}
            buttonProps={{
                // Icon-only, like the theme and sounds triggers: the glyph (EN) is the label, the name is for screen readers and the tooltip.
                image: localeIconName(activeLang) || 'Languages',
                accessibilityLabel: langLabel,
                tooltip: langLabel,
                style: visualProps.style,
                controlSize: visualProps.controlSize,
                className: visualProps.className,
                textClassName: visualProps.textClassName,
            }}
        />
    );
}

function MenuFooterComponent({
    cntClasses = MENU_FOOTER_CLASSES,
    btnStyle,
    menu_items,
    variant,
    size,
    itemClassName,
}) {

    const { t } = useTranslation();
    const currentUser = useCurrentUserNoCounters();
    const { hydrated } = useLayoutSettings();
    const usesRemoteFooter = !menu_items && appSetting('layout', 'user_remote_config');
    const showThemeSwitcher = appSetting('dashboard', 'switch_theme');
    const { available: soundsAvailable } = useSoundsLevel();
    const configuredLangs = appSetting('layout', AVAILABLE_LANGS_SETTING_KEY);
    const showLanguageSwitcher = hydrated && Array.isArray(configuredLangs) && configuredLangs.length > 1;
    const showSoundsLevel = hydrated && soundsAvailable;
    const { menuData, isFetched, isLoading } = useMenuData(
        (menu_items || !hydrated) ? null : appSetting('menu_items', 'objects', 'footer')
    );

    const visualProps = useMemo(() => {
        const legacy = btnStyle || {};
        const legacyVariant = variant ?? legacy.variant ?? 'accent';
        const legacySize = size ?? legacy.size ?? 'sm';
        return {
            style: legacy.style ?? linkVariantToNeoStyle[legacyVariant] ?? 'link',
            controlSize: legacy.controlSize ?? linkSizeToNeoControlSize[legacySize] ?? 'small',
            className: legacy.containerClassName ?? '',
            textClassName: itemClassName ?? legacy.textClassName ?? legacy.className ?? '',
        };
    }, [btnStyle, variant, size, itemClassName]);
  
    
    const menu_launcher_items = useMemo(() => (
        menu_items || (usesRemoteFooter
            ? menuItemsByNameNew('menu_post', menuData, currentUser)
            : menuItemsByName('', appSetting('menu_items', 'menu_footer'), currentUser))
    ), [menu_items, usesRemoteFooter, menuData, currentUser]);

    if (usesRemoteFooter && (!hydrated || isLoading || !isFetched)) {
        return (
            <MenuFooterSkeleton cntClasses={cntClasses} role="contentinfo">
                {showLanguageSwitcher ? <FooterLanguageSwitcher visualProps={visualProps} /> : null}
                {showThemeSwitcher ? <FooterThemeSwitcher visualProps={visualProps} /> : null}
                {showSoundsLevel ? <FooterSoundsLevel visualProps={visualProps} /> : null}
            </MenuFooterSkeleton>
        );
    }

    if (menu_launcher_items.length === 0 && menuData && !showThemeSwitcher && !showLanguageSwitcher && !showSoundsLevel)
        return null;

    return (
        <View className={cntClasses} role="contentinfo">
            {menu_launcher_items.map((item, index) => (
                <NeoButtonLink
                    href={normalizeFooterHref(item.link)}
                    key={item.link || index}
                    label={t(item.title)}
                    style={visualProps.style}
                    controlSize={visualProps.controlSize}
                    className={visualProps.className}
                    textClassName={visualProps.textClassName}
                />
            ))}
            {showLanguageSwitcher ? <FooterLanguageSwitcher visualProps={visualProps} /> : null}
            {showThemeSwitcher ? <FooterThemeSwitcher visualProps={visualProps} /> : null}
            {showSoundsLevel ? <FooterSoundsLevel visualProps={visualProps} /> : null}
        </View>
    );
}

export default memo(MenuFooterComponent);