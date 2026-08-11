/**
 * Reposts — timeline repost action (+ counter slot / dropdown mode).
 *
 * Props (from backend / entity actions):
 *   type, system, object_id  — object id for keys
 *   action                   — title, is_undo, is_performed, is_disabled, data
 *   counter                  — { count } (counter UI still TODO)
 *   params                   — overrides for social_actions.repost (+ button_*)
 *   displayType              — 'action' | 'counter' | 'both' (default both)
 *   mode                     — 'dropdown-menu' | default
 *   primary                  — button variant=primary
 */

import { useState } from 'react';

import { appSetting, FeedbackHaptics } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import {
    objectKey,
    mergeState,
    resolveDisplayFlags,
    buildButtonProps,
    pickActionButton,
    resolveActionButtonFlags,
    ActionMenuLayout,
} from 'app/lib/object-helpers';
import { getComponent } from 'app/components/registry';
import { View } from 'app/design/view';

// ---------------------------------------------------------------------------
// Timeline repost API (not TemplVoteServices)
// ---------------------------------------------------------------------------

async function repostRequest(action, params, onLoad) {
    const url =
        '/api.php?r=bx_timeline/' +
        action +
        '/Module&params=' +
        JSON.stringify(params);
    const response = await fetcher(url);
    if (typeof onLoad === 'function') onLoad(response?.data);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function ElementReposts(props) {
    const DropdownMenuItem = getComponent('menu-item', 'dropdown');

    const settings = appSetting('social_actions', 'repost');
    const params = { ...settings, ...props.params };
    const action = props.action;
    const counter = props?.counter;

    const key = objectKey(props.type, props.system, props.object_id);
    const icon = settings[props.system]?.icon
        ? settings[props.system].icon
        : 'RotateCw';

    const { showAction, showCounter, showBoth, showCombined } =
        resolveDisplayFlags(params, props?.displayType);

    // Original omitted ring
    const buttonProps = buildButtonProps(props);
    delete buttonProps.ring;

    const [objectData, setObjectData] = useState({
        ...action,
        ...{ counter },
    });

    const doRepost = (event) => {
        event.preventDefault();
        FeedbackHaptics(params.haptics_type);
        repostRequest('repost', Object.values(action.data), (data) => {
            setObjectData((prev) => mergeState(prev, data));
        });
    };

    // Original referenced undeclared handleUndo — keep undo path as no-op
    const undoRepost = undefined;

    // --- action button ---

    const { showAsButton, showLabel } = resolveActionButtonFlags(params);
    const canUndo = action?.is_undo === true;
    const isPerformed = objectData?.is_performed === true;
    const isDisabled = objectData?.is_disabled === true;
    const title =
        objectData?.title != undefined ? objectData.title : '';

    const ActionButton = pickActionButton(showCombined, showAsButton);

    let actionButton;
    if (canUndo && isPerformed) {
        actionButton = (
            <ActionButton
                key="action"
                startDecorator={icon}
                title={showLabel ? title : false}
                onPress={undoRepost}
                pressed={true}
                {...buttonProps}
            />
        );
    } else {
        actionButton = (
            <ActionButton
                key="action"
                startDecorator={icon}
                title={showLabel ? title : false}
                onPress={!isDisabled ? doRepost : () => {}}
                disabled={isDisabled}
                {...buttonProps}
            />
        );
    }

    // --- counter (slot reserved; UI still TODO in original) ---

    let counterButton;
    let counterPopup;
    if (showCounter && counter?.count != undefined) {
        // TODO: Counter can be added here.
    }

    // --- layout ---

    if (props.mode == 'dropdown-menu') {
        return (
            <DropdownMenuItem
                item={{
                    title,
                    icon,
                }}
                icon={icon}
                handleSelect={(event) => {
                    doRepost(event);
                }}
            />
        );
    }

    const combinedGroup = [actionButton];
    if (counterButton) combinedGroup.push(counterButton);

    return (
        <ActionMenuLayout
            combined={showCombined}
            buttonProps={buttonProps}
            itemKey={key}
            showAction={showAction}
            showCounter={showCounter}
            showBoth={showBoth}
            params={props.params}
            actionSlots={[{ element: actionButton }]}
            counterButton={counterButton}
            counterPopup={counterPopup}
            combinedGroup={combinedGroup}
        />
    );
}
