import { Share, Platform } from 'react-native';
import { fetcher } from 'app/lib/fetcher';
import { Pressable } from 'app/design/view';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { setClipboard, appSetting } from 'app/lib/util';
import Msg from 'app/ui/molecules/dialogs/msg';
import { useState } from 'react';
import MenuItemActionBase from 'app/lib/menu-item-helpers';
import { useTranslation } from 'react-i18next';

export default function MenuItemSubmenuShare(oProps) {
    const { t } = useTranslation();
    const [showMsg, setShowMsg] = useState(false);
    const isWeb = Platform.OS === 'web';
    const oIconAliases = appSetting('menu_items', 'iconset');

    const handleMenuManageSelect = async (oItem) => {
        switch (oItem.name) {
            case 'item-repost':
                const sResponse = await fetcher('/api.php?r=bx_timeline/repost/&params=' + JSON.stringify(Object.values(oItem.data)));
                if (sResponse?.data) {
                    const sMsg = sResponse.data?.message ? sResponse.data?.message : t('Post shared successfully.');
                    setShowMsg(sMsg);
                }
                break;

            case 'item-copy':
                setClipboard(oItem.link);
                break;

            case 'item-share':
                try {
                    const result = await Share.share({
                        url: oItem.link,
                    });

                    switch (result.action) {
                        case Share.sharedAction:
                        case Share.dismissedAction:
                            break;
                    }
                } catch (error) {
                }
                break;
        }
    };

    const canWebShare = (isWeb && typeof navigator !== 'undefined' && typeof navigator.share === 'function') || !isWeb;

    const aSubmenuExcept = [];
    const aSubmenuItems = oProps.submenu.items.filter((item) => (item.name === 'item-share' ? canWebShare : true)).map((oItem) => {
        if (!(oItem.id || oItem.name) || aSubmenuExcept.includes(oItem.name))
            return;

        return {
            id: !!oItem.id ? oItem.id : oItem.name,
            link: oItem.link,
            name: oItem.name,
            title: oItem.title,
            data: oItem.data,
            icon: oIconAliases[oItem.name],
        };
    });

    if (aSubmenuItems.length === 1) {
        return <></>;
    }

    return (
        <>
            <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false); }} />
            <Pressable className={'flex-auto' + (oProps.params?.no_gap_between_buttons === true ? (oProps.params?.button_full_width ? '  px-0 ' : '  pr-2 ') : '')} onPress={(event) => { event.preventDefault(); }}>
                <DropdownMenu items={aSubmenuItems} onSelect={handleMenuManageSelect}>
                    <MenuItemActionBase
                        item={oProps}
                        title={oProps?.title ? oProps.title : ''}
                        icon={oIconAliases[oProps.name] ? oIconAliases[oProps.name] : ''}
                        bare
                    />
                </DropdownMenu>
            </Pressable>
        </>
    );
}
