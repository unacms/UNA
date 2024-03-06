import { View } from 'app/design/view'
import { ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import { menuItemsByName } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';


export default function () {

    const bApps = appSetting('layout', 'apps') == true;
    const { currentUser, setCurrentUser } = useCurrentUser();
    const menu_launcher_items = menuItemsByName('', appSetting('menu_items', 'menu_launcher'), currentUser);
    const { t } = useTranslation();

    if (menu_launcher_items.length == 0 || !bApps)
        return <></>;

    return (
        <View className="relative hidden lg:flex flex-row">
            <DropdownMenu items={menu_launcher_items.map((item, index) => ({
                id: 'menu-' + index,
                link: item.link,
                title: t(item.title),
                icon: item.icon.includes(' ') ? item.icon.split(' ')[0] : item.icon,
            }))
            }
            >
                <ButtonRef
                    tooltip="All Apps"
                    variant="outline"
                    size="base"
                    fullWidth
                    rounded
                    alt={t("All Apps")}
                    startDecorator="CirclesFour"
                    aria-label="All Apps"
                    onPress={() => { }}
                />
            </DropdownMenu>
        </View>
    );
}