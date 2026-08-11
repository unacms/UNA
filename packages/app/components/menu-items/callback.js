import { useRef, useState } from 'react';
import { ButtonMenuActionDefault, ButtonMenuActionText, NeoButton, Modal } from 'app/design/controls';
import { View, ScrollView } from 'app/design/view';
import { fetcher } from 'app/lib/fetcher';
import Submenu from './submenu'
import SubmenuShare from './submenu-share'
import Redirect from 'app/ui/atoms/redirect';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Platform } from 'react-native';
import RbList from 'app/ui/molecules/form-controls/radio_list';
import ChkList from 'app/ui/molecules/form-controls/checkbox_list';
import { storageClear, getAlert } from 'app/lib/util';
import { useLayoutData } from 'app/context/layout';
import { getComponent } from 'app/components/registry'
import Badge from 'app/ui/molecules/profile/badge'
import Msg from 'app/ui/molecules/dialogs/msg'
import Stripe from 'app/ui/molecules/integrations/stripe';
import emitter from 'app/context/emitter'

const handleClick = async (event, oProps, setBottomSheetData, setLayoutData, redirectdRef, buttonProps, setButtonProps, setShowMsg, setShowModal) => {

    const setMembership = async (val) => {
        oProps.data.value = val;
        const request_url = '/api.php?r=system/set_membership/TemplServiceProfiles&params[]=' + oProps.data.profile_id + '&params[]=' + val;
        await fetcher(request_url);
        setBottomSheetData(false);
    }

    const setBadges = async (val) => {
        oProps.data.value = val;
        const request_url = '/api.php?r=system/set_badges/TemplServices&params[]=' + oProps.data.content_id + '&params[]=' + val+ '&params[]=' + oProps.data.module;
        await fetcher(request_url);
        setBottomSheetData(false);
    }

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

    if (oProps.content_type == 'badges') {
        if (Platform.OS == 'web') {
            const popperDiv = document.querySelector('div[data-radix-popper-content-wrapper]');
            if (popperDiv) {
                popperDiv.classList.add('radix-hide');
            }
        }

        const badges = oProps.data.values.map((badge, index) => ({
            ...badge,
            icon:null,
            label: <Badge data={{...badge, text: badge.label}} />
            }
        ));
        Badge
        setBottomSheetData({ title: 'Choose badges', showClose: true, snapPoints: ['70%', '70%'], content: <ChkList values={badges} setValue={setBadges} selectedValue={oProps.data.value} /> });
        return;
    }

    let request_url = '/api.php?r=' + buttonProps.request_url;
    const sResponse = await fetcher(request_url);
    if (oProps.data.on_callback == 'hide') {
        setButtonProps({...buttonProps, visible:false})
        // Wiki delete-block: refresh the page shell so the block disappears.
        if (String(buttonProps.request_url || '').includes('wiki_action')) {
            emitter.emit('wiki', { action: 'reload' })
        }
    }

    if (oProps.data.on_callback == 'change')
        setButtonProps({...buttonProps, title:sResponse.data?.title, request_url:sResponse.data?.request_url})

    if (oProps.data.on_callback == 'redirect'){
        if (sResponse.data?.[0]?.type == 'msg') {
            setShowMsg(sResponse.data?.[0]?.data);
        }
        else{
            redirectdRef.current.redirect(sResponse.data?.url ? sResponse.data?.url : sResponse.data);
        }
    }
    
    if (oProps.data.on_callback == 'alert') {
        if (oProps.data.on_callback_clear_cache)
            storageClear();
        setLayoutData(getAlert(oProps.data.on_callback_param, { time: Date.now(), reload: true }));
    }
    if (oProps.data.on_callback == 'alert,hide') {
        setButtonProps({...buttonProps, visible:false})
        if (oProps.data.on_callback_clear_cache)
            storageClear();
        setLayoutData(getAlert(oProps.data.on_callback_param, { time: Date.now(), reload: true }));
    }
    if (oProps.data.on_callback == 'object') {
        const paymentData = {
            ...oProps.data,
            ...(sResponse?.data && typeof sResponse.data === 'object' && !Array.isArray(sResponse.data) ? sResponse.data : {}),
        };
        if (paymentData.object_name == 'stripe_v3') {
            setShowModal(paymentData);
        }
    }
};

export default function MenuItemButton(oProps) {
    const DropdownMenuItem = getComponent('menu-item', 'dropdown');
    
    const redirectdRef = useRef();
    const { setBottomSheetData } = useBottomSheetData();
    //const [isVisible, setIsVisible] = useState(true);
    const [ buttonProps, setButtonProps ] = useState({isVisible:true, title:oProps.title, request_url:oProps.data?.request_url});
    const [showMsg, setShowMsg] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const { setLayoutData } = useLayoutData();

    const oIconAliases = {
        'item-comment': 'MessageCircleMore',
        'item-share': 'Share2',
      
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
                variant: oProps.primary?.toString() === "1" ? 'primary' : oProps.params?.button_variant,
                size: oProps.params?.button_size,
                rounded: oProps.params?.button_rounded,
                fullWidth: oProps.params?.button_full_width,
                showTitleFromSize: oProps.params?.button_show_title_from_size,
                ring: oProps.params?.button_ring
            };

            const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

            let sButtonIcon = '';
            if (!bTitleOnly) {
                if (!!oIconAliases[oProps.name])
                    sButtonIcon = oIconAliases[oProps.name];
                else if (!!oIconset[oProps.name])
                    sButtonIcon = oIconset[oProps.name];
            }
            if (!sButtonIcon)
                sButtonIcon = oProps.icon

            if (oProps.mode == 'dropdown-menu') {
                sContent = <><Redirect ref={redirectdRef} /><DropdownMenuItem 
                    item={{title: buttonProps.title, icon: sButtonIcon}} 
                    handleSelect = {(event) => handleClick(event, oProps, setBottomSheetData, setLayoutData, redirectdRef, buttonProps, setButtonProps, setShowMsg, setShowModal)}
                /></>
            }
            else{
                const isPrimary = oProps.primary === true || oProps.primary === 1 || oProps.primary === "1";
                const neoButtonStyle = isPrimary
                    ? (oProps.params?.button_primary_style || oProps.params?.button_style)
                    : oProps.params?.button_style;
                const buttonAction = oProps.params?.button_style ? (
                    <NeoButton
                        label={buttonProps.title}
                        image={sButtonIcon}
                        style={neoButtonStyle}
                        controlSize={oProps.params?.button_size}
                        borderShape={oProps.params?.button_border_shape}
                        width={oProps.params?.button_full_width ? 'fill' : 'auto'}
                        contentInsets={oProps.params?.button_content_insets}
                        onPress={(event) => handleClick(event, oProps, setBottomSheetData, setLayoutData, redirectdRef, buttonProps, setButtonProps, setShowMsg, setShowModal)}
                    />
                ) : (
                    <ButtonAction onPress={(event) => handleClick(event, oProps, setBottomSheetData, setLayoutData, redirectdRef, buttonProps, setButtonProps, setShowMsg, setShowModal)} title={buttonProps.title} startDecorator={sButtonIcon} {...oButtonProps} />
                );

                sContent = (
                    <View className="flex-auto">
                        <Redirect ref={redirectdRef} />
                        {buttonAction}
                    </View>
                );
            }
    }

    if (!buttonProps.isVisible)
        return <></>

    const msgBox = <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />;
    const stripeModal = showModal ? (
        <Modal onVisible={!!showModal} onClose={() => { setShowModal(false) }} transparent={false}>
            <ScrollView className="h-[400px]">
                <Stripe payment_type={showModal.payment_type} seller_id={showModal.seller_id} items={showModal.items} />
            </ScrollView>
        </Modal>
    ) : null;

    if (oProps.mode == 'dropdown-menu') {
        return <>{msgBox}{stripeModal}{sContent}</>;
    }
    return (
        <View className={'menu-item flex-auto ' + (bShowVertical ? ' w-full' : ' flex-row items-center justify-center')}>{msgBox}{stripeModal}{sContent}</View>
    );
}
