/**
 * Reactions — action button + counter (compound / divided) + "who reacted" popup.
 *
 * Props (from backend / entity actions):
 *   type, system, object_id  — object id for API and socket
 *   action                   — button: title, reaction, is_voted, is_undo, is_disabled
 *   counter                  — { items: [{ name, count }, ...] }
 *   params                   — overrides for social_actions.reaction (+ button_*, show_*)
 *   displayType              — 'action' | 'counter' | 'both' (default both)
 *   primary                  — button variant=primary
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    Modal as ReactNativeModal,
    TouchableWithoutFeedback,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { RemoveScroll } from 'react-remove-scroll';
import { appSetting, FeedbackHaptics, isEmoji } from 'app/lib/util';
import {
    objectKey,
    mergeState,
    objectRequest,
    resolveDisplayFlags,
    buildButtonProps,
    pickActionButton,
    pickCounterButton,
    resolveActionButtonFlags,
    votedChannel,
    useVotedSubscription,
    profileUsersList,
    PerformedByModal,
    ActionMenuLayout,
} from 'app/ui/molecules/objects/helpers';
import { useCurrentUser } from 'app/context/user';
import { useWindowSize } from 'app/context/measure';
import { useSound } from 'app/lib/hooks/use-sound';
import { Icon } from 'app/ui/atoms/icon';
import Tooltip from 'app/ui/molecules/dialogs/tooltip';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import { Modal, NeoButton } from 'app/design/controls';

const isWeb = Platform.OS === 'web';

/** Icon from iconset: web/native × svg/emoji */
function resolveIcon(params, iconset, name) {
    const platform = isWeb ? 'web' : 'native';
    const iconType = name !== 'default' ? params['icon_type_' + platform] : 'svg';
    return iconset?.[platform]?.[name]?.[iconType];
}

/** Live count for a reaction: prefer actionsData, else props.counter */
function liveCount(item, actionsData) {
    const key = 'count_' + item.name;
    const fromState = actionsData?.counter?.[key];
    if (fromState != undefined) return fromState;
    return item.count;
}

// ---------------------------------------------------------------------------
// Counter: divided — one button + modal per reaction
// ---------------------------------------------------------------------------

function buildCounterDivided({
    t,
    getIcon,
    onOpenReaction,
    actionsData,
    performedBy,
    popupVisible,
    setPopupVisible,
    showCombined,
    params,
    counter,
    buttonProps,
}) {
    const showAsButton = params?.show_counter_as_button === true;
    const CounterButton = pickCounterButton(showCombined, showAsButton);

    const buttons = [];
    const popups = [];

    counter.items.forEach((item, index) => {
        if (item.name == 'default') return;

        const count = liveCount(item, actionsData);
        if (!count) return;

        buttons.push(
            <CounterButton
                {...buttonProps}
                key={'counter-button-' + index}
                startDecorator={getIcon(item.name)}
                title={count}
                onPress={(event) => onOpenReaction(item?.name || '', event)}
            />
        );

        popups.push(
            <PerformedByModal
                key={'counter-popup-' + index}
                title={t('Reactions')}
                visible={popupVisible[item.name]}
                onClose={() =>
                    setPopupVisible((state) => ({ ...state, [item.name]: false }))
                }
                users={performedBy?.[item.name]}
                listOptions={{ asRow: false, wrap: true }}
            />
        );
    });

    return [buttons, popups];
}

// ---------------------------------------------------------------------------
// Counter: compound — total button + tabs inside modal
// ---------------------------------------------------------------------------

function buildCounterCompound({
    t,
    getIcon,
    onOpen,
    actionsData,
    performedBy,
    popupVisible,
    setPopupVisible,
    selectedTab,
    setSelectedTab,
    showCombined,
    params,
    counter,
    buttonProps,
}) {
    let total = 0;
    let selected = selectedTab;

    const icons = Object.keys(counter.items).map((key) => {
        const item = counter.items[key];
        if (item.name == 'default') return;

        const count = liveCount(item, actionsData);
        if (!selected && count != 0) selected = item.name;
        total += count;
        if (!count) return;
        return getIcon(item.name);
    });

    if (!total) return false;

    const tabs = Object.keys(counter.items).map((key) => {
        const item = counter.items[key];
        if (item.name == 'default') return;
        if (!performedBy?.[item.name]?.length) return;

        let className = ' flex mx-1 flex-row w-min top-px';
        if (item.name == selected) className += ' border-b-2 border-primary ';

        return (
            <View key={item.name} className={className}>
                <NeoButton
                    style="borderless"
                    controlSize="small"
                    borderShape="circle"
                    image={getIcon(item.name)}
                    accessibilityLabel={t('rvote_' + item.name + '_title')}
                    onPress={() => setSelectedTab(item.name)}
                />
            </View>
        );
    });

    const panels = Object.keys(counter.items).map((key) => {
        const item = counter.items[key];
        if (item.name == 'default') return;

        if (!selected && item.count != 0) selected = item.name;

        let className = '';
        if (item.name != selected) className = 'hidden ';
        className += 'gap-2 overflow-y-auto text-card-foreground';

        return (
            <View key={item.name} className={className}>
                {profileUsersList(performedBy?.[item.name], {
                    asRow: true,
                    wrap: false,
                })}
            </View>
        );
    });

    const showAsButton = params?.show_counter_as_button === true;
    const CounterButton = pickCounterButton(showCombined, showAsButton);

    return [
        [
            <CounterButton
                {...buttonProps}
                fullWidth={false}
                key="counter"
                startDecorator={icons}
                title={total}
                onPress={onOpen}
            />,
        ],
        [
            <Modal
                key="counter-popup"
                title={t('Reactions')}
                onVisible={popupVisible}
                onClose={() => setPopupVisible(false)}
            >
                <View className="relative flex-row border-b border-border/60  ">
                    {tabs}
                </View>
                <View className="p-2">{panels}</View>
            </Modal>,
        ],
    ];
}

// ---------------------------------------------------------------------------
// Reaction picker popover (emoji bar next to button)
//
// Facebook-style: tap/click = default reaction (onDefault). The picker opens
// on long press (native) or mouse hover (web); hovering out closes it.
// ---------------------------------------------------------------------------

const HOVER_OPEN_DELAY = 500;
const HOVER_CLOSE_DELAY = 300;
const HOVER_SLOP = 8;

function isPointInRect(x, y, rect, slop = 0) {
    if (!rect) return false;
    return (
        x >= rect.left - slop &&
        x <= rect.right + slop &&
        y >= rect.top - slop &&
        y <= rect.bottom + slop
    );
}

function ReactionPopover({
    items,
    onTap,
    onDefault,
    disabled,
    haptics,
    children,
    childRefProp = 'ref',
}) {
    const { width: windowWidth, height: windowHeight } = useWindowSize();
    const [modalVisible, setModalVisible] = useState(false);
    const [buttonPos, setButtonPos] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });
    const buttonRef = useRef(null);
    const barRef = useRef(null);
    const openTimer = useRef(null);
    const closeTimer = useRef(null);

    const clearTimers = () => {
        clearTimeout(openTimer.current);
        clearTimeout(closeTimer.current);
        openTimer.current = null;
        closeTimer.current = null;
    };

    useEffect(() => clearTimers, []);

    const closeModal = () => {
        clearTimers();
        setModalVisible(false);
    };

    // RN host views have measureInWindow; the web View is a plain div, so fall
    // back to its viewport rect (what RN-web's measureInWindow returns).
    const measureButton = (callback) => {
        const node = buttonRef.current;
        if (typeof node?.measureInWindow === 'function') return node.measureInWindow(callback);
        const rect = node?.getBoundingClientRect?.();
        if (rect) callback(rect.left, rect.top, rect.width, rect.height);
    };

    const openModal = () => {
        if (!buttonRef.current) return;

        measureButton((x, y, width, height) => {
            const popupHeight = 60;
            const popoverWidth = 300;
            const padding = 10;
            let actY = isWeb ? y : y - 20;
            if (actY + popupHeight >= windowHeight - 64) {
                actY = y - popupHeight - height;
            }

            let adjustedX = x + width / 2 - popoverWidth / 2;
            if (adjustedX < padding) adjustedX = padding;
            if (adjustedX + popoverWidth > windowWidth - padding) {
                adjustedX = windowWidth - popoverWidth - padding;
            }

            setButtonPos({ x: adjustedX, y: actY, width, height });
            setModalVisible(true);
        });
    };

    const handleSelect = (item) => {
        closeModal();
        onTap?.(item);
    };

    const handlePress = (event) => {
        clearTimers();
        onDefault?.(event);
    };

    const handleLongPress = () => {
        if (disabled) return;
        FeedbackHaptics(haptics);
        openModal();
    };

    // --- web hover (mouse only, so touch taps on mobile web stay a plain like) ---

    const handlePointerEnter = (event) => {
        if (disabled || modalVisible || event.pointerType !== 'mouse') return;
        clearTimeout(openTimer.current);
        openTimer.current = setTimeout(openModal, HOVER_OPEN_DELAY);
    };

    const handlePointerLeave = () => {
        clearTimeout(openTimer.current);
        openTimer.current = null;
    };

    // The overlay covers the button while open, so hit-test manually: keep
    // the bar open while the pointer is over the button or the bar.
    const isOverTarget = (x, y) =>
        isPointInRect(x, y, barRef.current?.getBoundingClientRect?.(), HOVER_SLOP) ||
        isPointInRect(x, y, buttonRef.current?.getBoundingClientRect?.(), HOVER_SLOP);

    const handleOverlayMouseMove = (event) => {
        if (isOverTarget(event.clientX, event.clientY)) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        } else if (!closeTimer.current) {
            closeTimer.current = setTimeout(closeModal, HOVER_CLOSE_DELAY);
        }
    };

    const handleOverlayClick = (event) => {
        // The modal is a portal: keep clicks from reaching the message row.
        event.stopPropagation();
        const { clientX, clientY } = event;
        if (isPointInRect(clientX, clientY, barRef.current?.getBoundingClientRect?.())) return;
        closeModal();
        // A click on the (covered) button still means "like", as on Facebook.
        if (isPointInRect(clientX, clientY, buttonRef.current?.getBoundingClientRect?.())) {
            onDefault?.(event);
        }
    };

    const reactionBar = (
        <View
            ref={barRef}
            style={{
                top: buttonPos.y + buttonPos.height + 5,
                left: buttonPos.x,
                elevation: 5,
            }}
            className=" absolute flex-row rounded-full shadow-card-outline dark:shadow-card-outline-deep p-1 px-1.5 bg-popover items-center h-14"
        >
            {items.map((item) => {
                const content = isEmoji(item.icon) ? (
                    <View className="w-11 items-center justify-center">
                        <Text className="text-3xl  web:hover:scale-110 flex web:hover:bg-muted/50 web:active:bg-muted rounded-full">
                            {item.icon}
                        </Text>
                    </View>
                ) : (
                    <View className="w-11 h-11  items-center text-secondary-foreground web:hover:text-foreground web:hover:scale-110 web:duration-200 justify-center flex web:hover:bg-muted/50 web:active:bg-muted rounded-full">
                        <Icon icon={item.icon} size={24} />
                    </View>
                );

                return (
                    <TouchableOpacity
                        key={item.id}
                        onPress={() => handleSelect(item)}
                    >
                        {isWeb ? (
                            <Tooltip content={item.title}>{content}</Tooltip>
                        ) : (
                            content
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const overlay = modalVisible ? (
        <ReactNativeModal
            presentationStyle="overFullScreen"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeModal}
        >
            {isWeb ? (
                <View
                    className="flex-1 bg-transparent"
                    onMouseMove={handleOverlayMouseMove}
                    onClick={handleOverlayClick}
                >
                    <RemoveScroll>{reactionBar}</RemoveScroll>
                </View>
            ) : (
                <TouchableWithoutFeedback onPress={closeModal}>
                    <View className="flex-1 bg-transparent">{reactionBar}</View>
                </TouchableWithoutFeedback>
            )}
        </ReactNativeModal>
    ) : null;

    const button =
        children && typeof children === 'object'
            ? React.cloneElement(children, {
                  onPress: disabled ? undefined : handlePress,
                  ...(isWeb
                      ? {}
                      : {
                            [childRefProp]: buttonRef,
                            onLongPress: disabled ? undefined : handleLongPress,
                        }),
              })
            : null;

    if (isWeb) {
        return (
            <View
                ref={buttonRef}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
            >
                {button}
                {overlay}
            </View>
        );
    }

    return (
        <View>
            {button}
            {overlay}
        </View>
    );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function ElementReactions(props) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const playSound = useSound('success');

    const settings = appSetting('social_actions', 'reaction');
    const params = { ...settings, ...props.params };
    const action = props.action;
    const counter = props.counter;

    const key = objectKey(props.type, props.system, props.object_id);

    const items = settings[props.system]?.items
        ? settings[props.system].items
        : params.items;
    const iconset = settings[props.system]?.iconset
        ? settings[props.system].iconset
        : settings.iconset;

    const flags = resolveDisplayFlags(params, props.displayType);
    const showAction =
        flags.showAction && !!action && !!action?.title;
    const showCounter =
        flags.showCounter && !!counter && !!counter?.items;
    const showBoth = showAction && showCounter;
    const showCombined =
        showBoth &&
        params?.show_combined != undefined &&
        params.show_combined === true;

    const buttonProps = buildButtonProps(props);

    const [actionsData, setActionsData] = useState({});
    const [performedBy, setPerformedBy] = useState();

    // compound: one modal + selected tab
    const [compoundPopupOpen, setCompoundPopupOpen] = useState(false);
    const [compoundTab, setCompoundTab] = useState('');

    // divided: modal per reaction
    const initialDividedPopups = {};
    for (const i in items) initialDividedPopups[items[i].name] = false;
    const [dividedPopups, setDividedPopups] = useState(initialDividedPopups);

    const allowViewVoted =
        settings[props.system]?.allow_view_voted != undefined
            ? settings[props.system].allow_view_voted
            : true;

    const getIcon = (name) => resolveIcon(params, iconset, name);

    const object_params = {
        service: 'TemplVoteServices',
        system: props.system,
        objectId: props.object_id,
    };

    // --- do / undo reaction ---

    const doReaction = (reaction, event) => {
        if (event) event.preventDefault();
        FeedbackHaptics(params.haptics_type);

        const optimistic = {
            reaction,
            title: params?.t?.[reaction] ?? reaction,
        };
        setActionsData((prev) => mergeState(prev, optimistic));

        objectRequest(object_params, 'do', { value: 1, reaction }, (data) =>
            setActionsData((prev) => mergeState(prev, data))
        );
        playSound();
    };

    const undoReaction = (event) => {
        event.preventDefault();
        const reaction =
            actionsData?.reaction != undefined
                ? actionsData.reaction
                : props.action.reaction;

        objectRequest(object_params, 'do', { value: 1, reaction }, (data) =>
            setActionsData((prev) => mergeState(prev, data))
        );
        playSound();
    };

    // --- who reacted (compound / divided) ---

    const openCompoundVoters = (event) => {
        event.preventDefault();
        if (!allowViewVoted) return;
        FeedbackHaptics(params.haptics_type);

        objectRequest(object_params, 'get_performed_by', {}, (data) => {
            if (!data?.performed_by) return;
            setPerformedBy(data.performed_by);
            setCompoundTab('');
            setCompoundPopupOpen(true);
        });
    };

    const openDividedVoters = (reaction, event) => {
        event.preventDefault();
        if (!allowViewVoted || !reaction) return;
        FeedbackHaptics(params.haptics_type);

        objectRequest(object_params, 'get_performed_by', { reaction }, (data) => {
            if (!data?.performed_by) return;
            setPerformedBy(data.performed_by);
            setDividedPopups((state) => ({ ...state, [reaction]: true }));
        });
    };

    useVotedSubscription({
        channel: votedChannel(props.system, props.type, props.object_id),
        currentUserId: currentUser.id,
        onUpdate: (next) => setActionsData((prev) => mergeState(prev, next)),
    });

    // --- action button ---

    let actionButton;
    const actionPopup = undefined;

    if (showAction) {
        const { showAsButton, showLabel } = resolveActionButtonFlags(params);
        const canUndo = action?.is_undo === true;

        let isVoted = action?.is_voted === true || false;
        if (actionsData?.is_voted != undefined) {
            isVoted = actionsData.is_voted === true;
        }

        let isDisabled = action?.is_disabled === true || false;
        if (actionsData?.is_disabled != undefined) {
            isDisabled = actionsData.is_disabled === true;
        }

        let reaction = action?.reaction || '';
        if (actionsData?.reaction != undefined) {
            reaction = actionsData.reaction;
        }

        let title = action?.title || '';
        if (actionsData?.title != undefined) {
            title = actionsData.title;
        }

        const ActionButton = pickActionButton(showCombined, showAsButton);

        if (canUndo && isVoted) {
            actionButton = (
                <ActionButton
                    key="action"
                    startDecorator={getIcon(reaction)}
                    title={showLabel ? title : ''}
                    pressed={true}
                    onPress={undoReaction}
                    {...buttonProps}
                />
            );
        } else {
            const reactionItems = items.map((item) => ({
                id: item.id,
                name: item.name,
                icon: getIcon(item.name),
                title: t('rvote_' + item.name + '_title'),
            }));

            // Plain tap/click applies the default reaction ("like"), like Facebook.
            const defaultReaction = (
                items.find((item) => item.name === 'like') || items[0]
            )?.name;

            actionButton =
                items.length > 1 ? (
                    <ReactionPopover
                        key="action"
                        items={reactionItems}
                        onTap={(item) => {
                            doReaction(item.name);
                        }}
                        onDefault={() => doReaction(defaultReaction)}
                        disabled={isDisabled}
                        haptics={params.haptics_type}
                        childRefProp="forwardedRef"
                    >
                        <ActionButton
                            startDecorator={getIcon(reaction)}
                            disabled={isDisabled}
                            title={showLabel ? title : false}
                            {...buttonProps}
                        />
                    </ReactionPopover>
                ) : (
                    <ActionButton
                        key="action"
                        startDecorator={getIcon(reaction)}
                        title={showLabel ? title : false}
                        onPress={() => {
                            doReaction(items[0].name);
                        }}
                        disabled={isDisabled}
                        {...buttonProps}
                    />
                );
        }
    }

    // --- counter ---

    const counterStyle = params?.show_counter_style || 'compound';
    let counterParts = [];

    if (showCounter && counter?.items != undefined) {
        if (counterStyle === 'compound') {
            counterParts = buildCounterCompound({
                t,
                getIcon,
                onOpen: openCompoundVoters,
                actionsData,
                performedBy,
                popupVisible: compoundPopupOpen,
                setPopupVisible: setCompoundPopupOpen,
                selectedTab: compoundTab,
                setSelectedTab: setCompoundTab,
                showCombined,
                params,
                counter,
                buttonProps,
            });
        } else if (counterStyle === 'divided') {
            counterParts = buildCounterDivided({
                t,
                getIcon,
                onOpenReaction: openDividedVoters,
                actionsData,
                performedBy,
                popupVisible: dividedPopups,
                setPopupVisible: setDividedPopups,
                showCombined,
                params,
                counter,
                buttonProps,
            });
        }
    }

    // --- layout ---

    const hasCounterButtons = showCounter && !!counterParts;

    const combinedGroup = [];
    if (showAction) combinedGroup.push(actionButton);
    if (counterParts?.[0]) counterParts[0].forEach((item) => combinedGroup.push(item));

    return (
        <ActionMenuLayout
            combined={showCombined}
            buttonProps={buttonProps}
            itemKey={key}
            showAction={showAction}
            showCounter={showCounter}
            showBoth={showBoth}
            params={{
                ...props.params,
                counter_flex: 'flex-auto flex-row gap-x-1',
            }}
            actionSlots={[
                {
                    element: actionButton,
                    key: key + '-action-button',
                    marginClass: showBoth && hasCounterButtons ? ' mr-2' : '',
                },
            ]}
            counterButton={counterParts?.[0]}
            counterPopup={counterParts?.[1]}
            combinedGroup={combinedGroup}
            extraPopups={
                showAction && !!actionPopup ? (
                    <View key={key + '-action-popup'}>{actionPopup}</View>
                ) : null
            }
            emptyCheck={
                !((showAction && !!actionButton) ||
                  (showAction && !!actionPopup) ||
                  hasCounterButtons ||
                  (showCounter && !!counterParts))
            }
        />
    );
}
