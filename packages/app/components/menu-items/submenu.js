import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'
import { Icon } from 'app/ui/atoms/icon'

export default function MenuItemSubmenu(oProps) {
    const oIconAliases = {};

    const bShowActionAsButton = oProps.params?.show_action_as_button == undefined || oProps.params.show_action_as_button === true;
    
    const aSubmenuExcept = [];
    const sSubmenuItems = Object.keys(oProps.submenu.items).map(function(iKey) {
        const aItem = oProps.submenu.items[iKey];

        if(!(aItem.id || aItem.name) || aSubmenuExcept.includes(aItem.name))
            return;

        //TODO: Add support for Elements

        return (
            <DropdownMenuItemV key={aItem.id ? aItem.id : aItem.name} onSelect={() => handleClick(aItem.link)}>
                <DropdownMenuItemTitle>{aItem.title}</DropdownMenuItemTitle>
            </DropdownMenuItemV>
        );
    });

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

    return (
        <Pressable onPress={(event) => {event.preventDefault()}}>
            <DropdownMenuRoot>
                <DropdownMenuTrigger>
                    <ButtonAction title={oProps?.title ? oProps.title : ''} startDecorator={oIconAliases[oProps.name] ? oIconAliases[oProps.name] : ''} />
                </DropdownMenuTrigger>
                <DropdownMenuContentV>{sSubmenuItems}</DropdownMenuContentV>
            </DropdownMenuRoot>
        </Pressable>
    );
}
