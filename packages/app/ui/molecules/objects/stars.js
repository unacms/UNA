/**
 * Stars — star rating action + rate counter + "who voted" popup.
 *
 * Props (from backend / entity actions):
 *   type, system, object_id  — object id for API and socket
 *   action                   — title, value, is_voted, is_undo, is_disabled
 *   counter                  — { count, rate }
 *   params                   — overrides for social_actions.star (+ button_*)
 *   displayType              — 'action' | 'counter' | 'both' (default both)
 *   primary                  — button variant=primary
 */

import { useState } from 'react';
import { Platform } from 'react-native';
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
} from 'app/lib/object-helpers';
import { useCurrentUser } from 'app/context/user';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import { StarsAction } from 'app/ui/atoms/stars';
import { View, Pressable } from 'app/design/view';

const isWeb = Platform.OS === 'web';

export default function ElementStars(props) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();

    const settings = appSetting('social_actions', 'star');
    const params = { ...settings, ...props.params };
    const action = props.action;
    const counter = props.counter;

    const key = objectKey(props.type, props.system, props.object_id);
    const icon = settings[props.system]?.icon
        ? settings[props.system].icon
        : 'Star';

    const { showAction, showCounter, showBoth, showCombined } =
        resolveDisplayFlags(params, props?.displayType);
    const buttonProps = buildButtonProps(props);

    const [objectData, setObjectData] = useState({
        ...action,
        ...{ counter },
    });
    const [popupVisibleDo, setPopupVisibleDo] = useState(false);
    const [popupVisiblePb, setPopupVisiblePb] = useState(false);
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

    // --- do / undo star ---

    const doStar = (value) => {
        FeedbackHaptics(params.haptics_type);
        objectRequest(object_params, 'do', { value }, (data) => {
            setObjectData((prev) => mergeState(prev, data));
            setPopupVisibleDo(false);
        });
    };

    const undoStar = () => {
        FeedbackHaptics(params.haptics_type);
        const value =
            objectData?.value != undefined
                ? objectData.value
                : props.action.value;
        objectRequest(object_params, 'do', { value }, (data) =>
            setObjectData((prev) => mergeState(prev, data))
        );
    };

    // --- who voted ---

    const openVoters = (event) =>
        openPerformedBy({
            event,
            object_params,
            allowed: allowViewVoted,
            hapticsType: params.haptics_type,
            setPerformedBy,
            setPopupVisible: setPopupVisiblePb,
        });

    useVotedSubscription({
        channel: votedChannel(props.system, props.type, props.object_id),
        currentUserId: currentUser.id,
        onUpdate: (next) => setObjectData((prev) => mergeState(prev, next)),
    });

    // Live fields from local state (fallback to props for initial)
    let isVoted = action?.is_voted === true;
    if (objectData?.is_voted != undefined) {
        isVoted = objectData.is_voted === true;
    }

    let isDisabled = action?.is_disabled === true;
    if (objectData?.is_disabled != undefined) {
        isDisabled = objectData.is_disabled === true;
    }

    let title = action?.title || '';
    if (objectData?.title != undefined) title = objectData.title;

    let count = 0;
    if (counter?.count) count = counter.count;
    if (objectData?.counter?.count != undefined) {
        count = objectData.counter.count;
    }

    let rate = '';
    if (counter?.rate) rate = counter.rate;
    if (objectData?.counter?.rate != undefined) {
        rate = objectData.counter.rate;
    }

    // --- action button ---

    let actionButton;
    if (showAction) {
        const { showAsButton, showLabel } = resolveActionButtonFlags(params);
        const canUndo = action?.is_undo === true;
        const ActionButton = pickActionButton(showCombined, showAsButton);

        if (isVoted) {
            if (canUndo) {
                actionButton = (
                    <ActionButton
                        key="action"
                        startDecorator={icon}
                        title={showLabel ? title : ''}
                        onPress={undoStar}
                        {...buttonProps}
                    />
                );
            } else {
                actionButton = (
                    <ActionButton
                        key="action"
                        startDecorator={icon}
                        title={showLabel ? title : ''}
                        onPress={() => {}}
                        disabled={true}
                        {...buttonProps}
                    />
                );
            }
        } else if (isWeb) {
            actionButton = (
                <Pressable
                    key="action"
                    onPress={(event) => {
                        event.preventDefault();
                    }}
                >
                    <DropdownPopup
                        trigger={
                            <ActionButton
                                variant={showCombined ? 'group-item' : false}
                                startDecorator={icon}
                                title={showLabel ? title : ''}
                                onPress={() => {}}
                                disabled={isDisabled}
                                {...buttonProps}
                            />
                        }
                        size="auto"
                        open={!!popupVisibleDo}
                        onOpenChange={async (open) => {
                            setPopupVisibleDo(open);
                        }}
                    >
                        <StarsAction
                            rating={rate}
                            onChange={
                                !isDisabled
                                    ? (number) => {
                                          doStar(number);
                                      }
                                    : () => {}
                            }
                        />
                    </DropdownPopup>
                </Pressable>
            );
        } else {
            // TODO: Roman, something should be used here for Native.
            actionButton = (
                <ActionButton
                    startDecorator={icon}
                    title={showLabel ? title : false}
                    {...buttonProps}
                />
            );
        }
    }

    // --- counter ---

    const showCounterAsButton = resolveCounterAsButton(params);
    const CounterButton = pickCounterButton(showCombined, showCounterAsButton);

    let counterButton;
    let counterPopup;

    if (showCounter && (count > 0 || rate > 0)) {
        counterButton = (
            <View key="counter">
                <CounterButton
                    startDecorator={'Star'}
                    title={rate + ''}
                    onPress={openVoters}
                    {...buttonProps}
                />
            </View>
        );

        counterPopup = (
            <PerformedByModal
                title={t('Likes')}
                visible={popupVisiblePb}
                onClose={() => setPopupVisiblePb(false)}
                users={performedBy}
            />
        );
    }

    // --- layout ---

    const combinedGroup = [];
    if (showAction && !!actionButton) combinedGroup.push(actionButton);
    if (showCounter && !!counterButton) combinedGroup.push(counterButton);

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
