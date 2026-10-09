/**
 * Likes — action button + counter + "who liked" popup.
 *
 * Props (from backend / entity actions):
 *   type, system, object_id  — object id for API and socket
 *   action                   — button: title, is_voted, is_undo, is_disabled
 *   counter                  — { count }
 *   params                   — overrides for social_actions.like (+ button_*, show_*)
 *   displayType              — 'action' | 'counter' | 'both' (default both)
 *   primary                  — button variant=primary
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { appSetting, FeedbackHaptics } from 'app/lib/util';
import {
    objectKey,
    mergeState,
    objectRequest,
    openPerformedBy,
    ActionMenuLayout,
    resolveDisplayFlags,
    buildButtonProps,
    pickActionButton,
    pickCounterButton,
    resolveActionButtonFlags,
    resolveCounterAsButton,
    votedChannel,
    useVotedSubscription,
    PerformedByModal,
} from 'app/ui/molecules/objects/helpers';
import { useCurrentUser } from 'app/context/user';
import { View } from 'app/design/view';

export default function ElementLikes(props) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();

    const settings = appSetting('social_actions', 'like');
    const params = { ...settings, ...props.params };
    const action = props.action;
    const counter = props.counter;

    const key = objectKey(props.type, props.system, props.object_id);
    const icon = settings[props.system]?.icon
        ? settings[props.system].icon
        : 'ThumbsUp';

    const { showAction, showCounter, showBoth, showCombined } =
        resolveDisplayFlags(params, props?.displayType);
    const buttonProps = buildButtonProps(props);

    const [objectData, setObjectData] = useState({
        ...action,
        ...{ counter },
    });
    const [popupVisible, setPopupVisible] = useState(false);
    const [performedBy, setPerformedBy] = useState();

    const allowViewVoted =
        settings[props.system]?.allow_view_voted != undefined
            ? settings[props.system].allow_view_voted
            : true;

    const object_params = {
        service: 'TemplVoteServices',
        system: props.system,
        objectId: props.object_id,
    };

    // --- do / undo like ---

    const toggleLike = (event, withHaptics) => {
        event.preventDefault();
        if (withHaptics) FeedbackHaptics(params.haptics_type);
        objectRequest(object_params, 'do', { value: 1 }, (data) =>
            setObjectData((prev) => mergeState(prev, data))
        );
    };

    const doLike = (event) => toggleLike(event, true);
    const undoLike = (event) => toggleLike(event, false);

    // --- who liked ---

    const openVoters = (event) =>
        openPerformedBy({
            event,
            object_params,
            allowed: allowViewVoted,
            hapticsType: params.haptics_type,
            setPerformedBy,
            setPopupVisible,
        });

    useVotedSubscription({
        channel: votedChannel(props.system, props.type, props.object_id),
        currentUserId: currentUser.id,
        onUpdate: (next) => setObjectData((prev) => mergeState(prev, next)),
    });

    // --- action button ---

    const { showAsButton, showLabel } = resolveActionButtonFlags(params);
    const canUndo = action?.is_undo === true;
    const isVoted =
        objectData?.is_voted != undefined
            ? objectData.is_voted === true
            : false;
    const isDisabled =
        objectData?.is_disabled != undefined
            ? objectData.is_disabled === true
            : false;
    const title = objectData?.title != undefined ? objectData.title : '';

    const ActionButton = pickActionButton(showCombined, showAsButton);

    let actionButton;
    if (canUndo && isVoted) {
        actionButton = (
            <ActionButton
                key="action"
                startDecorator={icon}
                title={showLabel ? title : false}
                onPress={undoLike}
                pressed={true}
                selectedState="voted"
                {...buttonProps}
            />
        );
    } else {
        actionButton = (
            <ActionButton
                key="action"
                startDecorator={icon}
                title={showLabel ? title : false}
                onPress={!isDisabled ? doLike : () => {}}
                disabled={isDisabled}
                {...buttonProps}
            />
        );
    }

    // --- counter ---

    const showCounterAsButton = resolveCounterAsButton(params);
    const count =
        objectData?.counter != undefined &&
        objectData.counter?.count != undefined
            ? objectData.counter.count
            : '';

    const CounterButton = pickCounterButton(showCombined, showCounterAsButton);

    let counterButton;
    let counterPopup;

    if (showCounter && count > 0) {
        counterButton = (
            <View key="counter">
                <CounterButton
                    startDecorator={!showCombined ? 'ThumbsUp' : false}
                    title={count + ''}
                    onPress={openVoters}
                    {...buttonProps}
                />
            </View>
        );

        counterPopup = (
            <PerformedByModal
                title={t('Likes')}
                visible={popupVisible}
                onClose={() => setPopupVisible(false)}
                users={performedBy}
            />
        );
    }

    // --- layout ---

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
            emptyCheck={showCounter && !showAction && !count}
        />
    );
}
