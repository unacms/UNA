import { Share, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { appSetting } from 'app/lib/util';
import { View } from 'app/design/view';
import {
    ButtonMenuActionDefault,
    ButtonMenuActionText,
    ButtonMenuGroupItem,
    ButtonsGroupMenu,
    NeoButton,
} from 'app/design/controls';
import { useCallback } from 'react';
import DropdownMenuItem from 'app/components/menu-items/dropdown-item';

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
    const isWeb = Platform.OS === 'web';
    const { t } = useTranslation();
    const oSettings = appSetting('social_actions', 'share');

    const oParams = { ...oSettings, ...oProps.params };
    const sIcon = oSettings[oProps['system']]?.icon || 'Share2';
    const oAction = oProps.action;

    const bShowAction = oParams?.show_action !== false;

    const canWebShare = isWeb && typeof navigator !== 'undefined' && typeof navigator.share === 'function' || !isWeb;

    const oButtonProps = {
        variant: oProps.primary ? 'primary' : oProps.params?.button_variant,
        size: oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        showTitleFromSize: oProps.params?.button_show_title_from_size,
    };

    const bShowCombined = oParams?.show_combined === true;
    const bShowActionAsButton = oParams?.show_action_as_button !== false;
    const bShowActionLabel = oParams?.show_action_label !== false;

    const sTitle = oAction?.title || t('Share');
    const ButtonAction = !bShowCombined
        ? (bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText)
        : ButtonMenuGroupItem;

    const handlePress = useCallback((event) => handleDo(oAction.url, event), [oAction.url]);

    const renderActionButton = () => {
        if (oProps.params?.button_style) {
            const neoButtonStyle = oProps?.primary
                ? (oProps.params?.button_primary_style || oProps.params?.button_style)
                : oProps.params?.button_style;

            return (
                <NeoButton
                    key="action"
                    label={bShowActionLabel ? sTitle : ''}
                    image={sIcon}
                    style={neoButtonStyle}
                    controlSize={oProps.params?.button_size}
                    borderShape={oProps.params?.button_border_shape}
                    width={oProps.params?.button_full_width ? 'fill' : 'auto'}
                    onPress={handlePress}
                />
            );
        }

        return (
            <ButtonAction
                key="action"
                startDecorator={sIcon}
                title={bShowActionLabel ? sTitle : false}
                onPress={handlePress}
                {...oButtonProps}
            />
        );
    };

    const renderContent = () => {
        if (!bShowAction) return null;

        const actionButton = renderActionButton();

        if (bShowCombined && !oProps.params?.button_style) {
            return (
                <ButtonsGroupMenu {...oButtonProps}>
                    {[actionButton]}
                </ButtonsGroupMenu>
            );
        }

        return actionButton;
    };

    if (oProps.mode == 'dropdown-menu') {
        return (
            <DropdownMenuItem
                item={{
                    title: sTitle,
                    icon: sIcon,
                }}
                icon={sIcon}
                handleSelect={(event) => { handleDo(oAction.url, event); }}
            />
        );
    }

    return canWebShare ? <View className="flex-auto">{renderContent()}</View> : null;
}
