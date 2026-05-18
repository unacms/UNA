import { View } from 'app/design/view'
import { appSetting, menuItemsByName, menuItemsByNameNew } from 'app/lib/util'
import { useTranslation } from 'react-i18next';
import { useMemo, memo } from 'react';
import { NeoButton, NeoButtonLink } from 'app/design/controls'
import { useCurrentUserNoCounters } from 'app/context/user';
import { useMenuData } from 'app/context/menu-data';
import { useLayoutSettings } from 'app/context/layout-settings';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';

export const MENU_FOOTER_CLASSES = 'flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-1 p-4 min-h-16';
const FOOTER_THEME_ITEMS = [
    { id: 'auto', title: 'Auto', icon: 'Eclipse' },
    { id: 'light', title: 'Light', icon: 'Sun' },
    { id: 'dark', title: 'Dark', icon: 'Moon' },
];

const linkVariantToNeoStyle = {
    default: 'plain',
    secondary: 'borderless',
    accent: 'link',
    primary: 'borderedProminent',
    ghost: 'borderless',
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

const menuFooterSkeletonWidths = ['w-12', 'w-12', 'w-12', 'w-12', 'w-12'];

function MenuFooterSkeleton({ cntClasses, children }) {
    return (
        <View className={cntClasses}>
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
            title: t(theme.title),
            icon: theme.icon,
            selected: currentThemeName === theme.id,
        }))
    ), [currentThemeName, t]);
    const currentThemeItem = FOOTER_THEME_ITEMS.find((theme) => theme.id === currentThemeName) ?? FOOTER_THEME_ITEMS[0];

    return (
        <DropdownMenu
            items={items}
            onSelect={(item) => setThemeName(item.id)}
        >
            <NeoButton
                label={t(currentThemeItem.title)}
                image={currentThemeItem.icon}
                style={visualProps.style}
                controlSize={visualProps.controlSize}
                className={visualProps.className}
                textClassName={visualProps.textClassName}
            />
        </DropdownMenu>
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
    const usesRemoteFooter = !menu_items && appSetting('layout', 'user_remote_config');
    const showThemeSwitcher = appSetting('dashboard', 'switch_theme');
    const { menuData, isFetched, isLoading } = useMenuData(
        menu_items ? null : appSetting('menu_items', 'objects', 'footer')
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

    if (usesRemoteFooter && (isLoading || !isFetched)) {
        return (
            <MenuFooterSkeleton cntClasses={cntClasses}>
                {showThemeSwitcher ? <FooterThemeSwitcher visualProps={visualProps} /> : null}
            </MenuFooterSkeleton>
        );
    }

    if (menu_launcher_items.length === 0 && menuData && !showThemeSwitcher)
        return null;

    return (
        <View className={cntClasses}>
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
            {showThemeSwitcher ? <FooterThemeSwitcher visualProps={visualProps} /> : null}
        </View>
    );
}

export default memo(MenuFooterComponent);