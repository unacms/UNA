import { useRef, useState } from 'react';
import { Modal } from 'app/design/controls';
import { ScrollView } from 'app/design/view';
import { fetcher } from 'app/lib/fetcher';
import Submenu from './submenu';
import SubmenuShare from './submenu-share';
import Redirect from 'app/ui/atoms/redirect';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Platform } from 'react-native';
import RbList from 'app/ui/molecules/form-controls/radio-list';
import ChkList from 'app/ui/molecules/form-controls/checkbox-list';
import { storageClear } from 'app/lib/util';
import Badge from 'app/ui/molecules/profile/badge';
import Msg from 'app/ui/molecules/dialogs/msg';
import Stripe from 'app/ui/molecules/integrations/stripe';
import emitter, { EVENTS } from 'app/context/emitter';
import MenuItemActionBase, {
    getMenuItemFlags,
    resolveMenuItemIcon,
    MenuItemSubmenuSwitch,
} from 'app/lib/menu-item-helpers';

const ICON_ALIASES = {
    'item-comment': 'MessageCircleMore',
    'item-share': 'Share2',
};

const SUBMENU_MAP = {
    'bx_timeline_menu_item_share': SubmenuShare,
};

const handleClick = async (event, oProps, setBottomSheetData, redirectdRef, buttonProps, setButtonProps, setShowMsg, setShowModal) => {

    const setMembership = async (val) => {
        oProps.data.value = val;
        const request_url = '/api.php?r=system/set_membership/TemplServiceProfiles&params[]=' + oProps.data.profile_id + '&params[]=' + val;
        await fetcher(request_url);
        setBottomSheetData(false);
    };

    const setBadges = async (val) => {
        oProps.data.value = val;
        const request_url = '/api.php?r=system/set_badges/TemplServices&params[]=' + oProps.data.content_id + '&params[]=' + val + '&params[]=' + oProps.data.module;
        await fetcher(request_url);
        setBottomSheetData(false);
    };

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

        const badges = oProps.data.values.map((badge) => ({
            ...badge,
            icon: null,
            label: <Badge data={{ ...badge, text: badge.label }} />,
        }));
        setBottomSheetData({ title: 'Choose badges', showClose: true, snapPoints: ['70%', '70%'], content: <ChkList values={badges} setValue={setBadges} selectedValue={oProps.data.value} /> });
        return;
    }

    let request_url = '/api.php?r=' + buttonProps.request_url;
    const sResponse = await fetcher(request_url);
    if (oProps.data.on_callback == 'hide') {
        setButtonProps({ ...buttonProps, visible: false });
        // Wiki delete-block: refresh the page shell so the block disappears.
        if (String(buttonProps.request_url || '').includes('wiki_action')) {
            emitter.emit(EVENTS.wiki, { action: 'reload' });
        }
    }

    if (oProps.data.on_callback == 'change')
        setButtonProps({ ...buttonProps, title: sResponse.data?.title, request_url: sResponse.data?.request_url });

    if (oProps.data.on_callback == 'redirect') {
        if (sResponse.data?.[0]?.type == 'msg') {
            setShowMsg(sResponse.data?.[0]?.data);
        }
        else {
            redirectdRef.current.redirect(sResponse.data?.url ? sResponse.data?.url : sResponse.data);
        }
    }

    if (oProps.data.on_callback == 'alert') {
        if (oProps.data.on_callback_clear_cache)
            storageClear();
        emitter.emit(EVENTS.connections, { action: 'changed', reload: true });
    }
    if (oProps.data.on_callback == 'alert,hide') {
        setButtonProps({ ...buttonProps, visible: false });
        if (oProps.data.on_callback_clear_cache)
            storageClear();
        emitter.emit(EVENTS.connections, { action: 'changed', reload: true });
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

export default function MenuItemCallback(oProps) {
    const redirectdRef = useRef();
    const { setBottomSheetData } = useBottomSheetData();
    const [buttonProps, setButtonProps] = useState({ isVisible: true, title: oProps.title, request_url: oProps.data?.request_url });
    const [showMsg, setShowMsg] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const { showVertical } = getMenuItemFlags(oProps);

    if (!buttonProps.isVisible)
        return <></>;

    const msgBox = <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false); }} />;
    const stripeModal = showModal ? (
        <Modal onVisible={!!showModal} onClose={() => { setShowModal(false); }} transparent={false}>
            <ScrollView className="h-[400px]">
                <Stripe payment_type={showModal.payment_type} seller_id={showModal.seller_id} items={showModal.items} />
            </ScrollView>
        </Modal>
    ) : null;
    if (oProps.content_type === 'submenu') {
        return (
            <MenuItemSubmenuSwitch
                item={oProps}
                map={SUBMENU_MAP}
                Fallback={Submenu}
                extra={<>{msgBox}{stripeModal}</>}
                wrapperClassName={'menu-item flex-auto ' + (showVertical ? ' w-full' : ' flex-row items-center justify-center')}
            />
        );
    }

    const sButtonIcon = resolveMenuItemIcon(oProps, { aliases: ICON_ALIASES, preferAliases: true });

    const onPress = (event) => handleClick(event, oProps, setBottomSheetData, redirectdRef, buttonProps, setButtonProps, setShowMsg, setShowModal);

    return (
        <MenuItemActionBase
            item={oProps}
            title={buttonProps.title}
            icon={sButtonIcon}
            onPress={onPress}
            extra={
                <>
                    <Redirect ref={redirectdRef} />
                    {msgBox}
                    {stripeModal}
                </>
            }
            innerClassName="flex-auto"
        />
    );
}
