import { Share, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { appSetting, setClipboard, openExternalLink } from 'app/lib/util';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
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

    // No share sheet (a computer's browser): copy the link instead.
    if (Platform.OS === 'web' && (typeof navigator === 'undefined' || typeof navigator.share !== 'function')) {
        setClipboard(APP_URL + url);
        return;
    }

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

/**
 * The rows of the Share menu where the browser has no share sheet (a computer): Copy link, then the services of
 * `social_actions.share.services`, as UNA's Share popup lists them.
 */
export function shareMenuItems(url, services, copyTitle) {
    const encoded = encodeURIComponent(url);
    return [
        { id: 'copy', name: 'copy', title: copyTitle, icon: 'Link' },
        ...(services || []).map((service) => ({
            id: service.name,
            name: service.name,
            title: service.title,
            icon: service.icon,
            link: service.link.replace('{url}', encoded),
        })),
    ];
}

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

    // In a menu, where the browser has no share sheet, the row copies the link and says so.
    if (props.mode === 'dropdown-menu' && !canWebShare) {
        return (
            <DropdownMenuItem
                item={{ title: t('Copy link'), icon: 'Link' }}
                icon="Link"
                handleSelect={(event) => handleDo(action.url, event)}
            />
        );
    }

    if (props.mode === 'dropdown-menu') {
        return (
            <DropdownMenuItem
                item={{ title, icon: iconName }}
                icon={iconName}
                handleSelect={(event) => handleDo(action.url, event)}
            />
        );
    }

    if (!showAction) return null;

    // A computer's browser has no share sheet: a menu with Copy link and the services instead.
    if (!canWebShare) {
        const url = APP_URL + action.url;
        return (
            <View className="flex-auto">
                <DropdownMenu
                    items={shareMenuItems(url, settings.services, t('Copy link'))}
                    onSelect={(item) => {
                        if (item.name === 'copy')
                            setClipboard(url);
                        else if (item.link)
                            openExternalLink(item.link);
                    }}
                    triggerAccessibilityLabel={title}
                    buttonProps={{
                        label: showLabel ? title : '',
                        image: iconName,
                        style: neoButtonStyle || 'bordered',
                        controlSize: props.params?.button_size || 'small',
                        borderShape: props.params?.button_border_shape,
                        accessibilityLabel: title,
                    }}
                />
            </View>
        );
    }

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
