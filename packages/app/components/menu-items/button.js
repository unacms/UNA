import { useRef } from 'react';

import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';
import { View } from 'app/design/view';
import Redirect from 'app/ui/atoms/redirect';

import Submenu from './submenu'
import SubmenuShare from './submenu-share'

export default function MenuItemButton(oProps) {
    const redirectdRef = useRef();

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
            let oButtonProps = {};
            if(oProps.primary)
                oButtonProps.variant = 'primary';
            if(oProps.params?.button_variant != undefined)
                oButtonProps.variant = oProps.params.button_variant;
            if(oProps.params?.button_size != undefined)
                oButtonProps.size = oProps.params.button_size;
            if(oProps.params?.button_rounded != undefined)
                oButtonProps.rounded = oProps.params.button_rounded;

            const handleClick = (event) => {
                if(!oProps?.link && !oProps.params?.onclick)
                    return;

                event.preventDefault();

                if(oProps?.link) {
                    redirectdRef.current.redirect(oProps?.link);
                }

                if(oProps.params?.onclick)
                    oProps.params.onclick(event, oProps);
            };

            const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

            sContent = (
                <View className="flex-auto">
                    <Redirect ref={redirectdRef} />
                    <ButtonAction title={oProps?.title ? oProps.title : ''} startDecorator={!bTitleOnly ? oIconAliases[oProps.name] : ''} onPress={handleClick} {...oButtonProps} />
                </View>
            );
    }

    return (
        <View className={'menu-item flex-auto ' + (bShowVertical ? ' w-full' : ' flex-row items-center justify-center')}>{sContent}</View>
    );
}
