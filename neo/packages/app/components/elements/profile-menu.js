import { View } from 'app/design/view'
import { appSetting, menuItemsByName, menuItemsByNameNew } from 'app/lib/util'
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'app/context/user'
import { BlockWrapper } from 'app/components/block-wrapper'
import { components } from 'app/components/registry'

export default function ElementProfileMenu({ data, blockWrapperProps }) {
    const { t } = useTranslation();
    const MenuItemSidebarWithWrapper = components['menu-item']['sidebar_with_wrapper'];
    const { currentUser } = useCurrentUser();
    // `menu_sidebar` setting pins the links; unset, the block's menu from UNA.
    const staticItems = appSetting('menu_items', 'menu_sidebar');
    const menu_items = Array.isArray(staticItems) && staticItems.length
        ? menuItemsByName('', staticItems, currentUser)
        : menuItemsByNameNew('menu_post', data, currentUser);
    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="profile-menu gap-0.5 -mx-2">
                {menu_items.map((item, index) => (
                    <MenuItemSidebarWithWrapper key={`menu-${index}`} icon={item.icon} link={item.link} title={t(item.title)} index={index} userUrl={currentUser.url} />
                ))}
            </View>
        </BlockWrapper>
    )
}
