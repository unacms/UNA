/**
 * Shared Host helpers for native NeoButtons.
 *
 * Expo UI `matchContents` is mount-only: flipping it after measure leaves the
 * Host in a broken layout (visible as jumps when a list recycles the row).
 * Cache the first measured size and apply it on the *next* mount instead.
 */

import React from 'react';
import { Pressable, View } from 'react-native';

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

/**
 * Host is not an RN Pressable, so hitSlop must live on a wrapper.
 * `pointerEvents="box-none"` keeps presses on the chrome with the native
 * button; the wrapper only claims the slop. `accessible={false}` keeps a
 * single VoiceOver node. Fill width is the same wrapper — Host ignores flex-grow.
 */
export function wrapNativeButtonHost(host, { hitSlop = 0, fill = false, onPress, disabled }) {
    const slop = hitSlop > 0
        ? { top: hitSlop, right: hitSlop, bottom: hitSlop, left: hitSlop }
        : undefined;
    const fillStyle = fill ? FILL_STYLE : undefined;

    if (!slop && !fill) return host;

    if (slop && onPress && !disabled) {
        return (
            <Pressable
                accessible={false}
                collapsable={false}
                onPress={onPress}
                hitSlop={slop}
                pointerEvents="box-none"
                style={fillStyle}
            >
                {host}
            </Pressable>
        );
    }

    if (!fill) return host;

    return (
        <View collapsable={false} style={fillStyle}>
            {host}
        </View>
    );
}
