/**
 * Scores — upvote / downvote + score counter + "who voted" popup.
 *
 * Props (from backend / entity actions):
 *   type, system, object_id  — object id for API and socket
 *   action                   — { up: {...}, down: {...} } with title, is_voted, is_disabled
 *   counter                  — { score, count_up, count_down }
 *   params                   — overrides for social_actions.score (+ button_*, show_*)
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
    scoresVotedChannel,
    useVotedSubscription,
    PerformedBySkeleton,
    PerformedByModal,
} from 'app/ui/molecules/objects/helpers';
import { useCurrentUser } from 'app/context/user';
import { Icon } from 'app/ui/atoms/icon';
import Profile from 'app/ui/molecules/profile/profile';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';

const isWeb = Platform.OS === 'web';

const VOTE_ICONS = {
    up: 'ArrowBigUp',
    down: 'ArrowBigDown',
};

function votersList(votes) {
    if (!votes?.length) return <PerformedBySkeleton />;

    return votes.map((vote) => (
        <View
            key={vote.author_data.id + '-' + vote.vote_date}
            className="flex flex-row justify-between items-center"
        >
            <View className="flex-auto">
                <Profile {...vote.author_data} />
            </View>
            <View className="flex-none">
                <Icon icon={VOTE_ICONS[vote.vote_type]} />
            </View>
        </View>
    ));
}

export default function ElementScore(props) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();

    const params = {
        ...appSetting('social_actions', 'score'),
        ...props.params,
    };
    const action = props.action;
    const counter = props.counter;

    const key = objectKey(props.type, props.system, props.object_id);
    const { showAction, showCounter, showBoth, showCombined } =
        resolveDisplayFlags(params, props.displayType);
    const buttonProps = buildButtonProps(props);

    const [objectData, setObjectData] = useState({
        ...action,
        ...{ counter },
    });
    const [counterClass, setCounterClass] = useState('');
    const [popupVisible, setPopupVisible] = useState(false);
    const [performedBy, setPerformedBy] = useState();

    const object_params = {
        service: 'TemplScoreServices',
        system: props.system,
        objectId: props.object_id,
    };

    // Apply vote response: animate score change, then merge into state
    const applyVoteResult = (data) => {
        if (data?.counter != undefined) {
            data.counter.score_old =
                objectData?.counter != undefined
                    ? objectData.counter.score
                    : counter.score;

            if (data.counter.score != data.counter.score_old) {
                if (
                    parseInt(data.counter.score) >
                    parseInt(data.counter.score_old)
                ) {
                    setCounterClass('translate-y-1/2');
                } else {
                    setCounterClass('-translate-y-1/2');
                }
            }
        }

        setObjectData((prev) => mergeState(prev, data));
    };

    // --- do upvote / downvote ---

    const doVote = (voteAction, event) => {
        event.preventDefault();
        FeedbackHaptics(params.haptics_type);
        objectRequest(object_params, 'do', { a: voteAction }, applyVoteResult);
    };

    // --- who voted ---

    const openVoters = (event) =>
        openPerformedBy({
            event,
            object_params,
            hapticsType: params.haptics_type,
            setPerformedBy,
            setPopupVisible,
        });

    useVotedSubscription({
        channel: scoresVotedChannel(props.system, props.object_id),
        currentUserId: currentUser.id,
        onUpdate: applyVoteResult,
    });

    // --- action buttons (up / down) ---

    const { showAsButton, showLabel } = resolveActionButtonFlags(params);
    const ActionButton = pickActionButton(showCombined, showAsButton);

    const actionButtons = Object.keys(action).map((voteAction) => {
        const isDisabled =
            objectData?.[voteAction]?.is_disabled != undefined
                ? objectData[voteAction].is_disabled === true
                : false;
        const title =
            objectData?.[voteAction]?.title != undefined
                ? objectData[voteAction].title
                : '';

        return (
            <ActionButton
                key={'action-' + voteAction}
                startDecorator={VOTE_ICONS[voteAction]}
                title={showLabel ? title : false}
                onPress={
                    !isDisabled
                        ? (event) => doVote(voteAction, event)
                        : () => {}
                }
                disabled={isDisabled}
                {...buttonProps}
            />
        );
    });

    // --- counter ---

    const showCounterAsButton = resolveCounterAsButton(params);
    const CounterButton = pickCounterButton(showCombined, showCounterAsButton);

    let counterButton;
    let counterPopup;

    if (
        showCounter &&
        objectData?.counter != undefined &&
        objectData.counter?.score != undefined
    ) {
        const score = parseInt(objectData.counter.score);
        const scoreOld =
            objectData.counter?.score_old != undefined
                ? parseInt(objectData.counter.score_old)
                : score;
        const countUp = objectData.counter.count_up;
        const countDown = objectData.counter.count_down;
        const hasVotes = countUp != 0 || countDown != 0;

        const scoreTitle = isWeb ? (
            <Text
                className={
                    'flex' +
                    (score > scoreOld ? ' items-end' : ' items-start') +
                    ' h-5 overflow'
                }
            >
                <Text
                    className={
                        'flex' +
                        (score > scoreOld ? ' flex-col-reverse' : ' flex-col') +
                        ' transition-allweb:duration-500 ' +
                        counterClass
                    }
                >
                    <Text className={'sv-old block h-5'}>
                        {scoreOld.toString()}
                    </Text>
                    <Text className={'sv-new block h-5'}>
                        {score.toString()}
                    </Text>
                </Text>
            </Text>
        ) : (
            score.toString()
        );

        counterButton = (
            <CounterButton
                key="counter"
                startDecorator={!showCombined ? 'ArrowBigUp' : false}
                title={scoreTitle}
                onPress={openVoters}
                disabled={!hasVotes}
                {...buttonProps}
            />
        );

        if (hasVotes) {
            counterPopup = (
                <PerformedByModal
                    title={t('Upvotes')}
                    visible={popupVisible}
                    onClose={() => setPopupVisible(false)}
                >
                    {votersList(performedBy)}
                </PerformedByModal>
            );
        }
    }

    // --- layout ---

    return (
        <ActionMenuLayout
            combined={showCombined}
            buttonProps={buttonProps}
            itemKey={key}
            showAction={showAction}
            showCounter={showCounter}
            showBoth={showBoth}
            params={{ ...params, counter_flex: 'flex-auto flex-row' + (showBoth ? ' mx-0.5' : '') }}
            actionSlots={[
                { element: actionButtons[0], key: key + '-action-up', marginClass: ' mr-0.5' },
                'counter',
                { element: actionButtons[1], key: key + '-action-down', marginClass: ' ml-0.5' },
            ]}
            counterButton={counterButton}
            counterPopup={counterPopup}
            combinedGroup={[actionButtons[0], counterButton, actionButtons[1]]}
        />
    );
}
