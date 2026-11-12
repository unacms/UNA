/**
 * Search's tabs of the content modules that have a search of their own: the Posts module's posts
 * (`articles`), photos, albums, videos, files, polls and tasks (GET /search/posts ...
 * /search/tasks, the module's keyword search, newest first, in cursor pages). A tab is there
 * only on a site that lists the module (GET /api/v2 `modules`) and asks only once it is the one
 * shown, so a search costs no request per module; an answer of 404 (the module was turned off
 * since) takes the tab away instead of showing an error. The results are the module's own rows
 * and cards, which open as they do in its lists; they are kept under the module's list keys, so
 * an edit, a vote or a delete in the detail shows here too.
 */
import { useInfiniteQuery, type UseInfiniteQueryResult, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import type { UnaApi } from 'una-api';

import { EmptyState } from '../../components/empty-state';
import type { IconName } from '../../components/icon';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { ApiError, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t, tn } from '../../lib/i18n';
import { useRoute } from '../../lib/navigation';
import { emptyListText, useFillEmptyPages } from '../../lib/paging';
import type { SearchModuleTab, SearchTab } from '../../lib/router';
import { useSiteHasTag } from '../../lib/site-modules';
import { FileRow } from '../files/file-list';
import { type FileEntry, FILES_PAGE } from '../files/files';
import { AlbumCard } from '../photos/album-list';
import { MoreButton, PhotoTiles } from '../photos/photo-list';
import { type Album, ALBUMS_PAGE, type Photo, PHOTOS_PAGE } from '../photos/photos';
import { PollRow } from '../polls/poll-list';
import { type Poll, POLLS_PAGE } from '../polls/polls';
import { PostRow } from '../posts/post-list';
import { type Post, POSTS_PAGE } from '../posts/posts';
import { TaskRow } from '../tasks/task-list';
import { loadMoreTasks, type Task, TASKS_PAGE } from '../tasks/tasks';
import { VideoRow } from '../videos/video-list';
import { type Video, VIDEOS_PAGE } from '../videos/videos';

/** What a tab lists. */
type Found = { articles: Post; photos: Photo; albums: Album; videos: Video; files: FileEntry; polls: Poll; tasks: Task };

/** A page of results; `missing`: the site has no such search (404), which is no error. */
export type SearchPage<T> = { items: T[]; next_cursor: string | null; missing?: true };

type PageQuery = { q: string; cursor: string | undefined; limit: number };

/** The tag of each tab's module in GET /api/v2 `modules`. */
export const MODULE_TAGS: Record<SearchModuleTab, string> = { articles: 'posts', photos: 'photos', albums: 'albums', videos: 'videos', files: 'files', polls: 'polls', tasks: 'tasks' };

const PAGE_SIZES: Record<SearchModuleTab, number> = { articles: POSTS_PAGE, photos: PHOTOS_PAGE, albums: ALBUMS_PAGE, videos: VIDEOS_PAGE, files: FILES_PAGE, polls: POLLS_PAGE, tasks: TASKS_PAGE };

const FETCH: { [K in SearchModuleTab]: (api: UnaApi, query: PageQuery) => Promise<SearchPage<Found[K]>> } = {
    articles: async (api, query) => unwrap(await api.GET('/search/posts', { params: { query } })),
    photos: async (api, query) => unwrap(await api.GET('/search/photos', { params: { query } })),
    albums: async (api, query) => unwrap(await api.GET('/search/albums', { params: { query } })),
    videos: async (api, query) => unwrap(await api.GET('/search/videos', { params: { query } })),
    files: async (api, query) => unwrap(await api.GET('/search/files', { params: { query } })),
    polls: async (api, query) => unwrap(await api.GET('/search/polls', { params: { query } })),
    tasks: async (api, query) => unwrap(await api.GET('/search/tasks', { params: { query } })),
};

/**
 * Where a tab's results are kept: among the module's lists (`['posts', 'list', ...]`, for tasks
 * `['tasks', ...]`), which is where its detail looks a row up and writes a change back.
 */
export function moduleSearchKey(kind: SearchModuleTab, q: string): readonly string[] {
    return kind === 'tasks' ? ['tasks', 'search', q] : [MODULE_TAGS[kind], 'list', 'search', q];
}

export function isModuleTab(tab: SearchTab): tab is SearchModuleTab {
    return tab in MODULE_TAGS;
}

/** One tab's search: whether the site has it (null until it said which modules it has), and its pages. */
export type ModuleSearch<T> = { available: boolean | null; query: UseInfiniteQueryResult<SearchPage<T>> };
export type ModuleSearches = { [K in SearchModuleTab]: ModuleSearch<Found[K]> };

function useModuleSearch<K extends SearchModuleTab>(kind: K, q: string, tab: SearchTab): ModuleSearch<Found[K]> {
    const { api } = useApp();
    const listed = useSiteHasTag(MODULE_TAGS[kind]);
    const shown = !!q && listed === true && tab === kind;
    const query = useInfiniteQuery({
        queryKey: moduleSearchKey(kind, q),
        queryFn: async ({ pageParam }): Promise<SearchPage<Found[K]>> => {
            try {
                return await FETCH[kind](api, { q, cursor: pageParam as string | undefined, limit: PAGE_SIZES[kind] });
            } catch (e) {
                if (e instanceof ApiError && e.status === 404) return { items: [], next_cursor: null, missing: true };
                throw e;
            }
        },
        getNextPageParam: (last) => last.next_cursor ?? undefined,
        // asked once its tab is shown; the answer (and its count on the tab) stays after that
        enabled: shown,
        staleTime: 30_000,
    });
    // and only then asked for the pages after an empty one, which `enabled` does not hold back
    useFillEmptyPages(query, shown);
    return { available: listed === null ? null : listed && !query.data?.pages[0]?.missing, query };
}

/** The seven module searches of the words, the shown tab's asked for. */
export function useModuleSearches(q: string, tab: SearchTab): ModuleSearches {
    return {
        articles: useModuleSearch('articles', q, tab),
        photos: useModuleSearch('photos', q, tab),
        albums: useModuleSearch('albums', q, tab),
        videos: useModuleSearch('videos', q, tab),
        files: useModuleSearch('files', q, tab),
        polls: useModuleSearch('polls', q, tab),
        tasks: useModuleSearch('tasks', q, tab),
    };
}

/** What a search found so far, for its tab's count: nothing known until it answered. */
export function moduleCount(search: ModuleSearch<unknown>): { count: number | undefined; more: boolean } {
    if (search.available === false) return { count: 0, more: false };
    if (search.available === null) return { count: undefined, more: false };
    const { query } = search;
    return { count: query.isSuccess ? query.data.pages.reduce((sum, p) => sum + p.items.length, 0) : undefined, more: !!query.hasNextPage };
}

export function moduleTabName(kind: SearchModuleTab): string {
    switch (kind) {
        case 'articles':
            return t('Posts');
        case 'photos':
            return t('Photos');
        case 'albums':
            return t('Albums');
        case 'videos':
            return t('Videos');
        case 'files':
            return t('Files');
        case 'polls':
            return t('Polls');
        case 'tasks':
            return t('Tasks');
    }
}

/** What the live region says once a module tab's results are in. */
export function moduleFoundText(kind: SearchModuleTab, count: number, more: boolean): string {
    switch (kind) {
        case 'articles':
            if (count === 0) return t('No posts found');
            return more ? tn(count, '{{count}} or more post found', '{{count}} or more posts found') : tn(count, '{{count}} post found', '{{count}} posts found');
        case 'photos':
            if (count === 0) return t('No photos found');
            return more ? tn(count, '{{count}} or more photo found', '{{count}} or more photos found') : tn(count, '{{count}} photo found', '{{count}} photos found');
        case 'albums':
            if (count === 0) return t('No albums found');
            return more ? tn(count, '{{count}} or more album found', '{{count}} or more albums found') : tn(count, '{{count}} album found', '{{count}} albums found');
        case 'videos':
            if (count === 0) return t('No videos found');
            return more ? tn(count, '{{count}} or more video found', '{{count}} or more videos found') : tn(count, '{{count}} video found', '{{count}} videos found');
        case 'files':
            if (count === 0) return t('No files found');
            return more ? tn(count, '{{count}} or more file found', '{{count}} or more files found') : tn(count, '{{count}} file found', '{{count}} files found');
        case 'polls':
            if (count === 0) return t('No polls found');
            return more ? tn(count, '{{count}} or more poll found', '{{count}} or more polls found') : tn(count, '{{count}} poll found', '{{count}} polls found');
        case 'tasks':
            if (count === 0) return t('No tasks found');
            return more ? tn(count, '{{count}} or more task found', '{{count}} or more tasks found') : tn(count, '{{count}} task found', '{{count}} tasks found');
    }
}

/** A site without the module says so (a link to a search of it, the module turned off since). */
function hasNone(kind: SearchModuleTab): string {
    switch (kind) {
        case 'articles':
            return t('This network has no posts.');
        case 'photos':
            return t('This network has no photos.');
        case 'albums':
            return t('This network has no albums.');
        case 'videos':
            return t('This network has no videos.');
        case 'files':
            return t('This network has no files.');
        case 'polls':
            return t('This network has no polls.');
        case 'tasks':
            return t('This network has no tasks.');
    }
}

const ICONS: Record<SearchModuleTab, IconName> = { articles: 'newspaper', photos: 'image', albums: 'images', videos: 'film', files: 'file', polls: 'vote', tasks: 'list-checks' };

/** A tab's states around its list: loading, an error with Retry, nothing found, and More. */
function Pages<T>({ q, search, more, onMore, children }: { q: string; search: ModuleSearch<T>; more: string; onMore?: () => void; children: (items: T[]) => ReactNode }) {
    const { query } = search;
    const items = query.data?.pages.flatMap((p) => p.items) ?? [];
    const nothing = t('Nothing matches “{{words}}”', { words: q });
    const emptyText = emptyListText(query, items.length, nothing);
    return (
        <>
            <SkeletonRows loading={query.isLoading} />
            {query.isError ? <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} busy={query.isFetching} /> : null}
            <EmptyState shown={!!emptyText} icon="search-x" title={emptyText || nothing} hint={emptyText === nothing ? t('Check the spelling or try fewer words.') : undefined} />
            {items.length ? children(items) : null}
            <MoreButton shown={!!query.hasNextPage} busy={query.isFetchingNextPage} onMore={onMore ?? (() => void query.fetchNextPage())}>
                {more}
            </MoreButton>
        </>
    );
}

/** The shown module tab's results, drawn and opened as the module's own list draws and opens them. */
export function ModuleResults({ kind, q, searches, announce }: { kind: SearchModuleTab; q: string; searches: ModuleSearches; announce: (text: string) => void }) {
    const route = useRoute();
    const queryClient = useQueryClient();
    const open = route.detail;
    const openId = (detail: 'article' | 'album' | 'video' | 'file' | 'poll' | 'task') => (open?.kind === detail ? open.id : null);
    const { available } = searches[kind];
    // a link to a tab, before the site said which modules it has
    if (available === null) return <SkeletonRows loading />;
    if (!available) return <EmptyState icon={ICONS[kind]} title={hasNone(kind)} />;
    switch (kind) {
        case 'articles':
            return (
                <Pages q={q} search={searches.articles} more={t('More posts')}>
                    {(items) => (
                        <ul className="list rows article-list" aria-label={t('Posts matching “{{words}}”', { words: q })}>
                            {items.map((p) => (
                                <PostRow key={p.id} post={p} selected={p.id === openId('article')} />
                            ))}
                        </ul>
                    )}
                </Pages>
            );
        case 'photos':
            return (
                <Pages q={q} search={searches.photos} more={t('More photos')}>
                    {(items) => <PhotoTiles items={items} label={t('Photos matching “{{words}}”', { words: q })} />}
                </Pages>
            );
        case 'albums':
            return (
                <Pages q={q} search={searches.albums} more={t('More albums')}>
                    {(items) => (
                        <ul className="album-cards" aria-label={t('Albums matching “{{words}}”', { words: q })}>
                            {items.map((a) => (
                                <AlbumCard key={a.id} album={a} selected={a.id === openId('album')} />
                            ))}
                        </ul>
                    )}
                </Pages>
            );
        case 'videos':
            return (
                <Pages q={q} search={searches.videos} more={t('More videos')}>
                    {(items) => (
                        <ul className="list rows video-list" aria-label={t('Videos matching “{{words}}”', { words: q })}>
                            {items.map((v) => (
                                <VideoRow key={v.id} video={v} selected={v.id === openId('video')} />
                            ))}
                        </ul>
                    )}
                </Pages>
            );
        case 'files':
            return (
                <Pages q={q} search={searches.files} more={t('More files')}>
                    {(items) => (
                        <ul className="list rows file-list" aria-label={t('Files matching “{{words}}”', { words: q })}>
                            {items.map((f) => (
                                <FileRow key={f.id} file={f} selected={f.id === openId('file')} />
                            ))}
                        </ul>
                    )}
                </Pages>
            );
        case 'polls':
            return (
                <Pages q={q} search={searches.polls} more={t('More polls')}>
                    {(items) => (
                        <ul className="list rows poll-list" aria-label={t('Polls matching “{{words}}”', { words: q })}>
                            {items.map((p) => (
                                <PollRow key={p.id} poll={p} selected={p.id === openId('poll')} />
                            ))}
                        </ul>
                    )}
                </Pages>
            );
        case 'tasks':
            return (
                // more of them as a list of tasks loads more: from its first page after a change (loadMoreTasks)
                <Pages q={q} search={searches.tasks} more={t('More tasks')} onMore={() => void loadMoreTasks(queryClient, moduleSearchKey('tasks', q), searches.tasks.query)}>
                    {(items) => (
                        <ul className="list rows task-list" aria-label={t('Tasks matching “{{words}}”', { words: q })}>
                            {items.map((task) => (
                                <TaskRow key={task.id} task={task} selected={task.id === openId('task')} where announce={announce} />
                            ))}
                        </ul>
                    )}
                </Pages>
            );
    }
}
