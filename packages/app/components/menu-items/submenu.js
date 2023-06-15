import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';
import { Pressable } from 'app/design/view';
import dynamic from 'next/dynamic'

export default function MenuItemSubmenu(oProps) {

    const DropdownMenu = dynamic(() => import('app/ui/atoms/dropdown-menu'), {
        ssr: false,
    })

    const oIconAliases = {};

    const bShowActionAsButton = oProps.params?.show_action_as_button == undefined || oProps.params.show_action_as_button === true;

    const aSubmenuExcept = [];
    const aSubmenuItems = oProps.submenu.items.map((oItem) => {
        if(!(oItem.id || oItem.name) || aSubmenuExcept.includes(oItem.name))
            return;

        return {
            id: !!oItem.id ? oItem.id : oItem.name,
            link: oItem.link,
            title: oItem.title,
        };
    });

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

    return (
        <Pressable onPress={(event) => {event.preventDefault()}}>
            <DropdownMenu items={aSubmenuItems}>
                <ButtonAction title={oProps?.title ? oProps.title : ''} startDecorator={!!oIconAliases[oProps.name] ? oIconAliases[oProps.name] : ''} />
            </DropdownMenu>
        </Pressable>
    );
}
