import { useState, useMemo, useCallback, useEffect } from 'react';
import { appSetting, getAlert } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { View } from 'app/design/view'
import { ButtonMenuActionDefault, ButtonMenuActionText, NeoButton } from 'app/design/controls';
import { Modal } from 'app/design/controls'
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { useTranslation } from 'react-i18next';
import { useLayoutData } from 'app/context/layout'
import { storageClear } from 'app/lib/util'
import { getComponent } from 'app/components/registry'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { useBottomSheetData } from 'app/context/bottomsheet'
import { Platform } from 'react-native';


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
}) {

    const DropdownMenuItem = getComponent('menu-item', 'dropdown');
    const [elementData, setElementData] = useState({ name, actions, title });
    const [modalContent, setModalContent] = useState(false);
    const { t } = useTranslation();
    const { setBottomSheetData } = useBottomSheetData();
    const settings = appSetting('social_actions', 'connection_ext');
    const params = { ...settings, initial_params };

    const keyName = useMemo(() => getKey(object, item_id, content_id), [object, item_id, content_id]);

    const icons = object && settings[object]?.icons != undefined ? settings[object].icons : {
        add: 'UserPlus',
        remove: 'UserX',
        hz: 'UserPlus'
    };

    const bShowActionAsButton = params?.show_action_as_button == undefined || params.show_action_as_button === true;

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

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;
    if (!!icons[elementData.name] && buttonProps.hide_icon !== true)
        buttonProps.startDecorator = icons[elementData.name];

    const renderActionButton = (extraProps = {}) => {
        const actionIcon = buttonProps.hide_icon === true ? '' : icons[elementData.name];

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
        if (Platform.OS !== 'web') {
            setBottomSheetData(false);
        }
        const paramsDefault = { o: object, iid: item_id, cid: content_id, a: action, r: 'object' };
        const response = await fetcher('/api.php?r=system/perform/TemplServiceConnections&params[]=' + JSON.stringify(paramsDefault));
        setElementData({ name: response.data.name, actions: response.data.actions, title: response.data.title })
    }

    const _handleCloseModal = () => {
        setModalContent(false);
    }
    if (mode == 'dropdown-menu') {
        return elementData.actions.length > 0 ?
            <DropdownMenu
                mode="popup"
                items={elementData.actions}
                defaultOpen={false}
                onSelect={(item) => { _handleRequset(item.name) }}

            >
                <DropdownMenuItem
                    item={{
                        title: elementData.title,
                        icon: icons[elementData.name]
                    }}
                    icon={icons[elementData.name]}
                    handleSelect={(event) => { _handleRequset(elementData.name, event) }}
                />
            </DropdownMenu>
            :
            <DropdownMenuItem
                item={{
                    title: elementData.title,
                    icon: icons[elementData.name]
                }}
                icon={icons[elementData.name]}
                handleSelect={(event) => { _handleRequset(elementData.name, event) }}
            />;
    }
    else {
        return (
            <>
                {elementData.actions.length > 0 ? (
                    <DropdownMenu
                        mode="popup"
                        items={elementData.actions}
                        defaultOpen={false}
                        onSelect={(item) => { _handleRequset(item.name) }}

                    >
                        {renderActionButton()}
                    </DropdownMenu>
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