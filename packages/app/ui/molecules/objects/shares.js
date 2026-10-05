import { Share, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { appSetting } from 'app/lib/util';
import { View } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import DropdownMenuItem from 'app/components/menu-items/dropdown-item';
import { APP_URL } from 'app/config';
import {
    buildButtonProps,
    pickActionButton,
    resolveActionButtonFlags,
    ActionMenuLayout,
} from 'app/ui/molecules/objects/helpers';

const handleDo = async (url, event) => {
    event.preventDefault();

    try {
        const result = await Share.share({
            message: APP_URL + url,
        });

        switch (result.action) {
            case Share.sharedAction:
                break;
            case Share.dismissedAction:
                break;
        }
    } catch (error) {}
};

export default function ElementShares(props) {
    const isWeb = Platform.OS === 'web';
    const { t } = useTranslation();
    const settings = appSetting('social_actions', 'share');
    const params = { ...settings, ...props.params };
    const iconName = settings[props.system]?.icon || 'Share2';
    const action = props.action;

    const showAction = params?.show_action !== false;
    const showCombined = params?.show_combined === true;
    const canWebShare =
        (isWeb && typeof navigator !== 'undefined' && typeof navigator.share === 'function') ||
        !isWeb;

    const buttonProps = buildButtonProps(props);
    const { showAsButton, showLabel } = resolveActionButtonFlags(params);
    const ActionButton = pickActionButton(showCombined, showAsButton);

    const title = action?.title || t('Share');
    const handlePress = useCallback(
        (event) => handleDo(action.url, event),
        [action.url]
    );

    const neoButtonStyle = props.params?.button_style
        ? props?.primary
            ? props.params?.button_primary_style || props.params.button_style
            : props.params.button_style
        : null;

    if (props.mode === 'dropdown-menu') {
        return (
            <DropdownMenuItem
                item={{ title, icon: iconName }}
                icon={iconName}
                handleSelect={(event) => handleDo(action.url, event)}
            />
        );
    }

    if (!canWebShare || !showAction) return null;

    const actionButton = neoButtonStyle ? (
        <NeoButton
            key="action"
            label={showLabel ? title : ''}
            image={iconName}
            style={neoButtonStyle}
            controlSize={props.params?.button_size}
            borderShape={props.params?.button_border_shape}
            width={props.params?.button_full_width ? 'fill' : 'auto'}
            onPress={handlePress}
        />
    ) : (
        <ActionButton
            key="action"
            startDecorator={iconName}
            title={showLabel ? title : false}
            onPress={handlePress}
            {...buttonProps}
        />
    );

    if (neoButtonStyle) {
        return <View className="flex-auto">{actionButton}</View>;
    }

    return (
        <View className="flex-auto">
            <ActionMenuLayout
                combined={showCombined}
                buttonProps={buttonProps}
                combinedGroup={[actionButton]}
                actionSlots={[{ element: actionButton }]}
                showAction={true}
                showCounter={false}
                showBoth={false}
            />
        </View>
    );
}
