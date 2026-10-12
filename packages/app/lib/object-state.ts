import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

/**
 * Latest known state of social objects (likes, reactions, comments, reports, ...)
 * and of comment previews, shared by every widget that shows the same object.
 *
 * A widget used to keep the result of its own action or of a socket event in
 * local state, so the change was lost when the widget unmounted: lists keep
 * their data in caches (TanStack, Next router, native page cache), and a list
 * mounted again from a cache showed the object as it was when the list loaded.
 * Here the change outlives the widget, and every copy of the object (the same
 * post in two feeds, the action and the counter halves of one menu) shows it.
 *
 * Which is newer, the props or the shared state, is decided by `ts`: the server
 * time (seconds, float) UNA puts in object data, action responses and socket
 * events. Props win only when their `ts` is newer; without `ts` (an older UNA)
 * the shared state wins. Values from UNA are absolute, never local increments,
 * so the next action or event always brings an object up to date.
 *
 * Next server: one module instance serves every visitor, so nothing is stored
 * there and server renders read props only.
 */

type Entry = {
    /** Object data from a reload, shaped like the widget props. */
    props?: any;
    /** Widget state after an action or a socket event (wins over `props`). */
    state?: any;
    /** Server time of the data. */
    ts?: number;
};

const MAX_ENTRIES = 500;

const entries = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();

const isServer = Platform.OS === 'web' && typeof window === 'undefined';

/** Server time of object data (`ts` from UNA), or undefined. */
export function objectTs(data: any): number | undefined {
    const ts = Number(data?.ts);
    return Number.isFinite(ts) && ts > 0 ? ts : undefined;
}

/** True when `ts` is known to be newer than the entry. */
function isNewer(ts: number | undefined, entry: Entry | undefined) {
    return ts !== undefined && entry?.ts !== undefined && ts > entry.ts;
}

function notify(key: string) {
    listeners.get(key)?.forEach((listener) => listener());
}

function put(key: string, entry: Entry) {
    if (isServer || !key) return;
    // Re-insert so Map order is least recently written first.
    entries.delete(key);
    entries.set(key, entry);
    while (entries.size > MAX_ENTRIES) {
        const oldest = entries.keys().next().value as string;
        entries.delete(oldest);
        notify(oldest);
    }
    notify(key);
}

function subscribeKey(key: string, listener: () => void) {
    let set = listeners.get(key);
    if (!set) {
        set = new Set();
        listeners.set(key, set);
    }
    set.add(listener);
    return () => {
        set.delete(listener);
        if (set.size === 0) listeners.delete(key);
    };
}

/** Key of a social object: `type-system-objectId`, as `objectKey` in molecules/objects. */
export function socialObjectKey(type: string, system: string, objectId: string | number) {
    return [type, String(system).replace(/_/g, '-'), objectId].join('-');
}

/** Key of a comments preview (`cmts` of a timeline item). */
export function commentsObjectKey(module: string, objectId: string | number) {
    return 'cmts-' + module + '-' + objectId;
}

/** Key of a node in an API response, or null when it isn't an object we track. */
function nodeKey(node: any): string | null {
    if (node.object_id == null || node.object_id === '') return null;
    if (node.unit === 'comments' && typeof node.module === 'string') {
        return commentsObjectKey(node.module, node.object_id);
    }
    if (typeof node.type === 'string' && typeof node.system === 'string' && node.system) {
        return socialObjectKey(node.type, node.system, node.object_id);
    }
    return null;
}

/**
 * Share the objects of a response that was loaded because it changed (a feed
 * item reloaded after a socket `edited`), so the change outlives the card.
 */
export function storeObjectsFrom(data: unknown) {
    if (isServer) return;
    const stack: unknown[] = [data];
    while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== 'object') continue;
        if (Array.isArray(node)) {
            for (const child of node) stack.push(child);
            continue;
        }
        const key = nodeKey(node);
        if (key) {
            const ts = objectTs(node);
            const entry = entries.get(key);
            if (!entry || isNewer(ts, entry) || ts === undefined) put(key, { props: node, ts });
        }
        for (const name in node) {
            const child = (node as Record<string, unknown>)[name];
            if (child && typeof child === 'object') stack.push(child);
        }
    }
}

/** Drop everything (logout, profile switch). */
export function clearObjectState() {
    const keys = [...entries.keys()];
    entries.clear();
    keys.forEach(notify);
}

const noopUnsubscribe = () => {};
const emptySnapshot = (): Entry | undefined => undefined;

type SetState<T> = (next: T | ((prev: T) => T)) => void;

/**
 * `useState` for a widget's server-side state, shared under `key`. `init` builds
 * the state from props and should keep their `ts`; responses merged into the
 * state bring their own `ts`. Without a key the state stays in the component.
 */
export function useObjectState<T>(key: string | null | undefined, props: any, init: (props: any) => T): [T, SetState<T>] {
    const shared = !!key && !isServer;
    const subscribe = useCallback(
        (listener: () => void) => (shared ? subscribeKey(key as string, listener) : noopUnsubscribe),
        [shared, key]
    );
    const getSnapshot = useCallback(() => (shared ? entries.get(key as string) : undefined), [shared, key]);
    const entry = useSyncExternalStore(subscribe, getSnapshot, emptySnapshot);
    const [local, setLocal] = useState<{ value: T } | null>(null);

    const propsTs = objectTs(props);
    const propsNewer = isNewer(propsTs, entry);
    const current = propsNewer ? undefined : entry;

    let value: T;
    if (!shared && local) value = local.value;
    else if (current?.state !== undefined) value = current.state as T;
    else value = init(current?.props ?? props);

    // Props newer than the shared state (a reloaded list): share them, so older
    // copies of the object catch up too.
    useEffect(() => {
        if (shared && propsNewer) put(key as string, { props, ts: propsTs });
    }, [shared, key, propsNewer, props, propsTs]);

    const setValue = useCallback<SetState<T>>(
        (next) => {
            const apply = (prev: T) => (typeof next === 'function' ? (next as (prev: T) => T)(prev) : next);
            if (shared) {
                // Read the store, not the render: socket callbacks are bound once on mount.
                const stored = entries.get(key as string);
                const base = isNewer(propsTs, stored) ? undefined : stored;
                const prev = base?.state !== undefined ? (base.state as T) : init(base?.props ?? props);
                const state = apply(prev);
                put(key as string, { state, ts: objectTs(state) ?? base?.ts ?? propsTs });
            } else {
                setLocal((prev) => ({ value: apply(prev ? prev.value : init(props)) }));
            }
        },
        [shared, key, init, props, propsTs]
    );

    return [value, setValue];
}
