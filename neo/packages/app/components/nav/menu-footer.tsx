import { View } from 'app/design/view'
import { Platform } from 'react-native'
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
    /** `switch_language`: the site's languages (UNA sends the item while it has two or more). */
    languages?: string[];
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

/** Which switchers the footer shows; `languages` are the language switcher's options. */
type FooterSwitcherFlags = { language: boolean; languages: string[]; theme: boolean; sounds: boolean };

/** UNA's Powered by badge: an item whose icon is its SVG. */
type FooterBadge = FooterMenuItem & { icon: string };

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

function MenuFooterSkeleton({ cntClasses, children, role }: Readonly<{ cntClasses: string; children?: ReactNode; role: ComponentProps<typeof View>['role'] }>) {
    return (
        <View className={cntClasses} role={role}>
            <View className={FOOTER_LINKS_CLASSES}>
                {/* 20px + 2 × 4px: the 28px row of a `mini` link, so the footer keeps its height when the links arrive.
                    No side margin: the section's gap spaces the links too. */}
                {menuFooterSkeletonWidths.map((width, index) => (
                    <View
                        key={`menu-footer-skeleton-${index}`}
                        className={`h-5 my-1 ${width} rounded-full bg-muted animate-pulse`}
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
function FooterTextItem({ item, visualProps }: Readonly<FooterControlProps & { item: FooterMenuItem }>) {
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

function FooterThemeSwitcher({ visualProps }: Readonly<FooterControlProps>) {
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

function FooterSoundsLevel({ visualProps }: Readonly<FooterControlProps>) {
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

// UNA's Powered by badge: the item's own SVG, the UNA logo (Navigation keeps it editable), 24px tall as on
// the site, in the links' colour (`currentColor`), foreground on hover. Its name ("Powered by UNA", in the
// site's language) is its tooltip and accessible name.
const BADGE_HEIGHT = 24;
const isSvgBadge = (item: FooterMenuItem): item is FooterBadge => typeof item.icon === 'string' && item.icon.startsWith('<svg') && !item.title;
const badgeWidth = (svg: string) => {
    const [, width, height] = /viewBox="\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)\s*"/i.exec(svg) ?? [];
    return width && height && +height ? Math.round((BADGE_HEIGHT * +width) / +height) : BADGE_HEIGHT;
};

function FooterBadgeItem({ item, href, visualProps }: Readonly<FooterControlProps & { item: FooterBadge; href: string }>) {
    return (
        <NeoButtonLink
            href={href}
            target="_blank"
            accessibilityLabel={item.title_attr || undefined}
            tooltip={item.title_attr || undefined}
            tooltipSide="top"
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

function FooterLanguageSwitcher({ langs, visualProps }: Readonly<FooterControlProps & { langs: string[] }>) {
    const { t } = useTranslation();
    const { lang, langCode, autoLangCode, setLang } = useLayoutSettings();
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

/** The look of the footer's controls: the legacy `btnStyle`, `variant` and `size` props, else quiet text links. */
function footerVisualProps(btnStyle: FooterButtonStyle | undefined, variant?: string, size?: string, itemClassName?: string): FooterVisualProps {
    const legacy: FooterButtonStyle = btnStyle || {};
    const legacyVariant = variant ?? legacy.variant;
    const legacySize = size ?? legacy.size;
    const style = legacy.style ?? (legacyVariant ? linkVariantToNeoStyle[legacyVariant] ?? 'link' : FOOTER_TEXT_STYLE.style);
    const isText = style === FOOTER_TEXT_STYLE.style;
    return {
        style,
        controlSize: legacy.controlSize ?? (legacySize ? linkSizeToNeoControlSize[legacySize] ?? 'small' : FOOTER_TEXT_STYLE.controlSize),
        className: legacy.containerClassName ?? '',
        textClassName: itemClassName ?? legacy.textClassName ?? legacy.className ?? (isText ? FOOTER_TEXT_STYLE.textClassName : ''),
        // Text links sit flush; the section's gap spaces them.
        contentInsets: isText ? { x: 0 } : undefined,
    };
}

// The links and text lines. The page you're on stays in the foreground colour and says so to screen readers.
function FooterLinks({ links, visualProps }: Readonly<FooterControlProps & { links: FooterMenuItem[] }>) {
    const { t } = useTranslation();
    const pagePath = useScreenPagePath();

    if (!links.length) return null;

    return (
        <View className={FOOTER_LINKS_CLASSES}>
            {links.map((item, index) => {
                if (item.display_type === 'text')
                    return <FooterTextItem key={item.name || index} item={item} visualProps={visualProps} />;

                const href = normalizeFooterHref(item.link);
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
    );
}

function FooterSwitchers({ language, languages, theme, sounds, visualProps }: Readonly<FooterControlProps & FooterSwitcherFlags>) {
    return (
        <>
            {language ? <FooterLanguageSwitcher langs={languages} visualProps={visualProps} /> : null}
            {theme ? <FooterThemeSwitcher visualProps={visualProps} /> : null}
            {sounds ? <FooterSoundsLevel visualProps={visualProps} /> : null}
        </>
    );
}

// The switchers, then the badge, as on the site (its `powered_by` item ends the footer's tools).
function FooterTools({ switchers, badges, visualProps }: Readonly<FooterControlProps & { switchers: FooterSwitcherFlags; badges: FooterBadge[] }>) {
    if (!switchers.language && !switchers.theme && !switchers.sounds && !badges.length) return null;

    return (
        <View className={FOOTER_SECTION_CLASSES}>
            <FooterSwitchers {...switchers} visualProps={visualProps} />
            {badges.map((item, index) => (
                <FooterBadgeItem key={item.name || index} item={item} href={normalizeFooterHref(item.link)} visualProps={visualProps} />
            ))}
        </View>
    );
}

function MenuFooterComponent({
    cntClasses = MENU_FOOTER_CLASSES,
    btnStyle,
    menu_items,
    variant,
    size,
    itemClassName,
}: Readonly<MenuFooterProps>) {

    const currentUser = useCurrentUserNoCounters();
    const { hydrated } = useLayoutSettings();
    // `menu_footer` setting pins the links; unset, they come from UNA's footer menu.
    const staticFooter = appSetting('menu_items', 'menu_footer');
    const useStaticFooter = Array.isArray(staticFooter) && staticFooter.length > 0;
    const usesRemoteFooter = !menu_items && !useStaticFooter;
    const { available: soundsAvailable } = useSoundsLevel();
    const { menuData, isFetched, isLoading } = useMenuData(
        (!usesRemoteFooter || !hydrated) ? null : appSetting('menu_items', 'objects', 'footer')
    );

    const remoteItems = useMemo((): FooterMenuItem[] => (
        usesRemoteFooter ? menuItemsByNameNew('menu_post', menuData, currentUser) : []
    ), [usesRemoteFooter, menuData, currentUser]);
    // With UNA's footer, UNA decides: its `switch_language` item comes while the site has two or
    // more languages, and the switcher offers only those (and System). Without it, the setting.
    const siteLanguages = usesRemoteFooter ? remoteItems.find((item) => item.name === 'switch_language')?.languages : undefined;
    const configuredLangs = appSetting('layout', AVAILABLE_LANGS_SETTING_KEY);
    const languages = useMemo((): string[] => {
        const configured: string[] = Array.isArray(configuredLangs) ? configuredLangs : [];
        if (!usesRemoteFooter) return configured;
        if (!Array.isArray(siteLanguages)) return [];
        return configured.filter((language) => language === 'auto' || siteLanguages.includes(language));
    }, [configuredLangs, usesRemoteFooter, siteLanguages]);
    const switchers: FooterSwitcherFlags = {
        // UNA's footer: two site languages NEO has; a footer of its own: two options, System counted, as before.
        language: hydrated && (usesRemoteFooter
            ? languages.filter((language) => language !== 'auto').length > 1
            : languages.length > 1),
        languages,
        theme: !!appSetting('dashboard', 'switch_theme'),
        sounds: hydrated && soundsAvailable,
    };

    const visualProps = useMemo(
        () => footerVisualProps(btnStyle, variant, size, itemClassName),
        [btnStyle, variant, size, itemClassName]
    );

    const menu_launcher_items = useMemo((): FooterMenuItem[] => (
        menu_items || (usesRemoteFooter
            ? remoteItems.filter((item) => item.name !== 'switch_language')
            : menuItemsByName('', staticFooter, currentUser))
    ), [menu_items, usesRemoteFooter, remoteItems, currentUser, staticFooter]);

    if (usesRemoteFooter && (!hydrated || isLoading || !isFetched)) {
        return (
            <MenuFooterSkeleton cntClasses={cntClasses} role="contentinfo">
                <FooterSwitchers {...switchers} visualProps={visualProps} />
            </MenuFooterSkeleton>
        );
    }

    if (menu_launcher_items.length === 0 && menuData && !switchers.theme && !switchers.language && !switchers.sounds)
        return null;

    const badges = menu_launcher_items.filter(isSvgBadge);
    const links = badges.length ? menu_launcher_items.filter((item) => !isSvgBadge(item)) : menu_launcher_items;

    return (
        <View className={cntClasses} role="contentinfo">
            <FooterLinks links={links} visualProps={visualProps} />
            <FooterTools switchers={switchers} badges={badges} visualProps={visualProps} />
        </View>
    );
}

const MenuFooter = memo(MenuFooterComponent);

/**
 * The site footer at the end of a page. Native apps show none by default (the tab bar holds the
 * pages, and infinite lists would push it away; the member menu has the footer's links); a fork
 * turns it on with `layout.native_page_footer`.
 */
export function PageFooter() {
    if (Platform.OS !== 'web' && !appSetting('layout', 'native_page_footer')) return null;
    return <MenuFooter />;
}

export default MenuFooter;
