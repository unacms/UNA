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
import  { useLayoutData } from 'app/context/layout';

export default function MenuItemButton(oProps) {
    const redirectdRef = useRef();
    const { setBottomSheetData } = useBottomSheetData();
    const [isVisible, setIsVisible] = useState(true);
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

    const setMembership = async (val) => {


        oProps.data.value = val;
        let request_url = '/api.php?r=system/set_membership/TemplServiceProfiles&params[]=' + oProps.data.profile_id + '&params[]=' + val;
        await fetcher(request_url);
        setBottomSheetData(false);
    }

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
            let oButtonProps = {};
            if (oProps.primary)
                oButtonProps.variant = 'primary';
            if (oProps.params?.button_variant != undefined)
                oButtonProps.variant = oProps.params.button_variant;
            if (oProps.params?.button_size != undefined)
                oButtonProps.size = oProps.params.button_size;
            if (oProps.params?.button_rounded != undefined)
                oButtonProps.rounded = oProps.params.button_rounded;
            if (oProps.params?.button_full_width != undefined)
                oButtonProps.fullWidth = oProps.params.button_full_width;
            if (oProps.params?.button_hide_title_on_small != undefined)
                oButtonProps.hideTitleOnSmall = oProps.params.button_hide_title_on_small;

            const handleClick = async (event) => {
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

                let request_url = '/api.php?r=' + oProps.data.request_url;
                const sResponse = await fetcher(request_url);
                if (oProps.data.on_callback == 'hide')
                    setIsVisible(false)
                if (oProps.data.on_callback == 'redirect')
                    redirectdRef.current.redirect(sResponse.data);
                if (oProps.data.on_callback == 'alert'){
                    if (oProps.data.on_callback_clear_cache)
                        storageClear();
                    setLayoutData(getAlert(oProps.data.on_callback_param, {time:Date.now()} ));
                }
            };

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
                    <ButtonAction onPress={handleClick} title={oProps.title} startDecorator={sButtonIcon} {...oButtonProps} />
                </View>
            );
    }

    if (!isVisible)
        return <></>

    return (
        <View className={'menu-item flex-auto ' + (bShowVertical ? ' w-full' : ' flex-row items-center justify-center')}>{sContent}</View>
    );
}
