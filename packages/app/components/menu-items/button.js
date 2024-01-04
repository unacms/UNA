import Link from 'app/ui/atoms/link'
import {ButtonMenuActionDefault, ButtonMenuActionText} from 'app/design/controls';
import { View, Row } from 'app/design/view';
import React from 'react';
import Submenu from './submenu'
import SubmenuShare from './submenu-share'
import ProfilesList from "app/ui/molecules/profile_list";
import Icon from 'app/icons-web';
import { Text } from 'app/design/typography'

export default function MenuItemButton(oProps) {

    const oIconAliases = {
        'item-comment': 'ChatTeardropDots',
        'item-share': 'ShareFat'
    };

    const bShowActionAsButton = oProps.params?.show_action_as_button == undefined || oProps.params.show_action_as_button === true;
    const bShowVertical = oProps?.params && oProps.params.showVertical != undefined && oProps.params.showVertical === true;
    const bTitleOnly = oProps?.params && oProps.params?.showTitleOnly === true;
    const oIconset = oProps?.params && !!oProps.params?.iconset ? oProps.params.iconset : {};

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
            if(oProps.params?.button_full_width != undefined)
                oButtonProps.fullWidth = oProps.params.button_full_width;
            if(oProps.params?.button_hide_title_on_small != undefined)
                oButtonProps.hideTitleOnSmall = oProps.params.button_hide_title_on_small;
            const handleClick = (event) => {
                if(!oProps?.link && !oProps.params?.onclick)
                    return;

                event.preventDefault();

                if(oProps?.link) {
                  //  let sUrl = oProps.link[0] === '/' ? oProps.link : '/' + oProps.link;
                   // redirectdRef.current.redirect(sUrl);
                }

                if(oProps.params?.onclick)
                    oProps.params.onclick(event, oProps);
            };

            const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

            let sButtonIcon = '';
            if (oProps.list && oProps.list.length == 0)
                sButtonIcon = "Users"
            
                if(!bTitleOnly) {
                if(!!oIconAliases[oProps.name])
                    sButtonIcon = oIconAliases[oProps.name];
                else if(!!oIconset[oProps.name])
                    sButtonIcon = oIconset[oProps.name];
            }

            const buttonAction = <ButtonAction title={oProps.title} startDecorator={sButtonIcon} {...oButtonProps} />;
            sContent = (
                <Row className={bShowVertical ? "flex-col flex-auto items-stretch" : "flex-auto items-center"}>
                    { (oProps.list && oProps.list.length> 0) && <ProfilesList data ={oProps.list} showEmpty={false} maxCount={3} displaySize="sm"/> }
                    {oProps?.link ? 
                        <Link emulate={oProps.emulate} href={oProps.link[0] === '/' ? oProps.link : '/' + oProps.link}>
                            {buttonAction}
                        </Link> 
                        : 
                        React.cloneElement(buttonAction, { onPress: handleClick })
                    }
                    
                </Row>
            );
    }

    return (
        <View className={'menu-item flex-auto ' + (bShowVertical ? ' w-full' : ' flex-row items-center justify-center')}>{sContent}</View>
    );
}
