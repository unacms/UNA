/**
 * Files (bx_files, GET /files and the paths under it): the query keys, the lists (the Media
 * section's Files tab, a context's or a profile's Files tab), what a row and the detail show of
 * a FileItem (its type's icon and name, its size, its preview where the site makes one), and
 * what changes in the cache when one is added, edited or deleted. A file's comments and
 * reactions are those of its Item (`content_id`). Unlike a photo's, a file's original is given
 * to everyone who may see it (the site's download): `media.download_url` is what Download saves.
 */
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { Schema, UnaApi } from 'una-api';

import type { IconName } from '../../components/icon';
import { ago, unwrap } from '../../lib/api';
import { num, t, tn } from '../../lib/i18n';
import { badgeNames } from '../../components/profile-badges';

export type FileEntry = Schema<'FileItem'>;
export type FilePage = Schema<'Page_FileItem'>;
type Media = Schema<'Media'>;
type Allowed = (url: string | null | undefined) => string | null;

/** How many a page of a list loads. */
export const FILES_PAGE = 30;
/** The most files one POST /files takes (the API's limit). */
export const MAX_FILES = 20;

/** Whose files a list shows: the network's, a context's (`context`) or a profile's (`author`). */
export type FilesOf = { all: true } | { context: string } | { author: string };

const ofKey = (of: FilesOf) => ('context' in of ? (['context', of.context] as const) : 'author' in of ? (['author', of.author] as const) : (['all'] as const));
export const fileListKey = (of: FilesOf) => ['files', 'list', ...ofKey(of)] as const;
export const fileKey = (id: string) => ['file', id] as const;

/** A page of files, the newest first. */
export async function fetchFiles(api: UnaApi, of: FilesOf, cursor: string | undefined, limit = FILES_PAGE): Promise<FilePage> {
    const filter = 'context' in of ? { context: of.context } : 'author' in of ? { author: of.author } : {};
    return unwrap(await api.GET('/files', { params: { query: { ...filter, cursor, limit } } }));
}

/** The extension of a file's name, lower case, without the dot; '' for none. */
export function extensionOf(name: string): string {
    const m = /\.([^./\\]+)$/.exec(name.trim());
    return m?.[1] ? m[1].toLowerCase() : '';
}

type FileType = { icon: IconName; label: string };

const BY_EXT: Record<string, FileType> = {};
const add = (exts: string[], icon: IconName, label: string) => {
    for (const e of exts) BY_EXT[e] = { icon, label };
};
add(['pdf'], 'file-text', t('PDF document'));
add(['doc', 'docx', 'odt', 'rtf', 'pages'], 'file-text', t('Document'));
add(['txt', 'log'], 'file-text', t('Text'));
add(['md', 'markdown'], 'file-text', t('Markdown text'));
add(['csv', 'tsv'], 'file-spreadsheet', t('CSV table'));
add(['xls', 'xlsx', 'ods', 'numbers'], 'file-spreadsheet', t('Spreadsheet'));
add(['ppt', 'pptx', 'odp', 'key'], 'presentation', t('Presentation'));
add(['zip', 'rar', '7z', 'gz', 'tgz', 'tar', 'bz2', 'xz'], 'file-archive', t('Archive'));
add(['json', 'xml', 'html', 'htm', 'css', 'js', 'ts', 'php', 'py', 'rb', 'sh', 'sql', 'yml', 'yaml'], 'file-code', t('Code'));
add(['epub', 'mobi'], 'file-text', t('E-book'));

/**
 * The icon and the words for a file's type: by its kind (an image, a video, audio), else by
 * its extension (from the original's name, else the title), else "File".
 */
export function fileType(f: Pick<FileEntry, 'media' | 'title'>): FileType {
    const m = f.media;
    const ext = extensionOf(m?.original_name || f.title);
    if (m?.kind === 'image') return { icon: 'file-image', label: ext ? t('{{type}} image', { type: ext.toUpperCase() }) : t('Image') };
    if (m?.kind === 'video') return { icon: 'file-play', label: t('Video') };
    if (m?.kind === 'audio') return { icon: 'file-music', label: t('Audio') };
    return BY_EXT[ext] ?? { icon: 'file', label: ext ? t('{{type}} file', { type: ext.toUpperCase() }) : t('File') };
}

/** "512 bytes", "13 KB", "4.2 MB", "1.1 GB"; null when the size is not known. */
export function fileSizeText(bytes: number | null | undefined): string | null {
    if (!bytes || bytes < 0) return null;
    if (bytes < 1024) return tn(bytes, '{{count}} byte', '{{count}} bytes');
    if (bytes < 1024 * 1024) return t('{{size}} KB', { size: Math.round(bytes / 1024) });
    // one decimal always, as before ("4.0 MB"), written the language's way
    const tenths = { minimumFractionDigits: 1, maximumFractionDigits: 1 };
    if (bytes < 1024 * 1024 * 1024) return t('{{size}} MB', { size: num(bytes / (1024 * 1024), tenths) });
    return t('{{size}} GB', { size: num(bytes / (1024 * 1024 * 1024), tenths) });
}

/** The name a download is saved under: the name it was uploaded with, else its title with its extension. */
export function downloadName(f: Pick<FileEntry, 'media' | 'title'>): string {
    const original = f.media?.original_name?.trim();
    if (original) return original;
    // the stored file's address ends in its extension (/s/<storage>/<id>.<ext>?t=...)
    const ext = f.media ? extensionOf((f.media.download_url || f.media.url || '').split(/[?#]/)[0] ?? '') : '';
    const title = f.title.trim() || t('file');
    return ext && extensionOf(title) !== ext ? `${title}.${ext}` : title;
}

/**
 * What the detail previews: an image's copy (the gallery one, else the small one: never the
 * original, which a large file may be), a video's MP4 once the site converted it, audio played
 * from the file itself; null for documents and the rest, which show their type's icon (the site
 * makes no still of a PDF).
 */
export function filePreview(m: Pick<Media, 'kind' | 'url' | 'variants'> | null | undefined, allowed: Allowed): { kind: 'image'; src: string } | { kind: 'video'; src: string; poster: string | undefined } | { kind: 'audio'; src: string } | null {
    if (!m) return null;
    const v = m.variants ?? {};
    if (m.kind === 'image') {
        const src = allowed(v.medium?.url) ?? allowed(v.thumb?.url);
        return src ? { kind: 'image', src } : null;
    }
    if (m.kind === 'video') {
        const src = allowed(v.mp4?.url);
        return src ? { kind: 'video', src, poster: allowed(v.poster?.url) ?? undefined } : null;
    }
    if (m.kind === 'audio') {
        const src = allowed(m.url);
        return src ? { kind: 'audio', src } : null;
    }
    return null;
}

/** The small picture of a row: an image's small copy, else nothing (its type's icon). */
export function rowThumb(m: Pick<Media, 'kind' | 'variants'> | null | undefined, allowed: Allowed): string | null {
    return m?.kind === 'image' ? (allowed(m.variants?.thumb?.url) ?? null) : null;
}

/**
 * What a row says of a file to screen readers after its title: its type, its size, by whom
 * with their badges after the name, and when (all the row shows).
 */
export function fileRowText(f: FileEntry): string {
    const by = f.author ? [t('by {{name}}', { name: f.author.display_name }), ...badgeNames(f.author.badges)].join(', ') : null;
    const parts = [fileType(f).label, fileSizeText(f.media?.size), by, ago(f.created_at)];
    return `, ${parts.filter(Boolean).join(', ')}`;
}

type Pages = InfiniteData<FilePage>;

/** A file as a list already loaded it, so the detail shows it at once. */
export function fileFromLists(queryClient: QueryClient, id: string): FileEntry | undefined {
    for (const [, data] of queryClient.getQueriesData<Pages>(['files', 'list'])) {
        for (const page of data?.pages ?? []) {
            const found = page.items.find((f) => f.id === id);
            if (found) return found;
        }
    }
    return undefined;
}

/** A file as the site has it now: its detail and wherever a list shows it (a list item keeps no text). */
export function putFile(queryClient: QueryClient, fresh: FileEntry): void {
    queryClient.setQueryData(fileKey(fresh.id), fresh);
    queryClient.setQueriesData<Pages>(['files', 'list'], (data) =>
        data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((x) => (x.id === fresh.id ? { ...fresh, text_html: null } : x)) })) } : data,
    );
}

/** A file that is gone: out of every list, its detail forgotten. */
export function dropFile(queryClient: QueryClient, id: string): void {
    queryClient.removeQueries(fileKey(id));
    queryClient.setQueriesData<Pages>(['files', 'list'], (data) => (data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.filter((x) => x.id !== id) })) } : data));
}

/** After new files: their details are there, the lists load again (they are first in the newest-first ones). */
export async function afterFilesAdded(queryClient: QueryClient, files: readonly FileEntry[]): Promise<void> {
    for (const f of files) queryClient.setQueryData(fileKey(f.id), f);
    await queryClient.invalidateQueries({ queryKey: ['files', 'list'] });
}

/** "3 of 8 files were added.": what a request that the site took only part of did. */
export function filesAddedText(added: number, sent: number): string {
    if (added <= 0) return t('No files were added.');
    return tn(added, '{{count}} of {{total}} files was added.', '{{count}} of {{total}} files were added.', { total: sent });
}
