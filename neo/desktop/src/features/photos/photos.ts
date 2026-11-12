/**
 * Photos (bx_photos, GET /photos) and albums (bx_albums, GET /albums and their items): the query
 * keys, the lists (the Media section's Photos and Albums tabs, a context's or a profile's), what
 * a tile, a card and the viewer show, and what changes in the cache when one is added, edited or
 * deleted. A photo's and an album's comments and reactions are those of their Item
 * (`content_id`); an album's items have none here (their comments stay on the site).
 */
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { Schema, UnaApi } from 'una-api';

import { unwrap } from '../../lib/api';
import { t, tn } from '../../lib/i18n';
import { pictureOf } from '../feed/media';

export type Photo = Schema<'FileItem'>;
export type PhotoPage = Schema<'Page_FileItem'>;
export type Album = Schema<'Album'>;
export type AlbumPage = Schema<'Page_Album'>;
type Media = Schema<'Media'>;
type Allowed = (url: string | null | undefined) => string | null;

/** How many a page of a grid or of cards loads. */
export const PHOTOS_PAGE = 30;
export const ALBUMS_PAGE = 24;
/** The most photos one POST /photos and one album addition take (the API's limits). */
export const MAX_PHOTOS = 20;
export const MAX_ALBUM_PHOTOS = 50;

/** Whose photos or albums a list shows: the network's, a context's (`context`) or a profile's (`author`). */
export type MediaOf = { all: true } | { context: string } | { author: string };

const ofKey = (of: MediaOf) => ('context' in of ? (['context', of.context] as const) : 'author' in of ? (['author', of.author] as const) : (['all'] as const));
export const photoListKey = (of: MediaOf) => ['photos', 'list', ...ofKey(of)] as const;
export const photoKey = (id: string) => ['photo', id] as const;
export const albumListKey = (of: MediaOf) => ['albums', 'list', ...ofKey(of)] as const;
export const albumKey = (id: string) => ['album', id] as const;
export const albumItemsKey = (id: string) => ['album-items', id] as const;

const filter = (of: MediaOf) => ('context' in of ? { context: of.context } : 'author' in of ? { author: of.author } : {});

/** A page of photos, the newest first. */
export async function fetchPhotos(api: UnaApi, of: MediaOf, cursor: string | undefined, limit = PHOTOS_PAGE): Promise<PhotoPage> {
    return unwrap(await api.GET('/photos', { params: { query: { ...filter(of), cursor, limit } } }));
}

/** A page of albums, the newest first. */
export async function fetchAlbums(api: UnaApi, of: MediaOf, cursor: string | undefined, limit = ALBUMS_PAGE): Promise<AlbumPage> {
    return unwrap(await api.GET('/albums', { params: { query: { ...filter(of), cursor, limit } } }));
}

/** A page of an album's items, in its order. */
export async function fetchAlbumItems(api: UnaApi, id: string, cursor: string | undefined, limit = PHOTOS_PAGE): Promise<PhotoPage> {
    return unwrap(await api.GET('/albums/{id}/items', { params: { path: { id }, query: { cursor, limit } } }));
}

/** The picture of a tile: the small copy (never the upload itself, which only its owner gets). */
export function tileSrc(m: Pick<Media, 'url' | 'variants'> | null | undefined, allowed: Allowed): string | null {
    return m ? pictureOf(m, 'thumb', allowed) : null;
}

/** "3 of 8 photos were added.": what a request that the site took only part of did. */
export function addedText(added: number, sent: number): string {
    if (added <= 0) return t('No photos were added.');
    return tn(added, '{{count}} of {{total}} photos was added.', '{{count}} of {{total}} photos were added.', { total: sent });
}

/** "1 photo", "12 photos": an album's count of items (photos and videos). */
export function itemsText(n: number): string {
    return tn(n, '{{count}} photo', '{{count}} photos');
}

/** What a tile is called to screen readers: its title, or its place ("Photo 3 of 12"), and by whom when another's. */
export function tileName(p: Pick<Photo, 'title' | 'kind' | 'author'>, index: number, count: number | null, ownerId?: string): string {
    const n = index + 1;
    const video = p.kind === 'video';
    const place = count ? (video ? t('Video {{n}} of {{total}}', { n, total: count }) : t('Photo {{n}} of {{total}}', { n, total: count })) : video ? t('Video {{n}}', { n }) : t('Photo {{n}}', { n });
    const name = p.title.trim() || place;
    return p.author && p.author.id !== ownerId ? t('{{name}}, by {{author}}', { name, author: p.author.display_name }) : name;
}

/** What an album card says to screen readers after its title: its count, by whom, its audience. */
export function albumCardText(a: Pick<Album, 'stats' | 'author' | 'audience'>): string {
    const parts = [itemsText(a.stats.items), a.author ? t('by {{name}}', { name: a.author.display_name }) : null, a.audience === 'private' ? t('only you') : a.audience === 'members' ? t('members only') : null];
    return `, ${parts.filter(Boolean).join(', ')}`;
}

type PhotoPages = InfiniteData<PhotoPage>;
type AlbumPages = InfiniteData<AlbumPage>;

/** A photo as a list already loaded it, so the detail shows it at once. */
export function photoFromLists(queryClient: QueryClient, id: string): Photo | undefined {
    for (const [, data] of queryClient.getQueriesData<PhotoPages>(['photos', 'list'])) {
        for (const page of data?.pages ?? []) {
            const found = page.items.find((p) => p.id === id);
            if (found) return found;
        }
    }
    return undefined;
}

/** What a viewer's photos are: a list's (whose it is), or a search's results. */
export type ViewerOf = MediaOf | { search: string };

/** Whose photos a list's query key holds (photoListKey; a search's results), or null for another key. */
function ofListKey(key: readonly unknown[]): ViewerOf | null {
    const [, , kind, id] = key;
    if (kind === 'search' && typeof id === 'string') return { search: id };
    if (kind === 'all') return { all: true };
    if (kind === 'context' && typeof id === 'string') return { context: id };
    if (kind === 'author' && typeof id === 'string') return { author: id };
    return null;
}

/**
 * The photos a list holds around one (the list it was opened from, else none) and whose list
 * that is: what the viewer goes through, and what it is called. A search's results (kept among
 * the lists, and for days offline) only when no list holds the photo, so a photo opened from a
 * grid never steps through an old search.
 */
export function photoSiblings(queryClient: QueryClient, id: string): { photos: Photo[]; of: ViewerOf | null } {
    let found: { photos: Photo[]; of: ViewerOf | null } | null = null;
    for (const [key, data] of queryClient.getQueriesData<PhotoPages>(['photos', 'list'])) {
        const all = (data?.pages ?? []).flatMap((p) => p.items);
        if (!all.some((p) => p.id === id)) continue;
        if (key[2] !== 'search') return { photos: all, of: ofListKey(key) };
        found ??= { photos: all, of: ofListKey(key) };
    }
    return found ?? { photos: [], of: null };
}

/**
 * What the viewer's photos are called after their place ("Photo 2 of 5, …"): the list they
 * came from (the network's, a context's, a profile's, a search's), or the one photo alone.
 */
export function viewerLabel(of: ViewerOf | null, photo: Pick<Photo, 'title' | 'author' | 'context_id'>, contextName?: string | null): string {
    if (!of) return photo.title.trim() || t('the photo');
    if ('search' in of) return t('photos matching “{{words}}”', { words: of.search });
    if ('all' in of) return t('the network’s photos, newest first');
    if ('author' in of) return photo.author && photo.author.id === of.author ? t('{{name}}’s photos', { name: photo.author.display_name }) : t('their photos');
    return contextName && photo.context_id === of.context ? t('photos in {{name}}', { name: contextName }) : t('the photos here');
}

/** An album as a list already loaded it. */
export function albumFromLists(queryClient: QueryClient, id: string): Album | undefined {
    for (const [, data] of queryClient.getQueriesData<AlbumPages>(['albums', 'list'])) {
        for (const page of data?.pages ?? []) {
            const found = page.items.find((a) => a.id === id);
            if (found) return found;
        }
    }
    return undefined;
}

/** A photo as the site has it now: its detail and wherever a list shows it (a list item keeps no text). */
export function putPhoto(queryClient: QueryClient, fresh: Photo): void {
    queryClient.setQueryData(photoKey(fresh.id), fresh);
    queryClient.setQueriesData<PhotoPages>(['photos', 'list'], (data) =>
        data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((x) => (x.id === fresh.id ? { ...fresh, text_html: null } : x)) })) } : data,
    );
}

/** A photo that is gone: out of every list, its detail forgotten. */
export function dropPhoto(queryClient: QueryClient, id: string): void {
    queryClient.removeQueries(photoKey(id));
    queryClient.setQueriesData<PhotoPages>(['photos', 'list'], (data) => (data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.filter((x) => x.id !== id) })) } : data));
}

/** An album as the site has it now: its detail and its cards. */
export function putAlbum(queryClient: QueryClient, fresh: Album): void {
    queryClient.setQueryData(albumKey(fresh.id), fresh);
    queryClient.setQueriesData<AlbumPages>(['albums', 'list'], (data) =>
        data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((x) => (x.id === fresh.id ? { ...fresh, text_html: null } : x)) })) } : data,
    );
}

/** An album that is gone: out of every list, its detail and items forgotten. */
export function dropAlbum(queryClient: QueryClient, id: string): void {
    queryClient.removeQueries(albumKey(id));
    queryClient.removeQueries(albumItemsKey(id));
    queryClient.setQueriesData<AlbumPages>(['albums', 'list'], (data) => (data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.filter((x) => x.id !== id) })) } : data));
}

/** After new photos: the lists load again (they are first in the newest-first ones). */
export async function afterPhotosAdded(queryClient: QueryClient, photos: readonly Photo[]): Promise<void> {
    for (const p of photos) queryClient.setQueryData(photoKey(p.id), p);
    await queryClient.invalidateQueries({ queryKey: ['photos', 'list'] });
}

/** After a new album: its detail is there, the lists load again. */
export async function afterAlbumAdded(queryClient: QueryClient, album: Album): Promise<void> {
    queryClient.setQueryData(albumKey(album.id), album);
    await queryClient.invalidateQueries({ queryKey: ['albums', 'list'] });
}

/** After photos were added to an album: its items and its count (the card's preview too) load again. */
export async function afterAddedToAlbum(queryClient: QueryClient, albumId: string): Promise<void> {
    await Promise.all([queryClient.invalidateQueries({ queryKey: albumItemsKey(albumId) }), queryClient.invalidateQueries({ queryKey: albumKey(albumId) }), queryClient.invalidateQueries({ queryKey: ['albums', 'list'] })]);
}

/**
 * Where an arrow key moves in a grid of `count` tiles `columns` wide (reading order follows the
 * page's direction: `rtl` swaps left and right), Home and End to the row's ends, Ctrl/Cmd+Home and
 * End to the grid's; null for a key that moves nothing.
 */
export function gridMove(key: string, index: number, count: number, columns: number, opts: { rtl?: boolean; toEnds?: boolean } = {}): number | null {
    if (count <= 0) return null;
    const cols = Math.max(1, columns);
    const rowStart = index - (index % cols);
    let next: number;
    switch (key) {
        case 'ArrowRight':
            next = index + (opts.rtl ? -1 : 1);
            break;
        case 'ArrowLeft':
            next = index + (opts.rtl ? 1 : -1);
            break;
        case 'ArrowDown':
            next = index + cols;
            break;
        case 'ArrowUp':
            next = index - cols;
            break;
        case 'Home':
            next = opts.toEnds ? 0 : rowStart;
            break;
        case 'End':
            next = opts.toEnds ? count - 1 : Math.min(count - 1, rowStart + cols - 1);
            break;
        default:
            return null;
    }
    // down from the last row's gap stops at the last tile; beyond the ends nothing moves
    if (key === 'ArrowDown' && next >= count) next = rowStart + cols < count ? count - 1 : index;
    return next < 0 || next >= count ? index : next;
}
