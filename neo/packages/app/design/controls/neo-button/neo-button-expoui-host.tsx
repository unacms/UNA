/**
 * Shared Host helpers for native NeoButtons.
 *
 * Expo UI `matchContents` is mount-only: flipping it after measure leaves the
 * Host in a broken layout (visible as jumps when a list recycles the row).
 * Cache the first measured size and apply it on the *next* mount instead.
 */

import React, { type ReactElement } from 'react';
import { Pressable, StyleSheet, View, type Insets, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type HostSize = { width: number; height: number };

const HOST_SIZE_CACHE = new Map<string, HostSize>();
const CACHE_LIMIT = 500;

export function useFrozenHostSize({ contentKey, rnOwnsWidth, rnOwnsHeight }: {
    contentKey: string;
    rnOwnsWidth: boolean;
    rnOwnsHeight: boolean;
}) {
    const freezeWidth = !rnOwnsWidth;
    const freezeHeight = !rnOwnsHeight;
    const active = freezeWidth || freezeHeight;
    // Never pin width. The same label ("Manage") is reused on other screens;
    // a stale or leftover-ScrollView measure left a hole before the next tab.
    // Keep matchContents on so the capsule always hugs the title.
    const pin = freezeHeight ? HOST_SIZE_CACHE.get(contentKey) : null;

    const onLayoutContent = React.useCallback((e: { nativeEvent: HostSize }) => {
        const { width, height } = e.nativeEvent;
        if (!freezeHeight || !width || !height || HOST_SIZE_CACHE.has(contentKey)) return;
        if (HOST_SIZE_CACHE.size >= CACHE_LIMIT) {
            HOST_SIZE_CACHE.delete(HOST_SIZE_CACHE.keys().next().value!);
        }
        HOST_SIZE_CACHE.set(contentKey, { width, height });
    }, [contentKey, freezeHeight]);

    if (!active) {
        return {
            style: null,
            onLayoutContent: undefined,
            pinnedWidth: false,
            pinnedHeight: false,
        };
    }

    const pinnedHeight = freezeHeight && !!pin;

    return {
        style: pinnedHeight ? { height: pin!.height } : null,
        onLayoutContent: freezeHeight ? onLayoutContent : undefined,
        pinnedWidth: false,
        pinnedHeight,
    };
}

const FILL_STYLE = { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 };
const AUTO_STYLE = { flexGrow: 0, flexShrink: 0, alignSelf: 'flex-start' as const };
const PRESS_LOCK_MS = 400;
// A touch whose end never reached the wrapper (its target unmounted) stops
// blocking the Host's own press after this long.
const TOUCH_STALE_MS = 10000;
// Pressability measures the press rect once, when JS handles touch-down, and
// never again. If the layout already moved by then (keyboard closing, busy JS
// thread), the rect is off by the jump and the first move of a drifting finger
// leaves the default 20–30pt retention, so the release is dropped.
// Keep the release valid across a keyboard-height jump; a scroll still cancels,
// since the scroll view takes the responder (RESPONDER_TERMINATED), not the rect.
const PRESS_RETENTION_OFFSET = { top: 400, bottom: 400, left: 20, right: 20 };

export type NativeTouchHandlers = Pick<PressableProps, 'onTouchStart' | 'onTouchEnd' | 'onTouchCancel'>;

/**
 * Press handlers for a native button. A touch reaches both the SwiftUI /
 * Compose button (which draws its pressed state) and the RN wrapper, and only
 * the wrapper acts on it: `press` goes on the wrapper, so hitSlop, release
 * timing, scroll cancel and keyboard-jump retention all hold. The Host's own
 * press (`hostPress`) is dropped while the wrapper sees a touch and shortly
 * after, so a touch the wrapper cancelled (scroll, keyboard-dismissing tap)
 * cannot fire from the native side. It counts only when no touch came first:
 * VoiceOver, TalkBack, Switch Control, a hardware keyboard.
 * The lock keeps both from firing for one tap, which would open and close a
 * toggle (composer Plus) in one gesture.
 */
export function useNativeButtonPress(handler: (() => void) | undefined) {
    const lock = React.useRef(0);
    const touch = React.useRef({ down: false, at: 0 });

    const press = React.useCallback(() => {
        if (!handler) return;
        const now = Date.now();
        if (now - lock.current < PRESS_LOCK_MS) return;
        lock.current = now;
        handler();
    }, [handler]);

    const hostPress = React.useCallback(() => {
        const { down, at } = touch.current;
        if (Date.now() - at < (down ? TOUCH_STALE_MS : PRESS_LOCK_MS)) return;
        press();
    }, [press]);

    const touchHandlers = React.useMemo<NativeTouchHandlers>(() => {
        const end = () => { touch.current = { down: false, at: Date.now() }; };
        return {
            onTouchStart: () => { touch.current = { down: true, at: Date.now() }; },
            onTouchEnd: end,
            onTouchCancel: end,
        };
    }, []);

    return { press, hostPress, touchHandlers };
}

/** Hit area per side: a number for all sides, or insets; `undefined` when nothing extends. */
export type NativeHitSlop = number | Insets | undefined;

function toInsets(hitSlop: NativeHitSlop): Insets | undefined {
    if (typeof hitSlop === 'number') {
        return hitSlop > 0 ? { top: hitSlop, right: hitSlop, bottom: hitSlop, left: hitSlop } : undefined;
    }
    if (!hitSlop) return undefined;
    const { top = 0, right = 0, bottom = 0, left = 0 } = hitSlop;
    return top || right || bottom || left ? { top, right, bottom, left } : undefined;
}

const hasStyle = (style: StyleProp<ViewStyle>) => {
    const flat = StyleSheet.flatten(style);
    return !!flat && Object.keys(flat).length > 0;
};

/**
 * Host is not an RN Pressable, so hitSlop / flex-grow / the actual tap must
 * live on a wrapper: Host often drops SwiftUI `onPress` (icon-only, keyboard).
 * Pin height so the wrapper matches JS. `onPress` fires on release, like the
 * JS NeoButton, so a scroll that starts on the button cancels it. `onPressIn`
 * (touch-down) is the opt-in for a caller that must act before the keyboard
 * or layout moves.
 *
 * The wrapper doesn't claim the hit (`box-only`): inside the Host the touch
 * goes to the SwiftUI / Compose button, which draws its own pressed state,
 * and RN's root touch handler still hands it to the wrapper, which presses.
 * A touch in the hitSlop band lands on the wrapper alone. `touchHandlers`
 * (`useNativeButtonPress`) tell the Host which touches the wrapper owns.
 * Disabled claims the hit again, so a faded button shows no press.
 *
 * The wrapper is the outermost box, so `rootStyle` (`classNames.root`) goes
 * here and wins over the default flex sizing (self-*, flex-*, margins reach
 * the parent's layout). A passive button (no handler) gets a plain View so
 * the parent still receives the touch. `accessibilityRole` (NeoButtonLink:
 * `link`) makes the wrapper the accessibility element.
 */
export function wrapNativeButtonHost(host: ReactElement, {
    hitSlop = 0, fill = false, onPress, onPressIn, touchHandlers, disabled, height, width, rootStyle, accessibilityRole, accessibilityLabel,
}: {
    hitSlop?: NativeHitSlop;
    fill?: boolean;
    onPress?: () => void;
    onPressIn?: () => void;
    touchHandlers?: NativeTouchHandlers;
    disabled?: boolean;
    height?: number | null;
    width?: number | null;
    rootStyle?: StyleProp<ViewStyle>;
    accessibilityRole?: string;
    accessibilityLabel?: string;
}) {
    const slop = toInsets(hitSlop);
    const withRoot = hasStyle(rootStyle);
    const pressable = !!(onPress || onPressIn);
    if (!pressable && !slop && !fill && !withRoot && !accessibilityRole) return host;

    const style = [
        fill ? FILL_STYLE : AUTO_STYLE,
        {
            ...(height != null ? { height } : null),
            ...(width != null ? { width } : null),
        },
        rootStyle,
    ];
    const a11y = accessibilityRole
        ? { accessible: true, role: accessibilityRole as any, accessibilityLabel }
        : { accessible: false };

    if (!pressable) {
        return (
            <View {...a11y} collapsable={false} style={style}>
                {host}
            </View>
        );
    }

    return (
        <Pressable
            {...a11y}
            {...touchHandlers}
            collapsable={false}
            onPress={disabled ? undefined : onPress}
            onPressIn={disabled ? undefined : onPressIn}
            hitSlop={slop}
            pressRetentionOffset={PRESS_RETENTION_OFFSET}
            pointerEvents={disabled ? 'box-only' : 'auto'}
            disabled={!!disabled}
            style={style}
        >
            {host}
        </Pressable>
    );
}
