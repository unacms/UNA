import { useState } from 'react'
import { View } from 'app/design/view'
import { appSetting, filterHiddenOn, menuItemsByName, menuItemsByNameNew } from 'app/lib/util'
import { useScreenTier } from 'app/context/measure'
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'app/context/user'
import { BlockWrapper } from 'app/components/block-wrapper'
import { components } from 'app/components/registry'

/** A link the app can open: none for a script the site runs (`javascript:...`), as the drawer's rows (rowHref). */
function itemLink(link) {
    return typeof link === 'string' && link && !/^javascript:/i.test(link) ? link : ''
}

/** The item's count in the site's quiet capsule; none when it is empty or zero, as on the site. */
function itemAddon(addon) {
    if (addon && typeof addon === 'object')
        return addon
    const text = addon === null || addon === undefined ? '' : String(addon)
    return text && text !== '0' ? { text, variant: 'neutral' } : undefined
}

/**
 * The member's own menu (UNA's `sys_profile_stats`) in the home's left column, as the site draws it: each item with
 * its count, and the items after the menu's `more_after` folded under "Show more" (the drawer lists them all).
 */
export default function ElementProfileMenu({ data, blockWrapperProps }) {
    const { t } = useTranslation();
    const MenuItemSidebarWithWrapper = components['menu-item']['sidebar_with_wrapper'];
    const { currentUser } = useCurrentUser();
    const tier = useScreenTier();
    const [expanded, setExpanded] = useState(false);
    // `menu_sidebar` setting pins the links; unset, the block's menu from UNA.
    const staticItems = appSetting('menu_items', 'menu_sidebar');
    const isStatic = Array.isArray(staticItems) && staticItems.length > 0;
    const menu_items = (isStatic
        ? menuItemsByName('', staticItems, currentUser)
        : filterHiddenOn(menuItemsByNameNew('menu_post', data, currentUser), tier)
    ).filter((item) => isStatic || itemLink(item.link));

    const moreAfter = isStatic ? 0 : Number(data?.more_after) || 0;
    const folds = moreAfter > 0 && menu_items.length > moreAfter;
    const shown = folds && !expanded ? menu_items.slice(0, moreAfter) : menu_items;
    const toggleTitle = expanded ? (data?.less_title || t('Show less')) : (data?.more_title || t('Show more'));

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
                        userUrl={currentUser.url}
                    />
                ))}
                {folds && (
                    <MenuItemSidebarWithWrapper
                        icon={expanded ? 'ChevronUp' : 'ChevronDown'}
                        title={toggleTitle}
                        expanded={expanded}
                        onPress={() => setExpanded((value) => !value)}
                        className="profile-menu-more"
                    />
                )}
            </View>
        </BlockWrapper>
    )
}
