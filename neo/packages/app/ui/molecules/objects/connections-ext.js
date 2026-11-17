import { useState, useMemo } from 'react';
import { appSetting } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { View } from 'app/design/view'
import { ButtonMenuActionDefault, ButtonMenuActionText, NeoButton, Modal } from 'app/design/controls';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { useTranslation } from 'react-i18next';
import { components } from 'app/components/registry'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { useBottomSheetData } from 'app/context/bottomsheet'
import { Platform } from 'react-native';
import { connectionButtonIcon, connectionIconSet, withConnectionRowIcons } from 'app/lib/connection-icons';


const getKey = (sO, iIid, iCid) => {
    return sO + '_' + iIid + '_' + iCid;
}

export default function ElementConnections({
    iid: item_id,
    cid: content_id,
    o: object,
    params: initial_params,
    primary = false,
    mode,
    name,
    actions,
    title = '',
    /** A card's toggle, with its short wording ("Join", "Joined"): the answer to an action keeps it. */
    short = false,
}) {

    const DropdownMenuItem = components['menu-item']['dropdown'];
    const [elementData, setElementData] = useState({ name, actions, title });
    const [modalContent, setModalContent] = useState(false);
    const { t } = useTranslation();
    const { setBottomSheetData } = useBottomSheetData();
    const settings = appSetting('social_actions', 'connection_ext');
    const params = { ...settings, initial_params };

    const keyName = useMemo(() => getKey(object, item_id, content_id), [object, item_id, content_id]);

    const icons = connectionIconSet(settings, object, {
        add: 'UserPlus',
        remove: 'UserX',
        hz: 'UserPlus'
    });

    const bShowActionAsButton = params?.show_action_as_button !== false;

    const buttonProps = {
        variant: primary ? 'primary' : initial_params?.button_variant,
        size: initial_params?.button_size,
        rounded: initial_params?.button_rounded,
        fullWidth: initial_params?.button_full_width,
        showTitleFromSize: initial_params?.button_show_title_from_size,
        hide_icon: initial_params?.hide_icon,
        padding: initial_params?.padding,
        ring: initial_params?.button_ring
    };

    // The button shows its state's icon, each row of its menu its action's.
    const hasMenu = elementData.actions?.length > 0;
    const stateIcon = connectionButtonIcon(icons, elementData.name, hasMenu);
    const menuItems = withConnectionRowIcons(elementData.actions, icons);

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;
    if (!!stateIcon && buttonProps.hide_icon !== true)
        buttonProps.startDecorator = stateIcon;

    const renderActionButton = (extraProps = {}) => {
        const actionIcon = buttonProps.hide_icon === true ? '' : stateIcon;

        if (initial_params?.button_style) {
            const neoButtonStyle = primary
                ? (initial_params?.button_primary_style || initial_params.button_style)
                : initial_params.button_style;

            return (
                <NeoButton
                    label={elementData.title}
                    image={actionIcon}
                    style={neoButtonStyle}
                    controlSize={initial_params?.button_size}
                    borderShape={initial_params?.button_border_shape}
                    width={initial_params?.button_full_width ? 'fill' : 'auto'}
                    {...extraProps}
                />
            );
        }

        return <ButtonAction title={elementData.title} {...buttonProps} {...extraProps} />;
    };

    const _handleRequset = async (action, event) => {
        // On a card the button sits inside the card's link: the press is the action, not a visit to the profile.
        event?.preventDefault?.();
        if (Platform.OS !== 'web') {
            setBottomSheetData(false);
        }
        const paramsDefault = { o: object, iid: item_id, cid: content_id, a: action, r: 'object', ...(short ? { short: 1 } : {}) };
        const response = await fetcher('/api.php?r=system/perform/TemplServiceConnections&params[]=' + JSON.stringify(paramsDefault));
        setElementData({ name: response.data.name, actions: response.data.actions, title: response.data.title })
    }

    // On a card the menu sits inside the card's link: a click that reaches its wrapper is not a visit to the profile.
    const linkGuardProps = Platform.OS === 'web' ? { onClick: (event) => event.preventDefault() } : null;

    const _handleCloseModal = () => {
        setModalContent(false);
    }
    if (mode == 'dropdown-menu') {
        return elementData.actions.length > 0 ?
            <DropdownMenu
                mode="popup"
                items={menuItems}
                defaultOpen={false}
                onSelect={(item) => { _handleRequset(item.name) }}

            >
                <DropdownMenuItem
                    item={{
                        title: elementData.title,
                        icon: stateIcon
                    }}
                    icon={stateIcon}
                    handleSelect={(event) => { _handleRequset(elementData.name, event) }}
                />
            </DropdownMenu>
            :
            <DropdownMenuItem
                item={{
                    title: elementData.title,
                    icon: stateIcon
                }}
                icon={stateIcon}
                handleSelect={(event) => { _handleRequset(elementData.name, event) }}
            />;
    }
    else {
        return (
            <>
                {elementData.actions.length > 0 ? (
                    // On a card the button sits inside the card's link: a click on the trigger or on a row of its
                    // menu (they bubble here through React's tree) is not a visit to the profile.
                    <View {...linkGuardProps}>
                        <DropdownMenu
                            mode="popup"
                            items={menuItems}
                            defaultOpen={false}
                            onSelect={(item) => { _handleRequset(item.name) }}
                            // The trigger keeps its name where the button shows its icon alone (a card row on phones).
                            triggerAccessibilityLabel={elementData.title}
                        >
                            {renderActionButton()}
                        </DropdownMenu>
                    </View>
                ) : (
                    renderActionButton({ onPress: (event) => _handleRequset(elementData.name, event) })
                )}
                {modalContent && <Modal title={t("Questionnaire")} onVisible={modalContent} onClose={_handleCloseModal}>
                    <View className='px-4'>
                        <BlockByData onFormEmpty={_handleFormSubmittedAndValid} block={modalContent} />
                    </View>
                </Modal>}
            </>
        );
    }
}