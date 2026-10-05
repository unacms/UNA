'use client';

import { useCallback, useEffect, useRef } from 'react';

/** How close to the bottom still counts as "pinned" (px). */
const NEAR_BOTTOM_PX = 48;

/**
 * A programmatic scroll fires the same `onScroll` as a user gesture, so pin
 * detection has to ignore events for a moment after we scroll ourselves.
 *
 * This is a deadline rather than a boolean flag on purpose: a flag that is raised
 * before an rAF and lowered inside it stays raised forever if the frame is skipped
 * or the call bails out early, and the list then stops tracking the user's scroll
 * entirely. A timestamp cannot get stuck.
 */
const SELF_SCROLL_QUIET_MS = 120;

/** True when the list is scrolled (nearly) to the bottom. Works for DOM and RN events. */
function isNearBottom(node, nativeEvent) {
    if (node && typeof node.scrollTop === 'number' && typeof node.scrollHeight === 'number') {
        return node.scrollHeight - node.scrollTop - node.clientHeight <= NEAR_BOTTOM_PX;
    }
    const size = nativeEvent?.contentSize;
    const offset = nativeEvent?.contentOffset;
    const layout = nativeEvent?.layoutMeasurement;
    // No measurements to go on (first event, or a platform that omits them): assume
    // pinned, so a fresh chat keeps following the stream instead of freezing at the top.
    if (!size || !offset || !layout) return true;
    return size.height - offset.y - layout.height <= NEAR_BOTTOM_PX;
}

/** Scroll to the bottom across RN ScrollView, DOM element and DOM-ish refs. */
function scrollChatToEnd(node) {
    if (!node) return;
    if (typeof node.scrollToEnd === 'function') {
        node.scrollToEnd({ animated: false });
        return;
    }
    const top = node.scrollHeight ?? 0;
    if (typeof node.scrollTo === 'function') {
        node.scrollTo({ top, behavior: 'auto' });
        return;
    }
    if (typeof node.scrollTop === 'number') {
        node.scrollTop = top;
    }
}

/**
 * Keeps a chat list pinned to the bottom while new content streams in, but stops
 * following as soon as the user scrolls up to read back.
 *
 * Returns the ref to attach to the list, the `onScroll` handler, and two commands:
 * `scrollToEnd()` (scroll now) and `pinToBottom()` (re-arm following before a send,
 * so the user's own message always pulls the view down even if they had scrolled up).
 */
export function useChatAutoscroll() {
    const listRef = useRef(null);
    const pinnedRef = useRef(true);
    const quietUntilRef = useRef(0);
    const rafRef = useRef(0);

    useEffect(() => () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }, []);

    const scrollToEnd = useCallback(() => {
        quietUntilRef.current = Date.now() + SELF_SCROLL_QUIET_MS;
        scrollChatToEnd(listRef.current);
        pinnedRef.current = true;
        // Second pass on the next frame: the bubble that triggered this may still be
        // growing (streamed text, images, wrapped lines), so the height we just
        // scrolled to is already stale.
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = 0;
            quietUntilRef.current = Date.now() + SELF_SCROLL_QUIET_MS;
            scrollChatToEnd(listRef.current);
        });
    }, []);

    const pinToBottom = useCallback(() => {
        pinnedRef.current = true;
    }, []);

    const onScroll = useCallback((event) => {
        if (Date.now() < quietUntilRef.current) return;
        pinnedRef.current = isNearBottom(listRef.current, event?.nativeEvent);
    }, []);

    /** Call from a layout effect whenever content changed; no-op while unpinned. */
    const followIfPinned = useCallback(() => {
        if (!pinnedRef.current) return;
        scrollToEnd();
    }, [scrollToEnd]);

    return { listRef, onScroll, scrollToEnd, pinToBottom, followIfPinned };
}
