import { Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { appSetting } from 'app/lib/util';
import { View } from 'app/design/view'
import { ButtonMenuActionDefault, ButtonMenuActionText, ButtonsGroupMenu } from 'app/design/controls';
import { useCallback, useMemo } from 'react';
import DropdownMenuItem from 'app/components/menu-items/dropdown-item'
import { Platform } from 'react-native'

const handleDo = async (url, event) => {
    event.preventDefault();

    try {
        const result = await Share.share({
            message: url,
        });

        switch (result.action) {
            case Share.sharedAction:
                if (result.activityType) {
                    // shared with activity type
                } else {
                    // shared
                }
                break;

            case Share.dismissedAction:
                // dismissed
                break;
        }
    } catch (error) {
    }
};

export default function ElementShares(oProps) {
    const isWeb = Platform.OS === 'web'
    const { t } = useTranslation();
    const oSettings = appSetting('social_actions', 'share');

    const oParams = { ...oSettings, ...oProps.params };
    const sIcon = oSettings[oProps['system']]?.icon || "Share2";
    const oAction = oProps.action;

    const bShowAction = oParams?.show_action !== false;

    const canWebShare = isWeb && typeof navigator !== "undefined" && typeof navigator.share === "function" || !isWeb;

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
    if (oProps.params?.button_show_title_from_size != undefined)
        oButtonProps.showTitleFromSize = oProps.params.button_show_title_from_size;

    //--- show action
    const bShowActionAsButton = oParams?.show_action_as_button !== false;
    const bShowActionLabel = oParams?.show_action_label !== false;

    let sTitle = oAction?.title || t('Share');
    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

    const handlePress = useCallback((event) => handleDo(oAction.url, event), [oAction.url]);
    const button = <ButtonAction key="action" startDecorator={sIcon} title={bShowActionLabel ? sTitle : false} onPress={handlePress} {...oButtonProps} />;
    let aButtonsGroup = [];
    if (!!bShowAction)
        aButtonsGroup.push(button);

    if (oProps.mode == 'dropdown-menu') {
        return <DropdownMenuItem
            item={{
                title: sTitle,
                icon: sIcon
            }}
            icon={sIcon}
            handleSelect={(event) => { handleDo(oAction.url, event) }}
        />;
    }
    return (
        canWebShare ? <View className='flex-auto'>
            {aButtonsGroup}
        </View> : null
    );

}
