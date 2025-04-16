import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { appSetting, menuItemsByName, menuItemsByNameNew } from 'app/lib/util'
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'app/context/user'
import MenuItemSidebar from 'app/components/nav/menu-item-sidebar'

export default function ElementProfileMenu(props) {
    const { t } = useTranslation();
    const { currentUser, setCurrentUser } = useCurrentUser();
    const menu_items = appSetting('layout', 'user_remote_config') ? menuItemsByNameNew('menu_post', props.data, currentUser) : menuItemsByName('', appSetting('menu_items', 'menu_sidebar'), currentUser);
    return (
        <View className="profile-menu gap-y-[2px]">
            
                {menu_items.map((item, index) => (
                    <MenuItemSidebar key={`menu-${index}`}  icon = {item.icon} link={item.link} title={t(item.title)} index={index} userUrl={currentUser.url}/>
                ))}
            
        </View>
    )
}
