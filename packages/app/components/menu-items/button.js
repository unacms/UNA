import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';
import { View } from 'app/design/view';

import Submenu from './submenu'
import SubmenuShare from './submenu-share'

export default function MenuItemButton(oProps) {
    const oIconAliases = {
        'item-comment': 'ChatTeardropDots',
        'item-share': 'ShareFat'
    };

    const bShowActionAsButton = oProps.params?.show_action_as_button == undefined || oProps.params.show_action_as_button === true;
    const bShowVertical = oProps.params != undefined && oProps.params.showVertical != undefined && oProps.params.showVertical === true;
    const bTitleOnly = oProps?.params && oProps.params?.showTitleOnly === true;

    let sContent = undefined;
    switch(oProps.content_type) {
        case 'submenu':
            const oSubmenuMap = {
                'bx_timeline_menu_item_share': SubmenuShare,
            };
            const Element = oSubmenuMap[oProps.submenu.object] != undefined ? oSubmenuMap[oProps.submenu.object] : Submenu;

            sContent = (
                <Element key={oProps.id ? oProps.id : oProps.name} show_action_as_button={bShowActionAsButton} {...oProps} />
            );
            break;

        default:
            const handleClick = () => {
                if(oProps.params?.onclick)
                    oProps.params.onclick(event, oProps);
            };

            const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

            sContent = (
                <ButtonAction title={oProps?.title ? oProps.title : ''} startDecorator={!bTitleOnly ? oIconAliases[oProps.name] : ''} onPress={handleClick} />
            );
    }
    
    return (
        <View className={'menu-item flex-auto flex' + (bShowVertical ? ' w-full' : '') + ' gap-2'}>{sContent}</View>
    );
}
