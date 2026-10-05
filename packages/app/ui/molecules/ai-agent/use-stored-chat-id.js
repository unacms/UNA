'use client';

import { useCallback, useEffect, useState } from 'react';
import { persistedGet, persistedSet } from 'app/lib/util/storage';
import { chatQueryId, isChatId } from './helper';

/**
 * Client-side conversation id so one person can have several transcripts with the
 * same agent. Not identity — UNA still keys the owner from the session cookie; this
 * only partitions history (`?chat=`).
 */
function chatNonce() {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID().replace(/-/g, '').slice(0, 32);
        }
    } catch {
        // Some locked-down contexts throw on crypto access. The fallback is fine here
        // because collisions only ever matter within one browser.
    }
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function storageKey(agentId, contextProfileId, userId) {
    return `ai-chat-id:${agentId}:${Number(contextProfileId) || 0}:${Number(userId) || 0}`;
}

/** Whatever was persisted, or '' when it is missing or malformed. */
function storedChatId(stored) {
    const id = chatQueryId(stored);
    return isChatId(id) ? id : '';
}

function initialState(mode, key) {
    return {
        key,
        mode,
        chatId: mode === 'fresh' ? chatNonce() : '',
        fresh: mode === 'fresh',
        ready: mode !== 'stored',
    };
}

/**
 * Which conversation the widget is on.
 *
 * @param {object} options
 * @param {string} options.agentId
 * @param {number} options.contextProfileId
 * @param {number} options.userId 0 for guests.
 * @param {'single'|'fresh'|'stored'} options.mode
 *   - `single`: one thread per agent, never partitioned — `chatId` is always ''.
 *   - `fresh`: a new nonce on every mount; nothing is read from storage
 *     (guest with `guest_new_session_on_reload`).
 *   - `stored`: the last thread used, from persisted storage (`allow_new`).
 * @returns {{
 *   chatId: string,
 *   fresh: boolean,   // the id was minted client-side, so there is provably no transcript
 *   ready: boolean,   // false while the stored id is still being read
 *   startNew: () => string, // mint, persist, and switch to a new id; returns it
 *   select: (chatId: string) => void, // switch to an existing id (history panel); persisted in `stored` mode
 * }}
 */
export function useStoredChatId({ agentId, contextProfileId, userId, mode }) {
    const key = storageKey(agentId, contextProfileId, userId);
    const [state, setState] = useState(() => initialState(mode, key));

    // State is tagged with the inputs it was built for. When they change under us
    // (another agent, the user logged in) reset on the spot — React's "adjust state
    // when a prop changes" pattern: it re-renders immediately, without an effect.
    if (state.key !== key || state.mode !== mode) {
        setState(initialState(mode, key));
    }

    // `ready` is only false in `stored` mode, until the persisted id has been read.
    useEffect(() => {
        if (state.ready) return undefined;
        let cancelled = false;
        persistedGet(key).then((stored) => {
            if (cancelled) return;
            setState({ key, mode, chatId: storedChatId(stored), fresh: false, ready: true });
        });
        return () => {
            cancelled = true;
        };
    }, [state.ready, key, mode]);

    const startNew = useCallback(() => {
        const next = chatNonce();
        setState({ key, mode, chatId: next, fresh: true, ready: true });
        if (mode === 'stored') void persistedSet(key, next);
        return next;
    }, [key, mode]);

    // An id that came from the server's history list, so there is a transcript to
    // load — hence `fresh: false`.
    const select = useCallback((next) => {
        const id = chatQueryId(next);
        if (!isChatId(id)) return;
        setState({ key, mode, chatId: id, fresh: false, ready: true });
        if (mode === 'stored') void persistedSet(key, id);
    }, [key, mode]);

    return { chatId: state.chatId, fresh: state.fresh, ready: state.ready, startNew, select };
}
