/**
 * Offline reading: what was read last (the account, the feeds' first pages, posts, profiles,
 * notifications, conversations, groups) is kept in IndexedDB, one entry per network (the
 * session's key, `site|account`), and comes back at the next start before anything is asked
 * of the site, so with the network down the app opens on the Home feed it had. The entry of
 * one network is never read for another, and signing out deletes it. React Query's own
 * dehydrate and hydrate do the work; saving waits a second after the last change.
 */
import { type DehydratedState, dehydrate, hydrate, type Query, type QueryClient } from '@tanstack/react-query';

/** Saved data older than this is not brought back. */
export const CACHE_MAX_AGE_MS = 7 * 24 * 3600 * 1000;
/** Pages of a feed or list kept: the first ones, what opens first. */
const MAX_PAGES = 2;
/** Saved by another version of the app: not brought back (the shapes may differ). */
export const CACHE_VERSION = 1;

/** The first part of the query keys worth keeping; drafts, uploads and the like are not queries. */
const KEPT = new Set([
    'me',
    'feed',
    'activity',
    'profile',
    'profile-summary',
    'connections',
    'notifications',
    'conversations',
    'conversation',
    'discussions',
    'discussion',
    'posts',
    'article',
    'videos',
    'video',
    'photos',
    'photo',
    'albums',
    'album',
    'album-items',
    'files',
    'file',
    'messages',
    'my-groups',
    'my-spaces',
    // the sidebar as the site sets it up (GET /navigation): shown at once at the next start
    'navigation',
    'group',
    'site-modules',
    'comments',
    'replies',
]);

/** Where it is kept: one value per key. */
export interface KeyValueStore {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
    delete(key: string): Promise<void>;
}

type Saved = { version: number; savedAt: number; state: DehydratedState };

export function cacheKey(sessionKey: string): string {
    return `cache:${sessionKey}`;
}

/** Whether a query is kept: a success of a kind worth reading again offline. */
export function isKept(query: Pick<Query, 'queryKey' | 'state'>): boolean {
    const first = query.queryKey[0];
    return query.state.status === 'success' && typeof first === 'string' && KEPT.has(first) && query.state.data !== undefined;
}

/** An infinite list's first pages only. */
function trimPages(data: unknown): unknown {
    if (!data || typeof data !== 'object' || !('pages' in data) || !('pageParams' in data)) return data;
    const d = data as { pages: unknown[]; pageParams: unknown[] };
    if (!Array.isArray(d.pages) || d.pages.length <= MAX_PAGES) return data;
    return { pages: d.pages.slice(0, MAX_PAGES), pageParams: d.pageParams.slice(0, MAX_PAGES) };
}

/** What would be saved of a client now. */
export function snapshot(client: QueryClient, now = Date.now()): Saved {
    const state = dehydrate(client, { shouldDehydrateQuery: isKept, shouldDehydrateMutation: () => false });
    return {
        version: CACHE_VERSION,
        savedAt: now,
        state: { ...state, queries: state.queries.map((q) => ({ ...q, state: { ...q.state, data: trimPages(q.state.data) } })) },
    };
}

function isSaved(v: unknown): v is Saved {
    return !!v && typeof v === 'object' && (v as Saved).version === CACHE_VERSION && typeof (v as Saved).savedAt === 'number' && Array.isArray((v as Saved).state?.queries);
}

/**
 * Bring back what a network had: true when there was something. Saved data that is too old or
 * of another version is deleted instead.
 */
export async function restoreCache(client: QueryClient, store: KeyValueStore, sessionKey: string, now = Date.now()): Promise<boolean> {
    const key = cacheKey(sessionKey);
    let saved: unknown;
    try {
        saved = await store.get(key);
    } catch (e) {
        console.error('restore cache', e);
        return false;
    }
    if (!isSaved(saved) || now - saved.savedAt > CACHE_MAX_AGE_MS) {
        if (saved !== undefined) await store.delete(key).catch(() => undefined);
        return false;
    }
    hydrate(client, saved.state);
    return saved.state.queries.length > 0;
}

export type CachePersister = {
    /** Save now what is waiting to be saved. */
    flush: () => Promise<void>;
    /** Save nothing more (signing out, switching): what is saved stays until removeCache. */
    stop: () => void;
};

/** Keep saving a network's queries as they change, a second after the last change. */
export function persistCache(client: QueryClient, store: KeyValueStore, sessionKey: string, waitMs = 1000): CachePersister {
    const key = cacheKey(sessionKey);
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    const save = async () => {
        timer = null;
        if (stopped) return;
        try {
            await store.set(key, snapshot(client));
        } catch (e) {
            console.error('save cache', e);
        }
    };
    const unsubscribe = client.getQueryCache().subscribe((event) => {
        if (stopped || (event.type !== 'updated' && event.type !== 'removed' && event.type !== 'added')) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => void save(), waitMs);
    });
    return {
        flush: async () => {
            if (timer) clearTimeout(timer);
            await save();
        },
        stop: () => {
            stopped = true;
            if (timer) clearTimeout(timer);
            timer = null;
            unsubscribe();
        },
    };
}

/** Delete what a network had saved (sign-out). */
export async function removeCache(store: KeyValueStore, sessionKey: string): Promise<void> {
    await store.delete(cacheKey(sessionKey));
}

/** Memory, for tests and where IndexedDB is missing. */
export function memoryStore(): KeyValueStore & { keys: () => string[] } {
    const map = new Map<string, unknown>();
    return {
        get: async (k) => structuredClone(map.get(k)),
        set: async (k, v) => {
            map.set(k, structuredClone(v));
        },
        delete: async (k) => {
            map.delete(k);
        },
        keys: () => [...map.keys()],
    };
}

/** IndexedDB, in the web view's own data (the app's data folder): one database, one object store. */
export function indexedDbStore(dbName = 'una-desktop', storeName = 'cache'): KeyValueStore {
    let opened: Promise<IDBDatabase> | null = null;
    const db = (): Promise<IDBDatabase> => {
        if (!opened) {
            opened = new Promise<IDBDatabase>((resolve, reject) => {
                const request = indexedDB.open(dbName, 1);
                request.onupgradeneeded = () => request.result.createObjectStore(storeName);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error ?? new Error('IndexedDB did not open'));
            });
            opened.catch(() => {
                opened = null;
            });
        }
        return opened;
    };
    const run = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
        const d = await db();
        return new Promise<T>((resolve, reject) => {
            const request = fn(d.transaction(storeName, mode).objectStore(storeName));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
        });
    };
    return {
        get: (k) => run<unknown>('readonly', (s) => s.get(k)),
        set: async (k, v) => {
            await run('readwrite', (s) => s.put(v, k));
        },
        delete: async (k) => {
            await run('readwrite', (s) => s.delete(k));
        },
    };
}

/** The app's store: IndexedDB where there is one. */
export const cacheStore: KeyValueStore = typeof indexedDB === 'undefined' ? memoryStore() : indexedDbStore();
