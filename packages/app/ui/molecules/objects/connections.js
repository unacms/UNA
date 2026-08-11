/**
 * Connections — add/remove connection (friends, etc.) via TemplServiceConnections.
 *
 * Props:
 *   o, iid, cid     — connection target ids
 *   a, title        — current action key + label
 *   params          — overrides (+ on_do, on_done, button_style, hide_icon, …)
 *   mode            — 'dropdown-menu' | default
 *   primary         — button variant=primary
 */

import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { appSetting, getAlert, storageClear } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import {
    mergeState,
    buildButtonProps,
    pickActionButton,
    resolveActionButtonFlags,
} from 'app/lib/object-helpers';
import { useLayoutData } from 'app/context/layout';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { getComponent } from 'app/components/registry';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { View } from 'app/design/view';
import { Modal, NeoButton } from 'app/design/controls';

function connectionKey(o, iid, cid) {
    return o + '_' + iid + '_' + cid;
}

async function connectionRequest(setLayoutData, o, iid, cid, key, action, params) {
    const body = { o, iid, cid, ...(params || {}) };
    const url =
        '/api.php?r=system/' +
        action +
        '/TemplServiceConnections&params[]=' +
        JSON.stringify(body);

    const response = await fetcher(url);
    // Leave/etc. with redirect: skip soft-reload — navigation owns the transition.
    const hasRedirect = !!response?.data?.redirect;
    const isReload = response?.data?.a != 'questionnaire' && !hasRedirect;
    if (isReload) storageClear();

    setLayoutData(
        getAlert('connections:action', {
            object: o,
            time: Date.now(),
            action: body,
            data: response?.data,
            key,
            reload: isReload,
        })
    );
}

export default function ElementConnections(props) {
    const { t } = useTranslation();
    const DropdownMenuItem = getComponent('menu-item', 'dropdown');
    const { layoutData, setLayoutData } = useLayoutData();
    const { setBottomSheetData } = useBottomSheetData();

    const settings = appSetting('social_actions', 'connection');
    const params = { ...settings, ...props.params };

    const key = connectionKey(props.o, props.iid, props.cid);
    const icons =
        props?.o && settings[props.o]?.icons != undefined
            ? settings[props.o].icons
            : { add: 'UserCheck', remove: 'UserX' };

    const { showAsButton } = resolveActionButtonFlags(params);
    const buttonProps = {
        ...buildButtonProps(props),
        hide_icon: props.params?.hide_icon,
        padding: props.params?.padding,
    };

    const [elementData, setElementData] = useState(false);
    const [modalContent, setModalContent] = useState(false);

    const request = (action, actionParams) =>
        connectionRequest(
            setLayoutData,
            props.o,
            props.iid,
            props.cid,
            key,
            action,
            actionParams
        );

    const doConnection = (actionName, event) => {
        if (event) event.preventDefault();
        if (typeof params?.on_do === 'function') params.on_do(actionName);
        request('perform', { a: actionName });
    };

    const applyResponse = (data) => {
        if (data?.a == 'questionnaire') {
            setModalContent({ content: data.data, designbox_id: 0 });
        } else if (!data?.redirect) {
            // Redirect leaves the page — don't flip title/action before navigation.
            setElementData((prev) => mergeState(prev, data));
        }

        if (typeof params?.on_done === 'function') params.on_done(data);
    };

    const closeModal = () => setModalContent(false);

    const onFormSubmittedAndValid = () => {
        setTimeout(() => {
            closeModal();
            doConnection('add');
        }, 100);
    };

    useEffect(() => {
        if (
            layoutData &&
            layoutData?.type == 'connections:action' &&
            layoutData?.data.key == key
        ) {
            applyResponse(layoutData.data.data);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- same as original: react to alert time
    }, [layoutData?.data?.time]);

    let actionName = props?.a || '';
    if (elementData?.a != undefined) actionName = elementData.a;

    let title = props?.title || '';
    if (elementData?.title != undefined) title = elementData.title;

    const ActionButton = pickActionButton(false, showAsButton);
    if (icons && !!icons[actionName] && buttonProps.hide_icon !== true) {
        buttonProps.startDecorator = icons[actionName];
    }

    const renderActionButton = (extraProps = {}) => {
        const actionIcon =
            buttonProps.hide_icon === true ? '' : icons?.[actionName];

        if (props.params?.button_style) {
            const neoButtonStyle = props.primary
                ? props.params?.button_primary_style || props.params.button_style
                : props.params.button_style;

            return (
                <NeoButton
                    label={title}
                    image={actionIcon}
                    style={neoButtonStyle}
                    controlSize={props.params?.button_size}
                    borderShape={props.params?.button_border_shape}
                    width={props.params?.button_full_width ? 'fill' : 'auto'}
                    {...extraProps}
                />
            );
        }

        return (
            <ActionButton title={title} {...buttonProps} {...extraProps} />
        );
    };

    if (props.mode == 'dropdown-menu') {
        return (
            <DropdownMenuItem
                item={{
                    title,
                    icon: icons[actionName],
                }}
                icon={icons[actionName]}
                handleSelect={(event) => {
                    // Overflow MenuItemEx is a React-node title — skips MenuBottomSheet's
                    // outer handleSelect that would dismiss the sheet.
                    if (Platform.OS !== 'web') {
                        setBottomSheetData(false);
                    }
                    doConnection(actionName, event);
                }}
            />
        );
    }

    return (
        <>
            {renderActionButton({
                onPress: (event) => doConnection(actionName, event),
            })}
            {modalContent ? (
                <Modal
                    title={t('Questionnaire')}
                    onVisible={modalContent}
                    onClose={closeModal}
                >
                    <View className="px-4">
                        <BlockByData
                            onFormEmpty={onFormSubmittedAndValid}
                            block={modalContent}
                        />
                    </View>
                </Modal>
            ) : null}
        </>
    );
}
