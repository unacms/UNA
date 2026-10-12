/**
 * Reactions — action button + counter (compound / divided) + "who reacted" popup.
 *
 * Props (from backend / entity actions):
 *   type, system, object_id  — object id for API and socket
 *   action                   — button: title, reaction, reactions, is_voted, is_undo, is_disabled
 *   counter                  — { type, items: [{ name, count, emoji?, title? }, ...] }
 *   options                  — UNA reactions settings: mode, default, per_user, split_counters, items
 *   params                   — overrides for social_actions.reaction (+ button_*, show_*)
 *   displayType              — 'action' | 'counter' | 'both' (default both)
 *   primary                  — button variant=primary
 *
 * Modes (UNA Studio > Settings > Global > Reactions):
 *   solo — one reaction, the default one; a click gives or takes it back.
 *   few  — the reactions list in a bar next to the button.
 *   many — the list plus any emoji, in an emoji picker.
 * With a default reaction a click gives it (or takes back the reaction the
 * button shows) and the choice opens on hover / long press. Without one the
 * button is a smile-plus that always opens the choice. A backend without
 * `options` behaves as before: few, with "like" as the default.
 */

import React, { useState, useRef, useEffect, createContext, useContext, type ComponentType, type ReactNode } from 'react';
import {
    Modal as ReactNativeModal,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { RemoveScroll } from 'react-remove-scroll';
import { appSetting, FeedbackHaptics, isEmoji, cn } from 'app/lib/util';
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
    PerformedByModal as PerformedByModalJs,
    ActionMenuLayout as ActionMenuLayoutJs,
} from 'app/ui/molecules/objects/helpers';
import { useCurrentUser } from 'app/context/user';
import { useWindowSize } from 'app/context/measure';
import { useSound } from 'app/lib/hooks/use-sound';
import { lazyComponent } from 'app/lib/lazy-component';
import {
    emojiFromReactionCode,
    reactionCodeFromEmoji,
    emojiKey,
} from 'app/lib/emoji/reaction-emoji';
import { Icon } from 'app/ui/atoms/icon';
import TooltipJs from 'app/ui/molecules/dialogs/tooltip';
import { Text } from 'app/design/typography';
import { View, Pressable } from 'app/design/view';
import { Modal, NeoButton } from 'app/design/controls';

// The picker carries ~70 KB of emoji data: load it when it is first opened.
const EmojiPicker = lazyComponent(() => import('app/ui/molecules/emoji-picker/emoji-picker'), {
    name: 'EmojiPicker',
});

// JS components: their props are inferred from destructuring, so every prop reads as required.
const PerformedByModal: ComponentType<any> = PerformedByModalJs;
const ActionMenuLayout: ComponentType<any> = ActionMenuLayoutJs;
const Tooltip: ComponentType<any> = TooltipJs;

const isWeb = Platform.OS === 'web';

type ReactionMode = 'solo' | 'few' | 'many';

type ReactionItem = {
    name: string;
    title: string;
    emoji: string;
};

type ReactionOptions = {
    mode?: string;
    default?: string;
    per_user?: number;
    split_counters?: boolean;
    items?: ReactionItem[];
};

type CounterItem = {
    name: string;
    count: number;
    emoji?: string;
    title?: string;
};

type ReactionAction = {
    is_undo?: boolean;
    is_voted?: boolean;
    is_disabled?: boolean;
    reaction?: string;
    reactions?: string[];
    default?: string;
    title?: string;
};

/** Live state from the vote response and the socket; overrides the props. */
type ReactionState = {
    is_voted?: boolean;
    is_disabled?: boolean;
    reaction?: string;
    reactions?: string[];
    title?: string;
    counter?: Record<string, number | string>;
};

type ReactionConfig = {
    mode: ReactionMode;
    defaultName: string;
    perUser: number;
    split: boolean;
    items: ReactionItem[];
};

type ReactionsProps = {
    type: string;
    system: string;
    object_id: string | number;
    action?: ReactionAction;
    counter?: { type?: string; items?: CounterItem[] };
    options?: ReactionOptions;
    params?: Record<string, any>;
    displayType?: string;
    primary?: boolean;
    [key: string]: any;
};

const MODES: readonly ReactionMode[] = ['solo', 'few', 'many'];
const PER_USER_MAX = 5;
const SMILE_PLUS = 'SmilePlus';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function resolveConfig(
    options: ReactionOptions | undefined,
    settingsItems: { name: string }[],
    params: Record<string, any>,
    iconset: any,
    t: (key: string) => string
): ReactionConfig {
    let config: ReactionConfig;

    if (options && Array.isArray(options.items)) {
        const items = options.items.filter((item) => !!item?.name);
        const mode = MODES.includes(options.mode as ReactionMode) ? (options.mode as ReactionMode) : 'few';
        const defaultName =
            options.default && items.some((item) => item.name === options.default) ? options.default : '';
        config = {
            mode,
            defaultName,
            perUser: Math.max(1, Math.min(PER_USER_MAX, Number(options.per_user) || 1)),
            split: options.split_counters === true,
            items,
        };
    } else {
        // Backend without reactions settings: the list from NEO settings, "like" by default.
        const items = settingsItems.map((item) => ({
            name: item.name,
            title: t('rvote_' + item.name + '_title'),
            emoji: iconset?.native?.[item.name]?.emoji ?? '',
        }));
        config = {
            mode: 'few',
            defaultName: (items.find((item) => item.name === 'like') ?? items[0])?.name ?? '',
            perUser: 1,
            split: params?.show_counter_style === 'divided',
            items,
        };
    }

    if (config.mode === 'solo') {
        const solo = config.items.find((item) => item.name === config.defaultName) ?? config.items[0];
        config.items = solo ? [solo] : [];
        config.defaultName = solo?.name ?? '';
        config.perUser = 1;
    }

    return config;
}

// ---------------------------------------------------------------------------
// Counter: divided — one pill + modal per reaction
// ---------------------------------------------------------------------------

function buildCounterDivided({
    t,
    getIcon,
    getTitle,
    onOpenReaction,
    liveCount,
    items,
    mine,
    performedBy,
    popupVisible,
    setPopupVisible,
    showCombined,
    params,
    buttonProps,
}: {
    t: (key: string) => string;
    getIcon: (name: string) => string;
    getTitle: (name: string) => string;
    onOpenReaction: (name: string, event: any) => void;
    liveCount: (item: CounterItem) => number;
    items: CounterItem[];
    mine: string[];
    performedBy: Record<string, any[]> | undefined;
    popupVisible: Record<string, boolean>;
    setPopupVisible: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    showCombined: boolean;
    params: Record<string, any>;
    buttonProps: Record<string, any>;
}): [ReactNode[], ReactNode[]] {
    const showAsButton = params?.show_counter_as_button === true;
    const CounterButton = pickCounterButton(showCombined, showAsButton);

    const buttons: ReactNode[] = [];
    const popups: ReactNode[] = [];

    items.forEach((item) => {
        const count = liveCount(item);
        if (!count) return;

        const isMine = mine.includes(item.name);
        buttons.push(
            <CounterButton
                {...buttonProps}
                key={'counter-button-' + item.name}
                startDecorator={getIcon(item.name)}
                title={count}
                // The count alone is no name; NeoButton would fall back to the icon's (Heart reads "Like").
                accessibilityLabel={getSpokenName(item.name, getTitle) + ' ' + count}
                pressed={isMine}
                selectedState={isMine ? 'voted' : undefined}
                onPress={(event: any) => onOpenReaction(item.name, event)}
            />
        );

        popups.push(
            <PerformedByModal
                key={'counter-popup-' + item.name}
                title={t('Reactions')}
                visible={!!popupVisible[item.name]}
                onClose={() => setPopupVisible((state) => ({ ...state, [item.name]: false }))}
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
    getTitle,
    onOpen,
    liveCount,
    items,
    performedBy,
    popupVisible,
    setPopupVisible,
    selectedTab,
    setSelectedTab,
    showCombined,
    params,
    buttonProps,
}: {
    t: (key: string) => string;
    getIcon: (name: string) => string;
    getTitle: (name: string) => string;
    onOpen: (event: any) => void;
    liveCount: (item: CounterItem) => number;
    items: CounterItem[];
    performedBy: Record<string, any[]> | undefined;
    popupVisible: boolean;
    setPopupVisible: (visible: boolean) => void;
    selectedTab: string;
    setSelectedTab: (name: string) => void;
    showCombined: boolean;
    params: Record<string, any>;
    buttonProps: Record<string, any>;
}): [ReactNode[], ReactNode[]] | false {
    let total = 0;
    let selected = selectedTab;

    const icons = items.map((item) => {
        const count = liveCount(item);
        if (!selected && count != 0) selected = item.name;
        total += count;
        if (!count) return null;
        return getIcon(item.name);
    });

    if (!total) return false;

    const tabs = items.map((item) => {
        if (!performedBy?.[item.name]?.length) return null;

        return (
            <View
                key={item.name}
                className={cn('flex mx-1 flex-row w-min top-px', item.name == selected && 'border-b-2 border-primary')}
            >
                <NeoButton
                    style="borderless"
                    controlSize="small"
                    borderShape="circle"
                    image={getIcon(item.name)}
                    accessibilityLabel={getSpokenName(item.name, getTitle)}
                    onPress={() => setSelectedTab(item.name)}
                />
            </View>
        );
    });

    const panels = items.map((item) => (
        <View
            key={item.name}
            className={cn('gap-2 overflow-y-auto text-card-foreground', item.name != selected && 'hidden')}
        >
            {profileUsersList(performedBy?.[item.name], { asRow: true, wrap: false })}
        </View>
    ));

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
                accessibilityLabel={t('Reactions') + ' ' + total}
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
                <View className="relative flex-row border-b border-border/60">{tabs}</View>
                <View className="p-2">{panels}</View>
            </Modal>,
        ],
    ];
}

// ---------------------------------------------------------------------------
// Popover: the reactions bar (few) or the emoji picker (many) next to the button.
//
// Opens on long press (native and touch web), on mouse hover (web, when
// `hoverOpen`), or on click (`openOnPress`). Otherwise a click calls `onPress`.
// ---------------------------------------------------------------------------

const HOVER_OPEN_DELAY = 500;
const HOVER_CLOSE_DELAY = 300;
const HOVER_SLOP = 8;
// Ignore the click that ends the long press which opened the popover.
const OPEN_CLICK_GUARD = 500;
const PANEL_GAP = 6;
const SCREEN_PADDING = 10;

type Rect = { left: number; right: number; top: number; bottom: number };
type Box = { x: number; y: number; width: number; height: number };

/** Closes the open popover; used by its panel after a choice. */
const PopoverCloseContext = createContext<() => void>(() => {});

// The action button and the counter of one object are separate instances. A
// vote reaches the others at once, without waiting for (or needing) the socket.
const voteListeners = new Map<string, Set<(next: ReactionState) => void>>();

function shareVote(channel: string, next: ReactionState) {
    voteListeners.get(channel)?.forEach((listener) => listener(next));
}

/** Screen readers name an emoji themselves; a picked one has no other title than "Reacted". */
function getSpokenName(name: string, getTitle: (name: string) => string): string {
    return emojiFromReactionCode(name) ?? getTitle(name);
}

function isPointInRect(x: number, y: number, rect: Rect | undefined, slop = 0) {
    if (!rect) return false;
    return x >= rect.left - slop && x <= rect.right + slop && y >= rect.top - slop && y <= rect.bottom + slop;
}

function ReactionPopover({
    children: panel,
    trigger,
    panelWidth,
    panelHeight,
    onPress,
    openOnPress = false,
    hoverOpen = true,
    hoverClose = true,
    disabled,
    haptics,
    children,
    childRefProp = 'ref',
}: {
    /** The panel: the reactions bar or the emoji picker. */
    children: ReactNode;
    /** The button that opens it. */
    trigger: React.ReactElement<any>;
    panelWidth: number;
    panelHeight: number;
    onPress?: (event?: any) => void;
    openOnPress?: boolean;
    hoverOpen?: boolean;
    hoverClose?: boolean;
    disabled?: boolean;
    haptics?: string;
    childRefProp?: string;
}) {
    const { t } = useTranslation();
    const { width: windowWidth, height: windowHeight } = useWindowSize();
    const [modalVisible, setModalVisible] = useState(false);
    // The button and the overlay in window coordinates. Native measures the
    // overlay once it is laid out, as it may not start at the window's top.
    const [anchor, setAnchor] = useState<Box | null>(null);
    const [nativeOverlay, setNativeOverlay] = useState<Box | null>(null);
    const buttonRef = useRef<any>(null);
    const panelRef = useRef<any>(null);
    const overlayRef = useRef<any>(null);
    const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const openedAt = useRef(0);

    const clearTimers = () => {
        if (openTimer.current) clearTimeout(openTimer.current);
        if (closeTimer.current) clearTimeout(closeTimer.current);
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
    const measureButton = (callback: (x: number, y: number, width: number, height: number) => void) => {
        const node = buttonRef.current;
        if (typeof node?.measureInWindow === 'function') return node.measureInWindow(callback);
        const rect = node?.getBoundingClientRect?.();
        if (rect) callback(rect.left, rect.top, rect.width, rect.height);
    };

    const openModal = () => {
        if (!buttonRef.current) return;

        measureButton((x, y, width, height) => {
            setAnchor({ x, y, width, height });
            setNativeOverlay(null);
            openedAt.current = Date.now();
            setModalVisible(true);
        });
    };

    const measureOverlay = () => {
        overlayRef.current?.measureInWindow?.((x: number, y: number, width: number, height: number) =>
            setNativeOverlay({ x, y, width, height })
        );
    };

    // Below the button when it fits, else above it (anchored by its bottom
    // edge, so the panel's real height doesn't matter), else at the top.
    const overlay = isWeb ? { x: 0, y: 0, width: windowWidth, height: windowHeight } : nativeOverlay;
    let panelStyle: { top?: number; bottom?: number; left: number } | null = null;
    if (anchor && overlay) {
        const buttonTop = anchor.y - overlay.y;
        const below = buttonTop + anchor.height + PANEL_GAP;
        const left = Math.max(
            SCREEN_PADDING,
            Math.min(
                anchor.x - overlay.x + anchor.width / 2 - panelWidth / 2,
                overlay.width - panelWidth - SCREEN_PADDING
            )
        );

        if (below + panelHeight <= overlay.height - SCREEN_PADDING) panelStyle = { top: below, left };
        else if (buttonTop - PANEL_GAP - panelHeight >= SCREEN_PADDING)
            panelStyle = { bottom: overlay.height - buttonTop + PANEL_GAP, left };
        else panelStyle = { top: SCREEN_PADDING, left };
    }

    const handlePress = (event?: any) => {
        clearTimers();
        if (openOnPress) openModal();
        else onPress?.(event);
    };

    const handleLongPress = () => {
        if (disabled) return;
        FeedbackHaptics(haptics);
        openModal();
    };

    // --- web hover (mouse only; touch opens the popover with a long press) ---

    const handlePointerEnter = (event: any) => {
        if (!hoverOpen || disabled || modalVisible || event.pointerType !== 'mouse') return;
        if (openTimer.current) clearTimeout(openTimer.current);
        openTimer.current = setTimeout(openModal, HOVER_OPEN_DELAY);
    };

    const handlePointerLeave = () => {
        if (openTimer.current) clearTimeout(openTimer.current);
        openTimer.current = null;
    };

    // The overlay covers the button while open, so hit-test manually: keep
    // the popover open while the pointer is over the button or the panel.
    const isOverTarget = (x: number, y: number) =>
        isPointInRect(x, y, panelRef.current?.getBoundingClientRect?.(), HOVER_SLOP) ||
        isPointInRect(x, y, buttonRef.current?.getBoundingClientRect?.(), HOVER_SLOP);

    const handleOverlayMouseMove = (event: any) => {
        if (!hoverClose) return;
        if (isOverTarget(event.clientX, event.clientY)) {
            if (closeTimer.current) clearTimeout(closeTimer.current);
            closeTimer.current = null;
        } else if (!closeTimer.current) {
            closeTimer.current = setTimeout(closeModal, HOVER_CLOSE_DELAY);
        }
    };

    const handleOverlayClick = (event: any) => {
        // The modal is a portal: keep clicks from reaching the message row.
        event.stopPropagation();
        if (Date.now() - openedAt.current < OPEN_CLICK_GUARD) return;
        const { clientX, clientY } = event;
        if (isPointInRect(clientX, clientY, panelRef.current?.getBoundingClientRect?.())) return;
        closeModal();
        // A click on the (covered) button still means its click action, as on Facebook.
        if (!openOnPress && isPointInRect(clientX, clientY, buttonRef.current?.getBoundingClientRect?.())) {
            onPress?.(event);
        }
    };

    // Web-only DOM handlers; the design View's type only knows React Native props.
    const overlayWebProps: Record<string, unknown> = {
        onMouseMove: handleOverlayMouseMove,
        onClick: handleOverlayClick,
    };
    const buttonWebProps: Record<string, unknown> = {
        onPointerEnter: handlePointerEnter,
        onPointerLeave: handlePointerLeave,
        // Long press on touch opens the popover, not the browser menu
        onContextMenu: (event: any) => event.preventDefault(),
    };

    const panelView = panelStyle ? (
        <View
            ref={panelRef}
            style={{ ...panelStyle, width: panelWidth, elevation: 5 }}
            className="absolute"
            // Native: taps on the panel's own background must not reach the overlay, which closes it.
            onStartShouldSetResponder={() => true}
        >
            <PopoverCloseContext.Provider value={closeModal}>{panel}</PopoverCloseContext.Provider>
        </View>
    ) : null;

    const modal = modalVisible ? (
        <ReactNativeModal
            presentationStyle="overFullScreen"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeModal}
        >
            {isWeb ? (
                <View className="flex-1 bg-transparent" {...overlayWebProps}>
                    <RemoveScroll>{panelView}</RemoveScroll>
                </View>
            ) : (
                // The backdrop is a sibling of the panel: wrapping the panel in a
                // touchable would merge its reactions into one accessibility element.
                <View
                    ref={overlayRef}
                    className="flex-1 bg-transparent"
                    accessibilityViewIsModal
                    onLayout={measureOverlay}
                >
                    <Pressable
                        className="absolute inset-0"
                        accessibilityRole="button"
                        accessibilityLabel={t('Close')}
                        onPress={closeModal}
                    />
                    {panelView}
                </View>
            )}
        </ReactNativeModal>
    ) : null;

    const button = React.cloneElement(trigger, {
        onPress: disabled ? undefined : handlePress,
        onLongPress: disabled ? undefined : handleLongPress,
        ...(isWeb ? {} : { [childRefProp]: buttonRef }),
    });

    if (isWeb) {
        return (
            <View ref={buttonRef} className="select-none" {...buttonWebProps}>
                {button}
                {modal}
            </View>
        );
    }

    return (
        <View>
            {button}
            {modal}
        </View>
    );
}

// ---------------------------------------------------------------------------
// Few mode: the reactions bar
// ---------------------------------------------------------------------------

const BAR_ITEM_WIDTH = 44;
const BAR_PADDING = 12;
const BAR_HEIGHT = 56;
const PICKER_WIDTH = 336;
const PICKER_HEIGHT = 380;

function ReactionBar({
    items,
    getIcon,
    mine,
    atLimit,
    note,
    onSelect,
}: {
    items: ReactionItem[];
    getIcon: (name: string) => string;
    mine: string[];
    atLimit: boolean;
    note?: string;
    onSelect: (name: string) => void;
}) {
    const close = useContext(PopoverCloseContext);

    return (
        <View className="items-center gap-1">
            <View className="flex-row rounded-full shadow-card-outline dark:shadow-card-outline-deep p-1 px-1.5 bg-popover items-center h-14">
                {items.map((item) => {
                    const icon = getIcon(item.name);
                    const chosen = mine.includes(item.name);
                    const disabled = atLimit && !chosen;
                    const content = (
                        <View
                            className={cn(
                                'w-11 h-11 items-center justify-center rounded-full',
                                chosen ? 'bg-accent' : 'web:hover:bg-muted/50 web:active:bg-muted web:hover:scale-110 web:duration-200',
                                disabled && 'opacity-40'
                            )}
                        >
                            {isEmoji(icon) ? (
                                <Text className="text-3xl">{icon}</Text>
                            ) : (
                                <View className="text-secondary-foreground">
                                    <Icon icon={icon} size={24} />
                                </View>
                            )}
                        </View>
                    );

                    return (
                        <TouchableOpacity
                            key={item.name}
                            disabled={disabled}
                            accessibilityRole="button"
                            accessibilityLabel={item.title}
                            accessibilityState={{ selected: chosen, disabled }}
                            // Web drops accessibilityState: say which reactions are chosen, as toggles.
                            {...(isWeb ? { 'aria-pressed': chosen, 'aria-disabled': disabled } : {})}
                            onPress={() => {
                                close();
                                onSelect(item.name);
                            }}
                        >
                            {isWeb ? <Tooltip content={item.title}>{content}</Tooltip> : content}
                        </TouchableOpacity>
                    );
                })}
            </View>
            {note ? (
                <View className="rounded-full bg-popover px-3 py-1 shadow-card-outline dark:shadow-card-outline-deep">
                    <Text className="text-xs text-muted-foreground">{note}</Text>
                </View>
            ) : null}
        </View>
    );
}

// ---------------------------------------------------------------------------
// Many mode: the emoji picker
// ---------------------------------------------------------------------------

function ReactionPicker({
    items,
    selected,
    atLimit,
    note,
    onSelect,
}: {
    items: ReactionItem[];
    selected: string[];
    atLimit: boolean;
    note?: string;
    onSelect: (emoji: string) => void;
}) {
    const close = useContext(PopoverCloseContext);

    return (
        <View className="rounded-2xl bg-popover p-2 shadow-card-outline dark:shadow-card-outline-deep">
            <EmojiPicker
                quick={items.filter((item) => !!item.emoji).map((item) => ({ emoji: item.emoji, title: item.title }))}
                selected={selected}
                isDisabled={() => atLimit}
                note={note}
                onSelect={(emoji: string) => {
                    close();
                    onSelect(emoji);
                }}
            />
        </View>
    );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function ElementReactions(props: ReactionsProps) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const playSound = useSound('success');

    const settings = appSetting('social_actions', 'reaction');
    const params = { ...settings, ...props.params };
    const action = props.action;
    const counter = props.counter;

    const key = objectKey(props.type, props.system, props.object_id);
    const channel = votedChannel(props.system, props.type, props.object_id);

    const settingsItems = settings[props.system]?.items ? settings[props.system].items : params.items;
    const iconset = settings[props.system]?.iconset ? settings[props.system].iconset : settings.iconset;

    const config = resolveConfig(props.options, settingsItems ?? [], params, iconset, t);
    const itemsByName: Record<string, ReactionItem> = {};
    config.items.forEach((item) => (itemsByName[item.name] = item));

    const flags = resolveDisplayFlags(params, props.displayType);
    const showAction = flags.showAction && !!action && !!action?.title;
    const showCounter = flags.showCounter && !!counter && !!counter?.items;
    const showBoth = showAction && showCounter;
    const showCombined = showBoth && params?.show_combined != undefined && params.show_combined === true;

    const buttonProps = buildButtonProps(props);

    const [state, setState] = useState<ReactionState>({});
    const [performedBy, setPerformedBy] = useState<Record<string, any[]>>();

    // compound: one modal + selected tab
    const [compoundPopupOpen, setCompoundPopupOpen] = useState(false);
    const [compoundTab, setCompoundTab] = useState('');

    // divided: modal per reaction
    const [dividedPopups, setDividedPopups] = useState<Record<string, boolean>>({});

    const allowViewVoted =
        settings[props.system]?.allow_view_voted != undefined ? settings[props.system].allow_view_voted : true;

    /** Lucide icon (web svg iconset) or an emoji. */
    const getIcon = (name: string): string => {
        const platform = isWeb ? 'web' : 'native';
        const set = iconset?.[platform]?.[name];
        if (set?.svg && params['icon_type_' + platform] === 'svg') return set.svg;
        if (itemsByName[name]?.emoji) return itemsByName[name].emoji;
        if (set?.emoji) return set.emoji;
        return emojiFromReactionCode(name) ?? iconset?.[platform]?.default?.emoji ?? '🙂';
    };

    const getTitle = (name: string): string => {
        if (itemsByName[name]?.title) return itemsByName[name].title;
        if (emojiFromReactionCode(name)) return t('Reacted');
        return t('rvote_' + name + '_title');
    };

    const object_params = {
        service: 'TemplVoteServices',
        system: props.system,
        objectId: props.object_id,
    };

    // --- the viewer's reactions ---

    const isVoted = state.is_voted ?? action?.is_voted === true;
    const isDisabled = state.is_disabled ?? action?.is_disabled === true;
    const canUndo = action?.is_undo === true;

    let mine: string[] = [];
    if (state.reactions) mine = state.reactions;
    else if (Array.isArray(action?.reactions)) mine = action.reactions;
    else if (isVoted && action?.reaction) mine = [action.reaction];
    if (!isVoted) mine = [];

    const shown = mine[mine.length - 1] ?? '';
    const atLimit = config.perUser > 1 && mine.length >= config.perUser;
    const limitNote = atLimit ? t('You can give up to {{count}} reactions', { count: config.perUser }) : undefined;

    // --- counters (live counts from the vote response / socket win) ---

    // Once a vote has brought a full counter, a missing reaction is at 0: UNA
    // leaves out picked emoji nobody has any more.
    const liveCount = (item: CounterItem): number =>
        Number(state.counter ? state.counter['count_' + item.name] : item.count) || 0;

    const counterItems: CounterItem[] = (() => {
        const base = (counter?.items ?? []).filter((item) => item?.name && item.name !== 'default');
        const names = new Set(base.map((item) => item.name));
        const extra = Object.keys(state.counter ?? {})
            .filter((k) => k.startsWith('count_'))
            .map((k) => k.slice(6))
            .filter((name) => name !== 'default' && !names.has(name))
            .map((name) => ({ name, count: Number(state.counter?.['count_' + name]) || 0 }));
        return [...base, ...extra];
    })();

    // --- do / undo a reaction ---

    const doReaction = (reaction: string) => {
        if (!reaction) return;
        const had = mine.includes(reaction);
        if (!had && atLimit) return;

        FeedbackHaptics(params.haptics_type);

        // Optimistic: the viewer's reactions and the counts.
        const replaced = !had && config.perUser === 1 ? mine : [];
        const next = had
            ? mine.filter((name) => name !== reaction)
            : config.perUser === 1
              ? [reaction]
              : [...mine, reaction];

        const counts: Record<string, number> = {};
        counterItems.forEach((item) => (counts['count_' + item.name] = liveCount(item)));
        const bump = (name: string, by: number) => {
            counts['count_' + name] = Math.max(0, (counts['count_' + name] ?? 0) + by);
        };
        bump(reaction, had ? -1 : 1);
        replaced.forEach((name) => bump(name, -1));

        const before = state;
        setState((prev) => ({
            ...prev,
            is_voted: next.length > 0,
            reactions: next,
            reaction: next[next.length - 1] ?? 'default',
            counter: { ...(prev.counter ?? {}), ...counts },
        }));

        objectRequest(object_params, 'do', { value: 1, reaction }, (data: any) => {
            if (!data || data.code) {
                setState(before);
                return;
            }
            // A backend without multiple reactions sends only `reaction`.
            const reactions = Array.isArray(data.reactions)
                ? data.reactions
                : data.is_voted && data.reaction
                  ? [data.reaction]
                  : [];
            shareVote(channel, { ...data, reactions });
        });
        playSound();
    };

    /** An emoji from the picker: the list's reaction for it, else its e_… code. */
    const doEmoji = (emoji: string) => {
        const listed = config.items.find((item) => item.emoji && emojiKey(item.emoji) === emojiKey(emoji));
        doReaction(listed ? listed.name : reactionCodeFromEmoji(emoji));
    };

    // --- who reacted (compound / divided) ---

    const openCompoundVoters = (event: any) => {
        event?.preventDefault?.();
        if (!allowViewVoted) return;
        FeedbackHaptics(params.haptics_type);

        objectRequest(object_params, 'get_performed_by', {}, (data: any) => {
            if (!data?.performed_by) return;
            setPerformedBy(data.performed_by);
            setCompoundTab('');
            setCompoundPopupOpen(true);
        });
    };

    const openDividedVoters = (reaction: string, event: any) => {
        event?.preventDefault?.();
        if (!allowViewVoted || !reaction) return;
        FeedbackHaptics(params.haptics_type);

        objectRequest(object_params, 'get_performed_by', { reaction }, (data: any) => {
            if (!data?.performed_by) return;
            setPerformedBy(data.performed_by);
            setDividedPopups((prev) => ({ ...prev, [reaction]: true }));
        });
    };

    useVotedSubscription({
        channel,
        currentUserId: currentUser ? currentUser.id : 0,
        onUpdate: (next: ReactionState) => setState((prev) => mergeState(prev, next)),
    });

    useEffect(() => {
        const listener = (next: ReactionState) => setState((prev) => mergeState(prev, next));
        const listeners = voteListeners.get(channel) ?? new Set();
        listeners.add(listener);
        voteListeners.set(channel, listeners);
        return () => {
            listeners.delete(listener);
            if (!listeners.size) voteListeners.delete(channel);
        };
    }, [channel]);

    // --- action button ---

    let actionButton: ReactNode = null;

    if (showAction) {
        const { showAsButton, showLabel } = resolveActionButtonFlags(params);
        const ActionButton = pickActionButton(showCombined, showAsButton);
        const hasDefault = !!config.defaultName;

        // What the button shows.
        let icon: string;
        let label: string;
        let spokenLabel: string | undefined;
        if (config.mode === 'solo' || (hasDefault && !shown)) {
            icon = getIcon(config.defaultName);
            label = getTitle(config.defaultName);
        } else if (hasDefault) {
            icon = getIcon(shown);
            label = getTitle(shown);
            // A picked emoji shows as "Reacted"; name the emoji too ("fox Reacted").
            const picked = emojiFromReactionCode(shown);
            if (picked) spokenLabel = picked + ' ' + label;
        } else {
            icon = SMILE_PLUS;
            label = t('React');
        }

        const pressed = config.mode === 'solo' ? mine.includes(config.defaultName) : isVoted;
        const disabled = isDisabled && !(isVoted && canUndo);

        // Click: give the default reaction, or take back the one the button shows.
        const onPress = () => {
            if (config.mode === 'solo') return doReaction(config.defaultName);
            if (isVoted && canUndo && shown) return doReaction(shown);
            return doReaction(config.defaultName);
        };

        const button = (
            <ActionButton
                key="action"
                startDecorator={icon}
                title={showLabel ? label : false}
                accessibilityLabel={spokenLabel ?? label}
                pressed={pressed}
                selectedState={pressed ? 'voted' : undefined}
                disabled={disabled}
                onPress={onPress}
                {...buttonProps}
            />
        );

        const withChoice = config.mode !== 'solo' && config.items.length > 0;
        const isMany = config.mode === 'many';

        actionButton = !withChoice ? (
            button
        ) : (
            <ReactionPopover
                key="action"
                onPress={onPress}
                // No default reaction: the button only opens the choice.
                openOnPress={!hasDefault}
                hoverOpen={hasDefault}
                // The picker has a search field; don't close it under the pointer.
                hoverClose={!isMany}
                disabled={disabled}
                haptics={params.haptics_type}
                childRefProp="forwardedRef"
                panelWidth={isMany ? PICKER_WIDTH : config.items.length * BAR_ITEM_WIDTH + BAR_PADDING}
                panelHeight={isMany ? PICKER_HEIGHT : BAR_HEIGHT + (limitNote ? 28 : 0)}
                trigger={button}
            >
                {isMany ? (
                    <ReactionPicker
                        items={config.items}
                        selected={mine.map((name) => itemsByName[name]?.emoji || emojiFromReactionCode(name) || '')}
                        atLimit={atLimit}
                        note={limitNote}
                        onSelect={doEmoji}
                    />
                ) : (
                    <ReactionBar
                        items={config.items}
                        getIcon={getIcon}
                        mine={mine}
                        atLimit={atLimit}
                        note={limitNote}
                        onSelect={doReaction}
                    />
                )}
            </ReactionPopover>
        );
    }

    // --- counter ---

    const counterStyle = config.split ? 'divided' : params?.show_counter_style || 'compound';
    let counterParts: [ReactNode[], ReactNode[]] | false = false;

    if (showCounter) {
        if (counterStyle === 'divided') {
            counterParts = buildCounterDivided({
                t,
                getIcon,
                getTitle,
                onOpenReaction: openDividedVoters,
                liveCount,
                items: counterItems,
                mine,
                performedBy,
                popupVisible: dividedPopups,
                setPopupVisible: setDividedPopups,
                showCombined,
                params,
                buttonProps,
            });
        } else {
            counterParts = buildCounterCompound({
                t,
                getIcon,
                getTitle,
                onOpen: openCompoundVoters,
                liveCount,
                items: counterItems,
                performedBy,
                popupVisible: compoundPopupOpen,
                setPopupVisible: setCompoundPopupOpen,
                selectedTab: compoundTab,
                setSelectedTab: setCompoundTab,
                showCombined,
                params,
                buttonProps,
            });
        }
    }

    // --- layout ---

    const hasCounterButtons = showCounter && !!counterParts && counterParts[0].length > 0;

    const combinedGroup: ReactNode[] = [];
    if (showAction) combinedGroup.push(actionButton);
    if (counterParts) counterParts[0].forEach((item) => combinedGroup.push(item));

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
            counterButton={counterParts ? counterParts[0] : undefined}
            counterPopup={counterParts ? counterParts[1] : undefined}
            combinedGroup={combinedGroup}
            extraPopups={null}
            emptyCheck={!((showAction && !!actionButton) || hasCounterButtons)}
        />
    );
}
