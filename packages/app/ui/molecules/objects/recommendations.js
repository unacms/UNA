/**
 * Recommendations — suggest add/ignore connection via TemplServiceRecommendations.
 *
 * Props:
 *   o, iid, cid, type  — recommendation target ids
 *   a, title           — current action key + label
 *   params             — overrides (+ on_done, only_icon, button_style, …)
 *   primary            — button variant=primary
 */

import { useState } from 'react';
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
import { NeoButton } from 'app/design/controls';

function recommendationKey(o, iid, cid) {
    return o + '_' + iid + '_' + cid;
}

async function recommendationRequest(
    setLayoutData,
    o,
    iid,
    cid,
    key,
    action,
    params,
    onLoad
) {
    const body = { o, iid, cid, ...(params || {}) };
    const url =
        '/api.php?r=system/' +
        action +
        '/TemplServiceRecommendations&params[]=' +
        JSON.stringify(body);

    const response = await fetcher(url);
    if (typeof onLoad === 'function') onLoad(response?.data);

    storageClear();
    setLayoutData(
        getAlert('connections:action', {
            object: o,
            time: Date.now(),
            action: body,
            data: response?.data,
            key,
        })
    );
}

export default function ElementRecommendations(props) {
    const { t } = useTranslation();
    const { setLayoutData } = useLayoutData();

    const params = {
        ...appSetting('social_actions', 'recommendation'),
        ...props.params,
    };

    const key = recommendationKey(props.o, props.iid, props.cid);

    const { showAsButton } = resolveActionButtonFlags(params);
    const buttonProps = {
        ...buildButtonProps(props),
        onlyIcon: props.params?.only_icon,
    };

    const [elementData, setElementData] = useState(false);

    const request = (action, actionParams, onLoad) =>
        recommendationRequest(
            setLayoutData,
            props.o,
            props.iid,
            props.cid,
            key,
            action,
            actionParams,
            onLoad
        );

    const doRecommendation = (actionName, event) => {
        event.preventDefault();

        request('perform', { a: actionName }, (data) => {
            let next = data;

            if (!data.a) {
                if (!params?.on_done || params.on_done != 'hide') {
                    let sentTitle = '';
                    switch (props.o) {
                        case 'sys_friends':
                            sentTitle = t('Request Sent');
                            break;
                        case 'sys_subscriptions':
                            sentTitle = t('Following');
                            break;
                    }
                    next = {
                        ...data,
                        a: 'sent',
                        title: sentTitle,
                        disabled: true,
                    };
                }
                // Original hide branch called setCardData path that never wrote — no-op kept
            }

            setElementData((prev) => mergeState(prev, next));
        });
    };

    let actionName = props?.a || '';
    if (elementData?.a != undefined) actionName = elementData.a;
    if (!actionName) return;

    let title = props?.title || '';
    if (elementData?.title != undefined) title = elementData.title;

    let disabled = false;
    if (elementData?.disabled != undefined) disabled = elementData.disabled;

    const ActionButton = pickActionButton(false, showAsButton);

    let icon;
    switch (actionName) {
        case 'ignore':
            if (buttonProps.onlyIcon) {
                title = '';
                icon = 'X';
            }
            break;
        case 'add':
            if (buttonProps.onlyIcon) {
                title = '';
                if (props.o == 'sys_friends') icon = 'UserPlus';
                if (props.o == 'sys_subscriptions') icon = 'UserCheck';
            }
            break;
    }

    if (props.params?.button_style) {
        return (
            <NeoButton
                label={title}
                image={icon}
                style={props.params.button_style}
                controlSize={props.params?.button_size}
                borderShape={props.params?.button_border_shape}
                width={props.params?.button_full_width ? 'fill' : 'auto'}
                onPress={(event) => doRecommendation(actionName, event)}
                disabled={disabled}
            />
        );
    }

    return (
        <ActionButton
            title={title}
            startDecorator={icon}
            onPress={(event) => doRecommendation(actionName, event)}
            disabled={disabled}
            {...buttonProps}
        />
    );
}
