import { Clipboard, Share } from 'react-native';

import { fetcher } from 'app/lib/fetcher';
import { Text } from 'app/design/typography'
import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls'
import { View, Pressable } from 'app/design/view'
import { 
    DropdownMenuRoot, 
    DropdownMenuContentV, 
    DropdownMenuTrigger, 
    DropdownMenuItemV, 
    DropdownMenuItemTitle,
    DropdownMenuItemIcon
} from 'app/design/dropdown';
import { Icon } from 'app/ui/atoms/icon'

export default function MenuItemSubmenuShare(oProps) {
    const oIconAliases = {
        'item-share': 'ShareFat',
        'item-copy': 'Clipboard',
        'item-repost': 'ArrowsClockwise'
    };

    const bShowActionAsButton = oProps.params?.show_action_as_button == undefined || oProps.params.show_action_as_button === true;

    const aSubmenuExcept = [];
    const sSubmenuItems = Object.keys(oProps.submenu.items).map(function(iKey) {
        const aItem = oProps.submenu.items[iKey];

        if(!(aItem.id || aItem.name) || aSubmenuExcept.includes(aItem.name))
            return;

        let handleClick = undefined;
        switch(aItem.name) {
            case 'item-repost':
                handleClick = async () => {
                    const sResponse = await fetcher('/api.php?r=bx_timeline/repost/Module&params=' + JSON.stringify(Object.values(aItem.data)));
                    if(sResponse?.data && parseInt(sResponse.data?.code) > 0)
                        console.log(sResponse.data);
                };
                break;

            case 'item-copy':
                handleClick = () => {
                    Clipboard.setString(aItem.link);
                }
                break;

            case 'item-share':
                handleClick = async () => {
                    try {
                        const result = await Share.share({
                            message: aItem.link,
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

        return (
            <DropdownMenuItemV key={aItem.id ? aItem.id : aItem.name} onSelect={() => handleClick()}>
                <DropdownMenuItemIcon>
                    <Icon icon={oIconAliases[aItem.name]}></Icon>
                </DropdownMenuItemIcon>
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
