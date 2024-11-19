import { Share } from 'react-native';
import { fetcher } from 'app/lib/fetcher';
import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls'
import { Pressable } from 'app/design/view'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { setClipboard } from 'app/lib/util'
import Msg from 'app/ui/molecules/msg';
import { useState } from 'react';
import { appSetting } from 'app/lib/util'

export default function MenuItemSubmenuShare(oProps) {
    const [showMsg, setShowMsg] = useState(false);

    const oIconAliases = {
        'item-share': 'ShareFat',
        'item-copy': 'Clipboard',
        'item-repost': 'ArrowsClockwise'
    };

    let oButtonProps = {
        variant: oProps.primary === "1" ? 'primary' : oProps.params?.button_variant,
        size: oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        showTitleFromSize: oProps.params?.button_show_title_from_size
    };

    const handleMenuManageSelect = async (oItem, event) => {
        switch(oItem.name) {
            case 'item-repost':
                const sResponse = await fetcher('/api.php?r=bx_timeline/repost/Module&params=' + JSON.stringify(Object.values(oItem.data)));
                if(sResponse?.data ){
                    const sMsg = sResponse.data?.message ? sResponse.data?.message : 'The item was successfully reposted.';
                    console.log("sMsg", sMsg)
                    setShowMsg(sMsg);
                }
                break;

            case 'item-copy':
                setClipboard(oItem.link);
                break;

            case 'item-share':
                try {
                    const result = await Share.share({
                       // title: appSetting('layout', 'share_text'),
                       // url: oItem.link,
                        message: appSetting('layout', 'share_text') +""+ oItem.link
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
                break;
        }

    }

    const bShowActionAsButton = oProps.params?.show_action_as_button == undefined || oProps.params.show_action_as_button === true;

    const aSubmenuExcept = [];
    const aSubmenuItems = oProps.submenu.items.map((oItem) => {
        if(!(oItem.id || oItem.name) || aSubmenuExcept.includes(oItem.name))
            return;
        
        return {
            id: !!oItem.id ? oItem.id : oItem.name,
            link: oItem.link,
            name: oItem.name,
            title: oItem.title,
            icon: oIconAliases[oItem.name],
        };
    });

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

    if (aSubmenuItems.length === 1) {
        return  <ButtonAction onPress={() => {handleMenuManageSelect(aSubmenuItems[0])}} {...oButtonProps} title={oProps?.title ? oProps.title : ''} startDecorator={oIconAliases[oProps.name] ? oIconAliases[oProps.name] : ''} />
    }

  

    return (
        <>
            <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />
            <Pressable className={"flex-auto"+ (oProps.params?.no_gap_between_buttons === true ? (oProps.params?.button_full_width ? '  px-0 ': '  pr-2 ') : '')} onPress={(event) => {event.preventDefault()}}>
                <DropdownMenu items={aSubmenuItems} onSelect={handleMenuManageSelect}>
                    <ButtonAction {...oButtonProps} title={oProps?.title ? oProps.title : ''} startDecorator={oIconAliases[oProps.name] ? oIconAliases[oProps.name] : ''} />
                </DropdownMenu>
            </Pressable>
        </>
    );
}
