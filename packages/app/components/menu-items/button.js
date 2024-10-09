import Link from 'app/ui/atoms/link'
import {ButtonMenuActionDefault, ButtonMenuActionText} from 'app/design/controls';
import { View, Row } from 'app/design/view';
import React from 'react';
import Submenu from './submenu'
import SubmenuShare from './submenu-share'
import ProfilesList from "app/ui/molecules/profile_list";
import { Text } from 'app/design/typography'
import { getIconByNameFromIconset } from 'app/lib/util';

export default function MenuItemButton(oProps) {

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
            let oButtonProps = {
                variant: oProps.primary === "1" ? 'primary' : oProps.params?.button_variant,
                size: oProps.params?.button_size,
                rounded: oProps.params?.button_rounded,
                fullWidth: oProps.params?.button_full_width,
                showTitleFromSize: oProps.params?.button_show_title_from_size
            };
            
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
                if(sButtonIcon == '')
                    sButtonIcon = getIconByNameFromIconset(oIconset, oProps.name);
            }

            let buttonAction = <ButtonAction title={oProps.title} startDecorator={sButtonIcon} {...oButtonProps} />;
            if (oProps?.list?.length > 0){
                buttonAction = <Text className="hover:text-linkhover px-2 text-neutral-700 dark:text-neutral-300 font-medium hover:underline">{oProps.title}</Text>
            }
            sContent = (
                <Row className={bShowVertical ? "flex-col flex-auto items-stretch" : "flex-auto items-center"}>
                    { (oProps.list && oProps.list.length> 0) && <ProfilesList data ={oProps.list} showEmpty={false} maxCount={3} displaySize="sm"/> }
                    {oProps?.link ? 
                        <Link emulate={true} href={oProps.link[0] === '/' ? oProps.link : '/' + oProps.link}>
                            {buttonAction}
                        </Link> 
                        : 
                        React.cloneElement(buttonAction, { onPress: handleClick })
                    }
                    
                </Row>
            );
    }

    return (
        <View className={'menu-item flex-auto ' + (bShowVertical ? ' w-full ' : ' flex-row items-center justify-center ')}>{sContent}</View>
    );
}
