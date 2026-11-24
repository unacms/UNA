import { View } from 'app/design/view'
import { appSetting, filterHiddenOn, menuItemsByName, menuItemsByNameNew } from 'app/lib/util'
import { useScreenTier } from 'app/context/measure'
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'app/context/user'
import { BlockWrapper } from 'app/components/block-wrapper'
import { components } from 'app/components/registry'
import { setPref, usePref } from 'app/context/prefs'
import type { MenuItem } from 'app/lib/util/menu'

/** The member's own menu as UNA sends it (`BxBaseMenuProfileStats::getCodeAPI`). */
export type ProfileMenuData = {
    object?: string;
    items?: MenuItem[];
    config?: unknown;
    /** How many items show before "Show more"; 0 or none: all. */
    more_after?: number | string;
    /** UNA's labels for the control; an older UNA sends none. */
    more_title?: string;
    less_title?: string;
};

export type ProfileMenuProps = {
    data?: ProfileMenuData | null;
    blockWrapperProps?: Record<string, unknown>;
};

type Addon = string | { text?: string; variant?: string; hideZero?: boolean } | undefined;

/** A link the app can open: none for a script the site runs (`javascript:...`), as the drawer's rows (rowHref). */
function itemLink(link: unknown): string {
    return typeof link === 'string' && link && !/^javascript:/i.test(link) ? link : ''
}

/** The item's count in the site's quiet capsule; none when it is empty or zero, as on the site. */
function itemAddon(addon: unknown): Addon {
    if (addon && typeof addon === 'object')
        return addon as Addon
    const text = addon === null || addon === undefined ? '' : String(addon)
    return text && text !== '0' ? { text, variant: 'neutral' } : undefined
}

/**
 * The member's own menu (UNA's `sys_profile_stats`) in the home's left column, as the site draws it: each item with
 * its count, and the items after the menu's `more_after` folded under "Show more" (the drawer lists them all).
 */
export default function ElementProfileMenu({ data, blockWrapperProps }: Readonly<ProfileMenuProps>) {
    const { t } = useTranslation();
    const MenuItemSidebarWithWrapper = (components as Record<string, Record<string, any>>)['menu-item']!['sidebar_with_wrapper'];
    const { currentUser } = useCurrentUser();
    // `false` for a guest, `null` until known.
    const viewer = currentUser || undefined;
    const tier = useScreenTier();
    // Folded until the member shows more; the choice stays on the device for that profile, as the site keeps it for
    // the session (menu.php set_collapsed).
    const foldKey = `${data?.object || 'sys_profile_stats'}:${viewer?.id ?? ''}`;
    const menusExpanded = usePref('menusExpanded') || [];
    const expanded = menusExpanded.includes(foldKey);
    const toggle = () => setPref('menusExpanded', expanded
        ? menusExpanded.filter((item) => item !== foldKey)
        : [...menusExpanded, foldKey]);
    // `menu_sidebar` setting pins the links; unset, the block's menu from UNA.
    const staticItems = appSetting('menu_items', 'menu_sidebar');
    const isStatic = Array.isArray(staticItems) && staticItems.length > 0;
    const menuItems: MenuItem[] = (isStatic
        ? menuItemsByName('', staticItems, currentUser)
        : filterHiddenOn(menuItemsByNameNew('menu_post', data, currentUser), tier)
    ).filter((item: MenuItem) => isStatic || itemLink(item.link));

    const moreAfter = isStatic || !data?.more_title ? 0 : Number(data?.more_after) || 0;
    const folds = moreAfter > 0 && menuItems.length > moreAfter;
    const shown = folds && !expanded ? menuItems.slice(0, moreAfter) : menuItems;
    // UNA's own words for the control (an older UNA sends none: the list then shows every item).
    const toggleTitle = expanded ? data?.less_title : data?.more_title;

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="profile-menu gap-0.5 -mx-2">
                {shown.map((item, index) => (
                    <MenuItemSidebarWithWrapper
                        key={`menu-${item.id ?? item.name ?? index}`}
                        icon={item.icon}
                        link={isStatic ? item.link : itemLink(item.link)}
                        title={t(item.title)}
                        addon={itemAddon(item.addon)}
                        index={index}
                        userUrl={viewer?.url}
                    />
                ))}
                {folds && (
                    <MenuItemSidebarWithWrapper
                        icon={expanded ? 'ChevronUp' : 'ChevronDown'}
                        title={toggleTitle}
                        expanded={expanded}
                        onPress={toggle}
                        className="profile-menu-more"
                    />
                )}
            </View>
        </BlockWrapper>
    )
}
