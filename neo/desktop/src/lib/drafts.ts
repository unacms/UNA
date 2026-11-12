/**
 * Lasting drafts: what someone typed and has not sent outlives the box, the window and a
 * restart. In the app they are a JSON file in the app's data folder (the store plugin,
 * drafts.json); in a plain browser, localStorage. Each draft is keyed by the site, the acting
 * profile and what it is for (`DraftTarget`), so another profile or network never sees it,
 * and a sent post, comment or message clears it.
 */
import { getStore, type Store } from '@tauri-apps/plugin-store';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Schema } from 'una-api';

import { useApp } from './context';
import { inApp } from './native';
import { readStoredJson, removeStored, writeStoredJson } from './storage';

type Media = Schema<'Media'>;

export type Audience = 'public' | 'members' | 'friends' | 'private';

/** An upload a draft keeps; the site deletes unused uploads after a while (`uploadedAt`). */
export type DraftMedia = { media: Media; name: string; uploadedAt: number };

export type Draft = {
    /** The text as plain text (what lists of drafts show, and what older versions kept). */
    text: string;
    /** The text as the rich editor writes it (lib/rich-html.ts); a draft without it is read from `text`. */
    html?: string;
    audience?: Audience;
    /** Post in this context (group, event) instead of one's own timeline. */
    contextId?: string | null;
    media?: DraftMedia[];
    /** A new conversation's recipients, as they were chosen. */
    recipients?: Schema<'Profile'>[];
    /** A new discussion's title and category (its text is `text`). */
    title?: string;
    categoryId?: string;
    updatedAt: number;
};

/**
 * What a draft is for:
 * - `feed`: the new post (one per profile; it says its own audience and context);
 * - `comment:<item>` and `comment:<item>:<parent comment>`: a comment on a post and a reply;
 * - `conversation:<id>`: a reply in a conversation; `message-to:<profile>`: a new one to that
 *   profile; `message-new`: a new one started from New Message, with its recipients;
 * - `discussion-new` and `discussion-new:<group>`: a new discussion, with its title.
 */
export type DraftTarget = 'feed' | `comment:${string}` | `conversation:${string}` | `message-to:${string}` | 'message-new' | 'discussion-new' | `discussion-new:${string}`;

export function draftKey(siteUrl: string, profileId: string, target: DraftTarget): string {
    return `${siteUrl.replace(/\/+$/, '')}|${profileId}|${target}`;
}

/** A draft worth keeping: text, a title or media. */
export function isEmptyDraft(d: Pick<Draft, 'text' | 'media' | 'title'>): boolean {
    return !d.text.trim() && !d.title?.trim() && !d.media?.length;
}

/** Drafts left alone this long are dropped when the store opens. */
export const DRAFT_MAX_AGE_MS = 30 * 24 * 3600 * 1000;
/**
 * The site deletes an upload no post took after its ghost lifetime (an hour by default): a
 * draft brings back only uploads younger than this.
 */
export const UPLOAD_KEEP_MS = 45 * 60 * 1000;

/** Where drafts are kept: one key per draft. */
export interface DraftBackend {
    get(key: string): Promise<Draft | undefined>;
    set(key: string, draft: Draft): Promise<void>;
    delete(key: string): Promise<void>;
    entries(): Promise<[string, Draft][]>;
}

function isDraft(v: unknown): v is Draft {
    return !!v && typeof v === 'object' && typeof (v as Draft).text === 'string' && typeof (v as Draft).updatedAt === 'number';
}

/**
 * A kept draft as this version reads it, or undefined. Uploads kept in the Media shape from
 * before `variants` (thumb_url, large_url) are dropped: they are older than the site keeps an
 * upload nothing took, and the tray could not show them.
 */
export function readDraft(v: unknown): Draft | undefined {
    if (!isDraft(v)) return undefined;
    if (!Array.isArray(v.media)) return v;
    const media = v.media.filter((m) => !!m && typeof m === 'object' && !!m.media && typeof m.media.variants === 'object' && m.media.variants !== null);
    return media.length === v.media.length ? v : { ...v, media };
}

/** The drafts file Rust opens at start (src-tauri/src/lib.rs, DRAFTS_FILE). */
export const DRAFTS_FILE = 'drafts.json';

/**
 * The store plugin's JSON file. Every write is saved at once, so a quit right after typing
 * keeps it. The page never opens a store by path (the capability has no `load`, which would
 * reach any file): it asks for the one Rust opened, and gets nothing if there is none.
 */
export function tauriBackend(file = DRAFTS_FILE): DraftBackend {
    let opened: Promise<Store> | null = null;
    const store = (): Promise<Store> => {
        if (!opened) {
            const lookup = getStore(file).then((s) => {
                if (!s) throw new Error(`The drafts file ${file} is not open`);
                return s;
            });
            // a failed lookup is tried again next time
            lookup.catch(() => {
                if (opened === lookup) opened = null;
            });
            opened = lookup;
        }
        return opened;
    };
    return {
        get: async (key) => {
            return readDraft(await (await store()).get<unknown>(key));
        },
        set: async (key, draft) => {
            const s = await store();
            await s.set(key, draft);
            await s.save();
        },
        delete: async (key) => {
            const s = await store();
            await s.delete(key);
            await s.save();
        },
        entries: async () => (await (await store()).entries<unknown>()).flatMap(([k, v]): [string, Draft][] => {
            const d = readDraft(v);
            return d ? [[k, d]] : [];
        }),
    };
}

/** localStorage, for the app in a plain browser tab. A full or blocked storage keeps nothing. */
export function localStorageBackend(prefix = 'una-draft:'): DraftBackend {
    const read = (k: string): Draft | undefined => readDraft(readStoredJson(prefix + k));
    return {
        get: async (key) => read(key),
        // in a private window or a full storage the draft lives as long as the box
        set: async (key, draft) => writeStoredJson(prefix + key, draft),
        delete: async (key) => removeStored(prefix + key),
        entries: async () => {
            const out: [string, Draft][] = [];
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (!k?.startsWith(prefix)) continue;
                    const d = read(k.slice(prefix.length));
                    if (d) out.push([k.slice(prefix.length), d]);
                }
            } catch {
                // unreadable storage has no drafts
            }
            return out;
        },
    };
}

/** Drafts over a backend; old ones are dropped the first time it is used. */
export class DraftStore {
    private pruned: Promise<void> | null = null;

    constructor(
        private readonly backend: DraftBackend,
        private readonly now: () => number = Date.now,
    ) {}

    private prune(): Promise<void> {
        this.pruned ??= this.backend.entries().then(
            async (all) => {
                const old = all.filter(([, d]) => this.now() - d.updatedAt > DRAFT_MAX_AGE_MS);
                await Promise.all(old.map(([k]) => this.backend.delete(k)));
            },
            () => undefined,
        );
        return this.pruned;
    }

    /** The draft, without uploads the site has likely deleted by now. */
    async get(key: string): Promise<Draft | undefined> {
        await this.prune();
        const d = await this.backend.get(key);
        if (!d) return undefined;
        const media = d.media?.filter((m) => this.now() - m.uploadedAt < UPLOAD_KEEP_MS);
        return media && media.length !== d.media?.length ? { ...d, media } : d;
    }

    /** Keep a draft; an empty one is deleted instead. */
    async set(key: string, draft: Omit<Draft, 'updatedAt'>): Promise<void> {
        if (isEmptyDraft(draft)) return this.backend.delete(key);
        return this.backend.set(key, { ...draft, updatedAt: this.now() });
    }

    delete(key: string): Promise<void> {
        return this.backend.delete(key);
    }

    /** Every draft whose key starts with this (a post's comment drafts). */
    async list(prefix: string): Promise<[string, Draft][]> {
        await this.prune();
        return (await this.backend.entries()).filter(([k]) => k.startsWith(prefix));
    }
}

let shared: DraftStore | null = null;

/** The app's draft store: the store plugin in the app, localStorage in a browser. */
export function draftStore(): DraftStore {
    shared ??= new DraftStore(inApp ? tauriBackend() : localStorageBackend());
    return shared;
}

/** Tests: use this store instead (null goes back to the default). */
export function setDraftStore(store: DraftStore | null): void {
    shared = store;
}

/** The full key of a draft of the signed-in profile on this site. */
export function useDraftKey(target: DraftTarget | null): string | null {
    const { siteUrl, me } = useApp();
    return target ? draftKey(siteUrl, me.active_profile_id, target) : null;
}

const SAVE_DELAY_MS = 300;

/**
 * One lasting draft. `loaded` is undefined while it is read and null when there is none.
 * `save` writes after a short pause (the last call wins) and at unmount; `clear` deletes it at
 * once (sent, or thrown away).
 */
export function useDraft(key: string | null): {
    loaded: Draft | null | undefined;
    save: (draft: Omit<Draft, 'updatedAt'>) => void;
    clear: () => void;
} {
    const [loaded, setLoaded] = useState<{ key: string | null; draft: Draft | null } | null>(null);
    const pending = useRef<{ key: string; draft: Omit<Draft, 'updatedAt'> } | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const flush = useCallback(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        const p = pending.current;
        pending.current = null;
        if (p) void draftStore().set(p.key, p.draft);
    }, []);

    useEffect(() => {
        let live = true;
        if (key)
            void draftStore()
                .get(key)
                .then(
                    (d) => live && setLoaded({ key, draft: d ?? null }),
                    () => live && setLoaded({ key, draft: null }),
                );
        return () => {
            live = false;
            flush();
        };
    }, [key, flush]);

    const save = useCallback(
        (draft: Omit<Draft, 'updatedAt'>) => {
            if (!key) return;
            pending.current = { key, draft };
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(flush, SAVE_DELAY_MS);
        },
        [key, flush],
    );

    const clear = useCallback(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        pending.current = null;
        if (key) void draftStore().delete(key);
    }, [key]);

    const current = !key ? null : loaded?.key === key ? loaded.draft : undefined;
    return useMemo(() => ({ loaded: current, save, clear }), [current, save, clear]);
}
