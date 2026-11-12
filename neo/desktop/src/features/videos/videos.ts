/**
 * Videos (the bx_videos module, GET /videos and the paths under it): the query keys, the lists
 * (the Media section's Videos tab, a context's or a profile's Videos tab), what a row and the
 * player show of a FileItem, and what changes in the cache when one is added, edited or deleted.
 * A video's comments and reactions are those of its Item (`content_id`), so the thread's comment
 * tree shows them unchanged, as a discussion's replies.
 */
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { Schema, UnaApi } from 'una-api';

import { unwrap } from '../../lib/api';
import { tn } from '../../lib/i18n';

export type Video = Schema<'FileItem'>;
export type VideoPage = Schema<'Page_FileItem'>;
type Media = Schema<'Media'>;

/** How many a page of a list loads. */
export const VIDEOS_PAGE = 24;

/** Whose videos a list shows: the network's, a context's (`context`) or a profile's (`author`). */
export type VideosOf = { all: true } | { context: string } | { author: string };

export const videoListKey = (of: VideosOf) => ('context' in of ? (['videos', 'list', 'context', of.context] as const) : 'author' in of ? (['videos', 'list', 'author', of.author] as const) : (['videos', 'list', 'all'] as const));
export const videoKey = (id: string) => ['video', id] as const;

/** A page of a list of videos, the newest first. */
export async function fetchVideos(api: UnaApi, of: VideosOf, cursor: string | undefined, limit = VIDEOS_PAGE): Promise<VideoPage> {
    const filter = 'context' in of ? { context: of.context } : 'author' in of ? { author: of.author } : {};
    return unwrap(await api.GET('/videos', { params: { query: { ...filter, cursor, limit } } }));
}

type Allowed = (url: string | null | undefined) => string | null;

/**
 * What the player plays: the MP4 copy once the site converted the upload, with its still; null
 * while it is converting or when it failed (never the upload itself, which only its owner gets
 * and may not play here).
 */
export function playable(v: Pick<Video, 'media'>, allowed: Allowed): { src: string; poster: string | undefined } | null {
    const m = v.media;
    if (!m || m.state !== 'ready') return null;
    const src = allowed(m.variants?.mp4?.url);
    return src ? { src, poster: allowed(m.variants?.poster?.url) ?? allowed(m.variants?.thumb?.url) ?? undefined } : null;
}

/** The still a row shows: the small one, else the poster, else a link's preview picture. */
export function thumbnail(v: Pick<Video, 'media' | 'links'>, allowed: Allowed): string | null {
    const m = v.media;
    return allowed(m?.variants?.thumb?.url) ?? allowed(m?.variants?.poster?.url) ?? allowed(v.links?.[0]?.image?.path) ?? null;
}

/** The player of a video on another site, for a frame: https only. */
export function playerUrl(v: Pick<Video, 'embed_player_url'>): string | null {
    const url = v.embed_player_url;
    if (!url) return null;
    try {
        return new URL(url).protocol === 'https:' ? url : null;
    } catch {
        return null;
    }
}

/** Where a video stands, when it can't be played yet: converting, or it failed. */
export function mediaState(v: Pick<Video, 'media' | 'state' | 'embed_url'>): 'processing' | 'failed' | null {
    if (v.embed_url) return null;
    if (v.media?.state === 'failed') return 'failed';
    if (v.state === 'processing' || v.media?.state === 'processing') return 'processing';
    return null;
}

/** "0:42", "12:05", "1:02:09"; null without a length. */
export function durationText(ms: number | null | undefined): string | null {
    if (!ms || ms < 1000) return null;
    const total = Math.round(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const two = (n: number) => String(n).padStart(2, '0');
    return h ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
}

/** "12 views", "1 view". */
export function viewsText(n: number): string {
    return tn(n, '{{count}} view', '{{count}} views');
}

/** The aspect ratio of the player's box: the upload's, else 16:9. */
export function videoAspect(m: Pick<Media, 'width' | 'height'> | null | undefined): string {
    return m?.width && m.height ? `${m.width} / ${m.height}` : '16 / 9';
}

/** Plain text as the API takes it in `text_html`: escaped, each line a paragraph. */
export function textToHtml(text: string): string {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return text
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => `<p>${esc(l)}</p>`)
        .join('');
}

type Pages = InfiniteData<VideoPage>;

/** A video as a list already loaded it, so the detail shows it at once. */
export function fromLists(queryClient: QueryClient, id: string): Video | undefined {
    for (const [, data] of queryClient.getQueriesData<Pages>(['videos', 'list'])) {
        for (const page of data?.pages ?? []) {
            const found = page.items.find((v) => v.id === id);
            if (found) return found;
        }
    }
    return undefined;
}

/** A video as the site has it now: in its detail and wherever a list shows it (a list item keeps no text). */
export function putVideo(queryClient: QueryClient, fresh: Video): void {
    queryClient.setQueryData(videoKey(fresh.id), fresh);
    queryClient.setQueriesData<Pages>(['videos', 'list'], (data) =>
        data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((v) => (v.id === fresh.id ? { ...fresh, text_html: null } : v)) })) } : data,
    );
}

/** A video that is gone: out of every list, its detail forgotten. */
export function dropVideo(queryClient: QueryClient, id: string): void {
    queryClient.removeQueries(videoKey(id));
    queryClient.setQueriesData<Pages>(['videos', 'list'], (data) => (data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.filter((v) => v.id !== id) })) } : data));
}

/** After a new video: the lists load again (it is first in the newest-first ones). */
export async function afterVideoAdded(queryClient: QueryClient, video: Video): Promise<void> {
    queryClient.setQueryData(videoKey(video.id), video);
    await queryClient.invalidateQueries({ queryKey: ['videos', 'list'] });
}
