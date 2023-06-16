import { Share } from 'react-native';
import { fetcher } from 'app/lib/fetcher';
import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls'
import { Pressable } from 'app/design/view'
import React from 'react';
import dynamic from 'next/dynamic'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';

export default function MenuItemSubmenuShare(oProps) {

   
    const Clipboard = dynamic(() => import('@react-native-clipboard/clipboard'), {
        loading: () => <></>,
    })

    const oIconAliases = {
        'item-share': 'ShareNetwork',
        'item-copy': 'Clipboard',
        'item-repost': 'ArrowsClockwise'
    };

    const bShowActionAsButton = oProps.params?.show_action_as_button == undefined || oProps.params.show_action_as_button === true;

    const aSubmenuExcept = [];
    const aSubmenuItems = oProps.submenu.items.map((oItem) => {
        if(!(oItem.id || oItem.name) || aSubmenuExcept.includes(oItem.name))
            return;

        let handleClick = undefined;
        switch(oItem.name) {
            case 'item-repost':
                handleClick = async () => {
                    const sResponse = await fetcher('/api.php?r=bx_timeline/repost/Module&params=' + JSON.stringify(Object.values(oItem.data)));
                    if(sResponse?.data && parseInt(sResponse.data?.code) > 0)
                        console.log(sResponse.data);
                };
                break;

            case 'item-copy':
                handleClick = () => {
                    Clipboard.setString(oItem.link);
                }
                break;

            case 'item-share':
                handleClick = async () => {
                    try {
                        const result = await Share.share({
                            message: oItem.link,
                        });

                        switch(result.action) {
                            case Share.sharedAction:
                                if (result.activityType) {
                                    // shared with activity type of result.activityType
                                } else {
                                    // shared
                                }
                                break;
                                
                            case Share.dismissedAction:
                                // dismissed
                                break;
                        }
                    } catch (error) {
                        console.log(error.message);
                    }
                };
                break;
        }

        return {
            id: !!oItem.id ? oItem.id : oItem.name,
            link: oItem.link,
            title: oItem.title,
            icon: oIconAliases[oItem.name],
            onClick: handleClick
        };
    });

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;


    return (
        <Pressable className="flex-auto" onPress={(event) => {event.preventDefault()}}>
            <DropdownMenu items={aSubmenuItems}>
                <ButtonAction title={oProps?.title ? oProps.title : ''} startDecorator={oIconAliases[oProps.name] ? oIconAliases[oProps.name] : ''} />
            </DropdownMenu>
        </Pressable>
    );
}
