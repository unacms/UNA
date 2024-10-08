import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';
import { Pressable } from 'app/design/view';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';

export default function MenuItemSubmenu(oProps) {

    const oIconAliases = {};

    const bShowActionAsButton = oProps.params?.show_action_as_button == undefined || oProps.params.show_action_as_button === true;

    let oButtonProps = {
        variant: oProps.primary === "1" ? 'primary' : oProps.params?.button_variant,
        size: oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        hideTitleOnSmall: oProps.params?.button_hide_title_on_small
    };

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
                <ButtonAction title={oProps?.title ? oProps.title : ''} {...oButtonProps} startDecorator={!!oIconAliases[oProps.name] ? oIconAliases[oProps.name] : ''} />
            </DropdownMenu>
        </Pressable>
    );
}
