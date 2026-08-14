/**
 * Shared Host helpers for native NeoButtons.
 *
 * Expo UI `matchContents` is mount-only: flipping it after measure leaves the
 * Host in a broken layout (visible as jumps when a list recycles the row).
 * Cache the first measured size and apply it on the *next* mount instead.
 */

import React from 'react';
import { Pressable } from 'react-native';

const HOST_SIZE_CACHE = new Map();
const CACHE_LIMIT = 500;

export function useFrozenHostSize({ contentKey, rnOwnsWidth, rnOwnsHeight }) {
    const freezeWidth = !rnOwnsWidth;
    const freezeHeight = !rnOwnsHeight;
    const active = freezeWidth || freezeHeight;

    const onLayoutContent = React.useCallback((e) => {
        const { width, height } = e.nativeEvent;
        if (!width || !height || HOST_SIZE_CACHE.has(contentKey)) return;
        if (HOST_SIZE_CACHE.size >= CACHE_LIMIT) {
            HOST_SIZE_CACHE.delete(HOST_SIZE_CACHE.keys().next().value);
        }
        HOST_SIZE_CACHE.set(contentKey, { width, height });
    }, [contentKey]);

    if (!active) {
        return { style: null, onLayoutContent: undefined, pinnedWidth: false, pinnedHeight: false };
    }

    const pin = HOST_SIZE_CACHE.get(contentKey);
    const pinnedWidth = freezeWidth && !!pin;
    const pinnedHeight = freezeHeight && !!pin;

    return {
        style: pin
            ? {
                ...(pinnedWidth ? { width: pin.width } : null),
                ...(pinnedHeight ? { height: pin.height } : null),
            }
            : null,
        onLayoutContent: pin ? undefined : onLayoutContent,
        pinnedWidth,
        pinnedHeight,
    };
}

const FILL_STYLE = { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 };
const PRESS_LOCK_MS = 400;

/**
 * Host and the RN wrapper can both deliver the same tap. A toggle (composer
 * Plus) then opens and closes in one gesture.
 */
export function useLockedNativePress(handler) {
    const lock = React.useRef(0);
    return React.useCallback(() => {
        if (!handler) return;
        const now = Date.now();
        if (now - lock.current < PRESS_LOCK_MS) return;
        lock.current = now;
        handler();
    }, [handler]);
}

/**
 * Host is not an RN Pressable, so hitSlop / flex-grow / the actual tap must
 * live on a wrapper. `box-only` claims the hit — Host often drops SwiftUI
 * `onPress` (icon-only, keyboard). Pin height so the wrapper matches JS.
 * Fire on press-in so a keyboard layout jump cannot cancel the action.
 */
export function wrapNativeButtonHost(host, { hitSlop = 0, fill = false, onPress, disabled, height, width }) {
    const slop = hitSlop > 0
        ? { top: hitSlop, right: hitSlop, bottom: hitSlop, left: hitSlop }
        : undefined;
    if (!onPress && !slop && !fill) return host;

    return (
        <Pressable
            accessible={false}
            collapsable={false}
            onPressIn={disabled ? undefined : onPress}
            hitSlop={slop}
            pointerEvents="box-only"
            disabled={!!disabled}
            style={[
                fill ? FILL_STYLE : null,
                {
                    flexShrink: 0,
                    ...(height != null ? { height } : null),
                    ...(width != null ? { width } : null),
                },
            ]}
        >
            {host}
        </Pressable>
    );
}
