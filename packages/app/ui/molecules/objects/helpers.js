/**
 * Shared helpers for social-action molecules (likes, scores, reactions, …)
 * that operate on a CMS object: type + system + object_id.
 */

import { useEffect } from 'react';
import { fetcher } from 'app/lib/fetcher';
import { FeedbackHaptics } from 'app/lib/util';
import { subscribe } from 'app/ui/atoms/socket';
import Profile from 'app/ui/molecules/profile/profile';
import { View, Row } from 'app/design/view';
import {
    ButtonMenuActionDefault,
    ButtonMenuActionText,
    ButtonMenuCounterDefault,
    ButtonMenuCounterText,
    ButtonMenuGroupItem,
    ButtonsGroupMenu,
    Modal,
} from 'app/design/controls';

// ---------------------------------------------------------------------------
// Keys / state
// ---------------------------------------------------------------------------

/** Stable DOM/React key: type-system-objectId[-extra] */
export function objectKey(type, system, objectId, extra) {
    const parts = [type, system.replace(/_/g, '-'), objectId];
    if (extra) parts.push(extra);
    return parts.join('-');
}

export function mergeState(prev, next) {
    return !prev ? next : { ...prev, ...next };
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * UNA object request: /api.php?r=system/{action}/{service}&params[]={s,o,...}
 * @param {{ service: string, system: string, objectId: string|number }} object_params
 * @returns full fetcher response; onLoad gets response.data when provided
 */
export async function objectRequest(
    { service, system, objectId },
    action,
    params,
    onLoad
) {
    const body = { s: system, o: objectId, ...(params || {}) };
    const url =
        '/api.php?r=system/' +
        action +
        '/' +
        service +
        '&params[]=' +
        JSON.stringify(body);
    const response = await fetcher(url);
    if (typeof onLoad === 'function') onLoad(response?.data);
    return response;
}

// ---------------------------------------------------------------------------
// Display / button config
// ---------------------------------------------------------------------------

/**
 * Resolve show_action / show_counter / combined flags.
 * Matches legacy semantics: action defaults on; counter must be explicitly true.
 */
export function resolveDisplayFlags(params, displayType = 'both') {
    const type = displayType || 'both';

    const showAction =
        (params?.show_action == undefined || params.show_action === true) &&
        (type == 'action' || type == 'both');

    const showCounter =
        params?.show_counter != undefined &&
        params.show_counter === true &&
        (type == 'counter' || type == 'both');

    const showBoth = showAction && showCounter;
    const showCombined =
        showBoth &&
        params?.show_combined != undefined &&
        params.show_combined === true;

    return { showAction, showCounter, showBoth, showCombined };
}

/** Button menu props from molecule props (+ legacy paramsi typo fallback). */
export function buildButtonProps(props) {
    return {
        variant: props?.primary ? 'primary' : props.params?.button_variant,
        size: props.params?.button_size,
        rounded: props.params?.button_rounded,
        fullWidth: props.params?.button_full_width,
        showTitleFromSize:
            props.paramsi?.button_show_title_from_size ||
            props.params?.button_show_title_from_size,
        ring: props.params?.button_ring,
    };
}

export function pickActionButton(showCombined, showAsButton) {
    if (showCombined) return ButtonMenuGroupItem;
    return showAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;
}

export function pickCounterButton(showCombined, showAsButton) {
    if (showCombined) return ButtonMenuGroupItem;
    return showAsButton ? ButtonMenuCounterDefault : ButtonMenuCounterText;
}

export function resolveActionButtonFlags(params) {
    const showAsButton =
        params?.show_action_as_button == undefined ||
        params.show_action_as_button === true;
    const showLabel =
        params?.show_action_label == undefined ||
        params.show_action_label === true;
    return { showAsButton, showLabel };
}

export function resolveCounterAsButton(params) {
    return (
        params?.show_counter_as_button != undefined &&
        params.show_counter_as_button === true
    );
}

// ---------------------------------------------------------------------------
// Socket
// ---------------------------------------------------------------------------

export function votedChannel(system, type, objectId) {
    return system + '_' + type + '_' + objectId;
}

export function scoresVotedChannel(system, objectId) {
    return system + '_scores_' + objectId;
}

/**
 * Subscribe to `voted` on mount (empty deps — same as legacy molecules).
 * Splits payload: full api for current user, else { counter } only.
 */
export function useVotedSubscription({ channel, currentUserId, onUpdate }) {
    useEffect(() => {
        const unsubscribe = subscribe(channel, 'voted', (raw) => {
            const payload = JSON.parse(raw);
            if (!payload?.api) return;
            const next =
                payload.api.performer_id == currentUserId
                    ? payload.api
                    : { counter: payload.api.counter };
            onUpdate(next);
        });
        return unsubscribe;
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
    }, []);
}

// ---------------------------------------------------------------------------
// "Who …" list UI
// ---------------------------------------------------------------------------

export function PerformedBySkeleton({ className = 'gap-y-2' } = {}) {
    return (
        <View className={className}>
            {[1, 2, 3].map((i) => (
                <View key={i} className="flex-col p-2 bg-muted  sm:rounded-lg">
                    <View className="animate-pulse flex-row items-center gap-3">
                        <View className="rounded-full bg-secondary-foreground/20 h-10 w-10" />
                        <View className="flex-1 gap-y-1">
                            <View className="h-4 w-1/2 bg-secondary-foreground/20 rounded-full" />
                            <View className="h-3 w-1/3 bg-secondary-foreground/20 rounded-full" />
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
}

/**
 * Simple profile list (likes / reactions).
 * @param {{ asRow?: boolean, wrap?: boolean }} options
 *   asRow — wrap each Profile in Row (compound reactions)
 *   wrap  — wrap list in View gap-2 (divided reactions / likes omit when false)
 */
export function profileUsersList(users, { asRow = false, wrap = false } = {}) {
    if (!users?.length) {
        return (
            <PerformedBySkeleton className={wrap ? 'gap-2' : 'gap-y-2'} />
        );
    }

    const list = users.map((user) =>
        asRow ? (
            <Row key={user.id}>
                <Profile {...user} />
            </Row>
        ) : (
            <View key={user.id}>
                <Profile {...user} />
            </View>
        )
    );

    if (!wrap) return list;
    return <View className="gap-2">{list}</View>;
}

/**
 * Fetch "performed by" list and open popup.
 * Shared by likes / scores / favorites / stars.
 */
export function openPerformedBy({
    event,
    object_params,
    allowed = true,
    hapticsType,
    setPerformedBy,
    setPopupVisible,
    extraParams,
}) {
    if (event) event.preventDefault();
    if (!allowed) return;
    if (hapticsType) FeedbackHaptics(hapticsType);

    objectRequest(object_params, 'get_performed_by', extraParams ?? {}, (data) => {
        if (!data?.performed_by) return;
        setPerformedBy(data.performed_by);
        setPopupVisible(true);
    });
}

// ---------------------------------------------------------------------------
// Shared layout for action menu items
// ---------------------------------------------------------------------------

/**
 * Unified layout for social-action menu items (likes, stars, favorites,
 * scores, reactions, features).
 *
 * combined mode  → ButtonsGroupMenu + popups below
 * separate mode  → flex-row with action / counter / popup slots
 *
 * All visual classes live here so styling the menu is one-file work.
 */
export function ActionMenuLayout({
    combined,
    buttonProps,
    itemKey,
    showAction,
    showCounter,
    showBoth,
    params,
    actionSlots = [],
    counterButton,
    counterPopup,
    combinedGroup,
    extraPopups,
    emptyCheck,
}) {
    if (combined) {
        return (
            <View>
                <ButtonsGroupMenu {...buttonProps}>
                    {combinedGroup}
                </ButtonsGroupMenu>
                {extraPopups}
                {counterPopup}
            </View>
        );
    }

    if (emptyCheck) return null;

    const noGap = params?.no_gap_between_buttons === true;
    const rowClass =
        'flex-auto flex-row items-center text-center' +
        (noGap ? (params?.button_full_width ? ' ' : ' me-3') : '');

    const counterSlot = showCounter && !!counterButton ? (
        <View
            key={itemKey + '-counter-button'}
            className={
                (params?.counter_flex ?? '') +
                (params?.counter_button_class
                    ? ' ' + params.counter_button_class
                    : '')
            }
        >
            {counterButton}
        </View>
    ) : null;

    const renderSlot = (slot, i) =>
        showAction && !!slot.element ? (
            <View
                key={slot.key || itemKey + '-action-' + i}
                className={
                    'flex-auto' +
                    (slot.marginClass ?? (showBoth ? ' me-2' : ''))
                }
            >
                {slot.element}
            </View>
        ) : null;

    // slots: [action0, 'counter', action1] or [action0] + counter after
    const hasCounterInSlots = actionSlots.some((s) => s === 'counter');
    const body = hasCounterInSlots
        ? actionSlots.map((slot, i) =>
              slot === 'counter' ? counterSlot : renderSlot(slot, i)
          )
        : [
              ...actionSlots.map(renderSlot),
              counterSlot,
          ];

    return (
        <View className={rowClass}>
            {body}
            {extraPopups}
            {showCounter && !!counterPopup ? (
                <View key={itemKey + '-counter-popup'}>{counterPopup}</View>
            ) : null}
        </View>
    );
}

/**
 * "Who …" popup shell shared by likes / scores / favorites / stars / reactions.
 * Pass `children` for custom list (e.g. scores voters), or `users` for profileUsersList.
 */
export function PerformedByModal({
    title,
    visible,
    onClose,
    children,
    users,
    listOptions,
    modalKey,
}) {
    const body =
        children ??
        profileUsersList(users, listOptions ?? { asRow: false, wrap: false });

    return (
        <Modal
            key={modalKey}
            title={title}
            onVisible={visible}
            onClose={onClose}
        >
            <View className="p-2 gap-y-4 overflow-y-auto text-muted-foreground ">
                {body}
            </View>
        </Modal>
    );
}
