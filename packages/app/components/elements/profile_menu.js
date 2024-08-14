import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { Dimensions, Platform } from 'react-native'
import { appSetting, menuItemsByName } from 'app/lib/util'
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'app/context/user'

export default function ElementProfileMenu(props) {
    const { t } = useTranslation();
    let windowHeight = Dimensions.get('window').height
    const { currentUser, setCurrentUser } = useCurrentUser();

    let styles = {}
    if (Platform.OS === 'web') {
        styles = { maxHeight: windowHeight - 64 }
    }

    return (
        <View className="profile-menu overflow-hidden">
            <View className="flex-col ">
                {menuItemsByName('main_menu', appSetting('menu_items', 'menu_sidebar'), currentUser).map((item, index) => (
                    <Link key={`menu-${index}`} href={item.link.replace('{profile}', currentUser.url)}>
                        <Button
                            variant="text"
                            startDecorator={item.icon}
                            fullWidth
                            solid
                            align="start"
                            title={t(item.title)}
                            size="lg"
                        />
                    </Link>
                ))}
            </View>
        </View>
    )
}
