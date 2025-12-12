import { View } from 'app/design/view'
import { appSetting, menuItemsByName, menuItemsByNameNew } from 'app/lib/util'
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'app/context/user'
import { MenuItemSidebarWithWrapper } from 'app/components/nav/menu-item-sidebar'
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ElementProfileMenu({ data, blockWrapperProps }) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const menu_items = appSetting('layout', 'user_remote_config') ? menuItemsByNameNew('menu_post', data, currentUser) : menuItemsByName('', appSetting('menu_items', 'menu_sidebar'), currentUser);
    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="profile-menu gap-y-0.5">
                {menu_items.map((item, index) => (
                    <MenuItemSidebarWithWrapper key={`menu-${index}`} icon={item.icon} link={item.link} title={t(item.title)} index={index} userUrl={currentUser.url} />
                ))}
            </View>
        </BlockWrapper>
    )
}
