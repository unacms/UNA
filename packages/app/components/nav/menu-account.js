import { View } from 'app/design/view'
import { ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import { menuItemsByName } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import Profile from 'app/ui/molecules/profile'

export default function () {
    
    const { currentUser, setCurrentUser } = useCurrentUser();
    const menu_account_items = menuItemsByName('', appSetting('menu_items', 'menu_account'), currentUser)
    const { t } = useTranslation();

    let profile = null
    if (currentUser) {
        let dUser = Object.assign({}, currentUser)
        dUser.url_avatar = dUser.avatar
        dUser.url = appSetting('layout', 'dashboard')
        profile = <Profile {...dUser} displayType="unit_wo_info" displaySize="base" />
    }

    if (menu_account_items.length == 0 || !profile)
        return <></>;

    return (
        <View className=" flex-row justify-center">
            <DropdownMenu items={menu_account_items.map(
                (item, index) => {
                    return (
                        {
                            id: 'menu-' + index,
                            link: item.link,
                            title: t(item.title),
                            icon:
                                item.icon.indexOf(' ') == -1
                                    ? item.icon
                                    : item.icon.split(' ')[0],
                        }
                    )
                }
            )}
            >
                <ButtonRef
                    tooltip={t("Dashboard")}
                    variant="outline"
                    rounded
                    padding={'0px'}
                    startDecorator={profile}
                    id="m3"
                    onPress={() => { }}
                    aria-label="Dashboard"
                />
            </DropdownMenu>
        </View>
    );
}