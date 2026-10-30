import { View } from 'app/design/view'
import { appSetting, cn, menuItemsByName, menuItemsByNameNew } from 'app/lib/util'
import { useTranslation } from 'react-i18next';
import { useMemo, memo, type ComponentProps, type ReactNode } from 'react';
import { NeoButtonLink } from 'app/design/controls'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { useCurrentUserNoCounters } from 'app/context/user';
import { useMenuData } from 'app/context/menu-data';
import { useLayoutSettings } from 'app/context/layout-settings';
import DropdownMenu, { type DropdownMenuItemData } from 'app/ui/atoms/dropdown-menu';
import { localeIconName } from 'app/ui/atoms/tag-glyph-icons';
import { SOUND_LEVEL_ITEMS, useSoundsLevel } from 'app/lib/hooks/use-sounds-level';
import { useScreenPagePath } from 'app/lib/navigation/screen-page-path';

/** A footer item as UNA sends it (BxBaseMenuFooter::_getMenuItemAPI), or as a caller passes it in `menu_items`. */
type FooterMenuItem = {
    name?: string;
    title?: string;
    /** The accessible name of an item without a title (the Powered by badge). */
    title_attr?: string;
    link?: string;
    /** Icon name, or raw SVG (the badge). */
    icon?: string;
    /** `text`: a line, not a link (the copyright notice). */
    display_type?: string;
    text?: string;
    /** The text on phones. */
    text_short?: string;
};

/** The look every footer control takes (MenuFooterComponent). */
type FooterVisualProps = {
    style: string;
    controlSize: string;
    className: string;
    textClassName: string;
    contentInsets?: { x: number };
};

/** The legacy `btnStyle` prop: a button look, or ButtonLink's variant and size. */
type FooterButtonStyle = {
    style?: string;
    controlSize?: string;
    variant?: string;
    size?: string;
    containerClassName?: string;
    textClassName?: string;
    className?: string;
};

type MenuFooterProps = {
    cntClasses?: string;
    btnStyle?: FooterButtonStyle;
    menu_items?: FooterMenuItem[];
    variant?: string;
    size?: string;
    itemClassName?: string;
};

type FooterControlProps = { visualProps: FooterVisualProps };

// Two sections, links and switchers, in one row that wraps: side by side while they fit (apart from
// lg), each on its own centred line when they don't.
export const MENU_FOOTER_CLASSES = 'flex w-full items-center border-t border-border/60 justify-center lg:justify-between flex-row flex-wrap gap-x-6 gap-y-4 p-4 min-h-16';
// max-w-full: View doesn't shrink, so a section wider than the footer wraps its items instead of spilling out.
// The 16px gaps hold the touch areas: a 28px `mini` item reaches 44px with its 8px hitSlop on each side,
// so neighbours (and wrapped lines) meet without overlapping.
const FOOTER_SECTION_CLASSES = 'max-w-full flex-row flex-wrap items-center justify-center gap-4';
const FOOTER_LINKS_CLASSES = FOOTER_SECTION_CLASSES;
// The footer's look: quiet text links, 14px in a 28px control, secondary text that turns foreground on
// hover (NeoButton style `text`), like the site's footer (#bx-menu-footer in UNA's tailwind.css).
// A caller that passes `variant`, `size` or `btnStyle` keeps the button look it asks for.
const FOOTER_TEXT_STYLE = { style: 'text', controlSize: 'mini', textClassName: 'text-sm' };
// Settings use the historical misspelling; keep this key aligned with settings/layout.js.
const AVAILABLE_LANGS_SETTING_KEY = 'avaliable_langs';
const FOOTER_THEME_ITEMS = [
    { id: 'auto', titleKey: 'theme_footer_auto', labelKey: 'theme_level_auto', icon: 'Eclipse' },
    { id: 'light', titleKey: 'theme_footer_light', labelKey: 'theme_level_light', icon: 'Sun' },
    { id: 'dark', titleKey: 'theme_footer_dark', labelKey: 'theme_level_dark', icon: 'Moon' },
];

const linkVariantToNeoStyle: Record<string, string> = {
    default: 'plain',
    secondary: 'borderless',
    accent: 'link',
    primary: 'borderedProminent',
    ghost: 'borderless',
    link: 'link',
};

const linkSizeToNeoControlSize: Record<string, string> = {
    xs: 'mini',
    sm: 'small',
    md: 'regular',
    base: 'regular',
    lg: 'large',
};

const normalizeFooterHref = (href: unknown = '') => {
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

const resolveFooterLang = (langs: string[], lang?: string | null, langCode?: string | null) => {
    if (lang && langs.includes(lang)) return lang;
    if (langCode && langs.includes(langCode)) return langCode;
    return langs[0] || '';
};

const menuFooterSkeletonWidths = ['w-12', 'w-12', 'w-12', 'w-12', 'w-12'];

function MenuFooterSkeleton({ cntClasses, children, role }: { cntClasses: string; children?: ReactNode; role: ComponentProps<typeof View>['role'] }) {
    return (
        <View className={cntClasses} role={role}>
            <View className={FOOTER_LINKS_CLASSES}>
                {menuFooterSkeletonWidths.map((width, index) => (
                    <View
                        key={`menu-footer-skeleton-${index}`}
                        className={`h-5 my-2 mx-1 ${width} rounded-full bg-muted animate-pulse`}
                    />
                ))}
            </View>
            {children ? <View className={FOOTER_SECTION_CLASSES}>{children}</View> : null}
        </View>
    );
}

// A line UNA sends as text, not a link (BxBaseMenuFooter::_getMenuItemAPI: the copyright notice, or a text item
// added in Navigation). The short form on phones, the full one from tablet width, in the links' size and colour; it
// sits in a 28px row like the links but doesn't react to the pointer.
function FooterTextItem({ item, visualProps }: FooterControlProps & { item: FooterMenuItem }) {
    const text = item.text || item.title;
    const short = item.text_short || text;
    const textClassName = cn('text-secondary-foreground', visualProps.textClassName);

    return (
        <View className="min-h-7 justify-center">
            {short === text ? (
                <Text className={textClassName}>{text}</Text>
            ) : (
                <>
                    <Text className={cn('sm:hidden', textClassName)}>{short}</Text>
                    <Text className={cn('hidden sm:flex', textClassName)}>{text}</Text>
                </>
            )}
        </View>
    );
}

function FooterThemeSwitcher({ visualProps }: FooterControlProps) {
    const { t } = useTranslation();
    const { themeName, setThemeName } = useLayoutSettings();
    const currentThemeName = themeName || 'auto';

    const items = useMemo((): DropdownMenuItemData[] => (
        FOOTER_THEME_ITEMS.map((theme) => ({
            key: theme.id,
            id: theme.id,
            name: theme.id,
            title: t(theme.titleKey),
            icon: theme.icon,
            selected: currentThemeName === theme.id,
        }))
    ), [currentThemeName, t]);
    const currentThemeItem = FOOTER_THEME_ITEMS.find((theme) => theme.id === currentThemeName) ?? FOOTER_THEME_ITEMS[0]!;
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

function FooterSoundsLevel({ visualProps }: FooterControlProps) {
    const { t } = useTranslation();
    const { level, setLevel } = useSoundsLevel();

    // The chosen level answers itself (`setLevel` plays it at the new level), so its option makes no sound of its own.
    const items: DropdownMenuItemData[] = SOUND_LEVEL_ITEMS.map((option) => ({
        key: option.id,
        id: option.id,
        name: option.id,
        title: t(option.titleKey),
        icon: option.icon,
        selected: level === option.id,
        sound: false,
    }));
    const current = SOUND_LEVEL_ITEMS.find((option) => option.id === level) ?? SOUND_LEVEL_ITEMS[0]!;
    const label = t(current.labelKey);

    // Icon only, like the theme switcher: the icon shows the level, and the menu names each one.
    return (
        <DropdownMenu
            items={items}
            onSelect={(item) => {
                const next = SOUND_LEVEL_ITEMS.find((option) => option.id === item.id);
                if (next) setLevel(next.id);
            }}
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

// UNA's Powered by badge: the item's own SVG (Navigation keeps it editable), 24px tall as on the site, in
// the links' colour (`currentColor`), foreground on hover.
const BADGE_HEIGHT = 24;
const isSvgBadge = (item: FooterMenuItem) => typeof item.icon === 'string' && item.icon.startsWith('<svg') && !item.title;
const badgeWidth = (svg: string) => {
    const [, width, height] = /viewBox="\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)\s*"/i.exec(svg) ?? [];
    return width && height && +height ? Math.round((BADGE_HEIGHT * +width) / +height) : BADGE_HEIGHT;
};

function FooterBadgeItem({ item, href, visualProps }: FooterControlProps & { item: FooterMenuItem & { icon: string }; href: string }) {
    return (
        <NeoButtonLink
            href={href}
            target="_blank"
            accessibilityLabel={item.title_attr || undefined}
            style={visualProps.style}
            controlSize={visualProps.controlSize}
            contentInsets={visualProps.contentInsets}
            className={cn('group', visualProps.className)}
        >
            <Icon
                icon={item.icon}
                width={badgeWidth(item.icon)}
                height={BADGE_HEIGHT}
                className="text-secondary-foreground web:transition-colors group-hover:text-foreground"
            />
        </NeoButtonLink>
    );
}

function FooterLanguageSwitcher({ visualProps }: FooterControlProps) {
    const { t } = useTranslation();
    const { lang, langCode, autoLangCode, setLang } = useLayoutSettings();
    const configuredLangs = appSetting('layout', AVAILABLE_LANGS_SETTING_KEY);
    const langs = useMemo((): string[] => (Array.isArray(configuredLangs) ? configuredLangs : []), [configuredLangs]);
    // The chosen option ('auto' for System), and the language actually in use (langCode), which the
    // trigger shows. The System option always names the device's language (autoLangCode), even while
    // another language is chosen, because that is what choosing it switches to.
    const currentLang = resolveFooterLang(langs, lang, langCode);
    const activeLang = currentLang === 'auto' ? langCode : currentLang;

    const items = useMemo((): DropdownMenuItemData[] => (
        langs.map((language) => ({
            key: language,
            id: language,
            name: language,
            title: language === 'auto' && autoLangCode
                ? `${t('lang_auto')} (${autoLangCode.toUpperCase()})`
                : t('lang_' + language),
            // The language's own glyph (EN, RU, ...); System and languages tagsets has no glyph for keep the generic icon.
            icon: localeIconName(language) || 'Languages',
            selected: currentLang === language,
        }))
    ), [autoLangCode, currentLang, langs, t]);

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
}: MenuFooterProps) {

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

    const visualProps = useMemo((): FooterVisualProps => {
        const legacy: FooterButtonStyle = btnStyle || {};
        const legacyVariant = variant ?? legacy.variant;
        const legacySize = size ?? legacy.size;
        const style = legacy.style ?? (legacyVariant ? linkVariantToNeoStyle[legacyVariant] ?? 'link' : FOOTER_TEXT_STYLE.style);
        return {
            style,
            controlSize: legacy.controlSize ?? (legacySize ? linkSizeToNeoControlSize[legacySize] ?? 'small' : FOOTER_TEXT_STYLE.controlSize),
            className: legacy.containerClassName ?? '',
            textClassName: itemClassName ?? legacy.textClassName ?? legacy.className ?? (style === FOOTER_TEXT_STYLE.style ? FOOTER_TEXT_STYLE.textClassName : ''),
            // Text links sit flush; the section's gap spaces them.
            contentInsets: style === FOOTER_TEXT_STYLE.style ? { x: 0 } : undefined,
        };
    }, [btnStyle, variant, size, itemClassName]);
    const pagePath = useScreenPagePath();
  
    
    const menu_launcher_items = useMemo((): FooterMenuItem[] => (
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

    // The badge goes last, after the switchers, as on the site (its `powered_by` item ends the footer's tools).
    const badges = menu_launcher_items.filter((item): item is FooterMenuItem & { icon: string } => isSvgBadge(item));
    const links = badges.length ? menu_launcher_items.filter((item) => !isSvgBadge(item)) : menu_launcher_items;
    const showTools = showLanguageSwitcher || showThemeSwitcher || showSoundsLevel || badges.length > 0;

    return (
        <View className={cntClasses} role="contentinfo">
            {links.length > 0 ? (
                <View className={FOOTER_LINKS_CLASSES}>
                    {links.map((item, index) => {
                        if (item.display_type === 'text')
                            return <FooterTextItem key={item.name || index} item={item} visualProps={visualProps} />;

                        const href = normalizeFooterHref(item.link);
                        // The page you're on stays in the foreground colour and says so to screen readers.
                        const isCurrent = !!href && href === pagePath;
                        return (
                            <NeoButtonLink
                                href={href}
                                key={item.link || index}
                                label={t(item.title ?? '')}
                                style={visualProps.style}
                                controlSize={visualProps.controlSize}
                                contentInsets={visualProps.contentInsets}
                                className={visualProps.className}
                                textClassName={isCurrent ? `${visualProps.textClassName} text-foreground` : visualProps.textClassName}
                                aria-current={isCurrent ? 'page' : undefined}
                            />
                        );
                    })}
                </View>
            ) : null}
            {showTools ? (
                <View className={FOOTER_SECTION_CLASSES}>
                    {showLanguageSwitcher ? <FooterLanguageSwitcher visualProps={visualProps} /> : null}
                    {showThemeSwitcher ? <FooterThemeSwitcher visualProps={visualProps} /> : null}
                    {showSoundsLevel ? <FooterSoundsLevel visualProps={visualProps} /> : null}
                    {badges.map((item, index) => (
                        <FooterBadgeItem key={item.name || index} item={item} href={normalizeFooterHref(item.link)} visualProps={visualProps} />
                    ))}
                </View>
            ) : null}
        </View>
    );
}

export default memo(MenuFooterComponent);