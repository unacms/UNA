/**
 * What the editor suggests as one types: people after `@` (GET /search/profiles), hashtags
 * after `#` (a HashtagSource: the typed tag, written as text, the ones used here lately and the
 * site's, GET /hashtags, a picked one of which is the site's tag link).
 */
import type { Schema, UnaApi } from 'una-api';

import { unwrap } from '../../lib/api';
import { readStoredJson, writeStoredJson } from '../../lib/storage';

export type Trigger = { char: '@' | '#'; query: string; /** Where the `@word` or `#word` starts and ends in the document. */ from: number; to: number };

const TRIGGER = /(?:^|[\s(])([@#])([\p{L}\p{N}_]{0,50})$/u;

/** The `@` or `#` token the caret ends, from the text of its paragraph before it; null when there is none. */
export function findTrigger(textBefore: string, caret: number): Trigger | null {
    const m = TRIGGER.exec(textBefore);
    if (!m) return null;
    const char = m[1] as '@' | '#';
    const query = m[2] ?? '';
    return { char, query, from: caret - query.length - 1, to: caret };
}

export type ProfileSuggestion = Schema<'Profile'>;

/** People whose names start with the words (the site's own search), at most `limit`. */
export async function searchProfiles(api: UnaApi, q: string, limit = 6, signal?: AbortSignal): Promise<ProfileSuggestion[]> {
    return unwrap(await api.GET('/search/profiles', { params: { query: { q, limit } }, signal }));
}

/** A hashtag to offer: the tag, with the site's link to it once phase 2 has one. */
export type HashtagSuggestion = { tag: string; href?: string | null; /** How many posts have it, when the site says. */ count?: number };

/** Where hashtag suggestions come from: the site's (siteHashtags), or this device's alone (localHashtags). */
export interface HashtagSource {
    suggest(query: string, signal?: AbortSignal): Promise<HashtagSuggestion[]>;
    /** A tag was used: recent ones come first next time. */
    used(tag: string): void;
}

const RECENT_KEY = 'una-recent-hashtags';
const RECENT_MAX = 20;

function readRecent(): string[] {
    const list = readStoredJson(RECENT_KEY);
    return Array.isArray(list) ? list.filter((t): t is string => typeof t === 'string') : [];
}

/** The tags of a text typed as `#word`. */
export function hashtagsIn(text: string): string[] {
    return [...text.matchAll(/(?:^|[\s(])#([\p{L}\p{N}_]{1,50})/gu)].map((m) => m[1]!);
}

/**
 * The site's hashtags (GET /hashtags: the most used first, each with its link, so a picked one
 * is the site's tag link), after the typed tag (as text) and the ones used here lately.
 */
export function siteHashtags(api: UnaApi): HashtagSource {
    return {
        async suggest(query, signal) {
            const own = await localHashtags.suggest(query, signal);
            let site: HashtagSuggestion[] = [];
            try {
                const list = unwrap(await api.GET('/hashtags', { params: { query: { q: query, limit: 6 } }, signal }));
                site = list.filter((t) => typeof t?.tag === 'string' && t.tag !== '').map((t) => ({ tag: t.tag, href: t.url, count: t.count }));
            } catch {
                // the site's list is a help: without it, the typed and recent tags
            }
            const seen = new Set(site.map((t) => t.tag.toLocaleLowerCase()));
            // the typed tag first; a recent one the site has comes with the site's link
            const typed = own[0]!;
            const rest = own.slice(1).filter((t) => !seen.has(t.tag.toLocaleLowerCase()));
            return [typed, ...site.filter((t) => t.tag.toLocaleLowerCase() !== typed.tag.toLocaleLowerCase() || !!t.href), ...rest].slice(0, 8);
        },
        used: (tag) => localHashtags.used(tag),
    };
}

/**
 * The typed tag first, then tags used here lately that start with it (kept in this device's
 * storage), none with a link, so a picked tag is written as text.
 */
export const localHashtags: HashtagSource = {
    async suggest(query) {
        const q = query.toLocaleLowerCase();
        const recent = readRecent().filter((t) => t.toLocaleLowerCase().startsWith(q) && t.toLocaleLowerCase() !== q);
        return [{ tag: query }, ...recent.slice(0, 5).map((tag) => ({ tag }))];
    },
    used(tag) {
        const list = [tag, ...readRecent().filter((t) => t.toLocaleLowerCase() !== tag.toLocaleLowerCase())].slice(0, RECENT_MAX);
        writeStoredJson(RECENT_KEY, list);
    },
};
