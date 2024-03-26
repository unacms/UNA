import { View } from 'app/design/view'
import { ButtonRef } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { appSetting } from 'app/lib/util'
import { menuItemsByName } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';


export default function ({buttonProps}) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const menu_add_items = menuItemsByName('', appSetting('menu_items', 'menu_add'), currentUser)
    const { t } = useTranslation();
    if (menu_add_items.length == 0)
        return <></>;

    const buttonPropsDef = {
        variant: "outline",
        rounded: 'rounded',
        startDecorator: "Plus",
        id: "m3",
        tooltip: "Create",
    }
    if (!buttonProps)
        buttonProps = buttonPropsDef;

    return (
        <View>
            <DropdownMenu
                items={menu_add_items.map(
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
                    {...buttonProps}
                    onPress={() => { }}
                />
            </DropdownMenu>
        </View>
    );
}