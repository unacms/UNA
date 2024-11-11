import { useRef, useState, useContext } from 'react';
import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';
import { View } from 'app/design/view';
import { fetcher } from 'app/lib/fetcher';
import Submenu from './submenu'
import SubmenuShare from './submenu-share'
import Redirect from 'app/ui/atoms/redirect';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Platform } from 'react-native';
import RbList from 'app/ui/molecules/radio_list';
import { storageClear, getAlert } from 'app/lib/util';
import { useLayoutData } from 'app/context/layout';

const setMembership = async (val) => {
    oProps.data.value = val;
    let request_url = '/api.php?r=system/set_membership/TemplServiceProfiles&params[]=' + oProps.data.profile_id + '&params[]=' + val;
    await fetcher(request_url);
    setBottomSheetData(false);
}

const handleClick = async (event, oProps, setBottomSheetData, setLayoutData, redirectdRef, buttonProps, setButtonProps) => {
    if (oProps.content_type == 'memberships') {
        if (Platform.OS == 'web') {
            const popperDiv = document.querySelector('div[data-radix-popper-content-wrapper]');
            if (popperDiv) {
                popperDiv.classList.add('radix-hide');
            }
        }
        setBottomSheetData({ title: 'Choose membership', showClose: true, snapPoints: ['70%', '70%'], content: <RbList values={oProps.data.values} setValue={setMembership} selectedValue={oProps.data.value} /> });
        return;
    }

    let request_url = '/api.php?r=' + buttonProps.request_url;
    const sResponse = await fetcher(request_url);
    if (oProps.data.on_callback == 'hide')
        setButtonProps({...buttonProps, visible:false})

    if (oProps.data.on_callback == 'change')
        setButtonProps({...buttonProps, title:sResponse.data?.title, request_url:sResponse.data?.request_url})

    if (oProps.data.on_callback == 'redirect')
        redirectdRef.current.redirect(sResponse.data?.url ? sResponse.data?.url : sResponse.data);
    
    if (oProps.data.on_callback == 'alert') {
        if (oProps.data.on_callback_clear_cache)
            storageClear();
        setLayoutData(getAlert(oProps.data.on_callback_param, { time: Date.now(), reload: true }));
    }
};

export default function MenuItemButton(oProps) {
    const redirectdRef = useRef();
    const { setBottomSheetData } = useBottomSheetData();
    //const [isVisible, setIsVisible] = useState(true);
    const [ buttonProps, setButtonProps ] = useState({isVisible:true, title:oProps.title, request_url:oProps.data?.request_url});
    const { setLayoutData } = useLayoutData();

    const oIconAliases = {
        'item-comment': 'ChatTeardropDots',
        'item-share': 'ShareFat'
    };

    const bShowActionAsButton = oProps.params?.show_action_as_button == undefined || oProps.params.show_action_as_button === true;
    const bShowVertical = oProps?.params && oProps.params.showVertical != undefined && oProps.params.showVertical === true;
    const bTitleOnly = oProps?.params && oProps.params?.showTitleOnly === true;
    const oIconset = oProps?.params && !!oProps.params?.iconset ? oProps.params.iconset : {};

    let sContent = undefined;

    switch (oProps.content_type) {
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
                variant: oProps.primary.toString() === "1" ? 'primary' : oProps.params?.button_variant,
                size: oProps.params?.button_size,
                rounded: oProps.params?.button_rounded,
                fullWidth: oProps.params?.button_full_width,
                showTitleFromSize: oProps.params?.button_show_title_from_size
            };
            console.log("oButtonProps", oButtonProps, buttonProps.title,oProps.primary)
            const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

            let sButtonIcon = '';
            if (!bTitleOnly) {
                if (!!oIconAliases[oProps.name])
                    sButtonIcon = oIconAliases[oProps.name];
                else if (!!oIconset[oProps.name])
                    sButtonIcon = oIconset[oProps.name];
            }

            sContent = (
                <View className="flex-auto">
                    <Redirect ref={redirectdRef} />
                    <ButtonAction onPress={(event) => handleClick(event, oProps, setBottomSheetData, setLayoutData, redirectdRef, buttonProps, setButtonProps)} title={buttonProps.title} startDecorator={sButtonIcon} {...oButtonProps} />
                </View>
            );
    }

    if (!buttonProps.isVisible)
        return <></>

    return (
        <View className={'menu-item flex-auto ' + (bShowVertical ? ' w-full' : ' flex-row items-center justify-center')}>{sContent}</View>
    );
}
