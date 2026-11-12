import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { MouseEvent, ReactNode } from 'react';

import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { InlineError, SkeletonRows } from '../../components/skeleton';
import { ago } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { locale, t } from '../../lib/i18n';
import { useMediaSrc, usePicture } from '../../lib/media';
import { useNavigation, useRoute } from '../../lib/navigation';
import { isWindowGesture, isWindowKey, useOpenInWindow } from '../../lib/open-in-window';
import { emptyListText, useFillEmptyPages } from '../../lib/paging';
import { MoreButton } from '../photos/photo-list';
import { type FileEntry, fetchFiles, fileKey, fileListKey, fileRowText, fileSizeText, type FilesOf, fileType, rowThumb } from './files';

/** A file's type as a square: its icon, or an image's small copy. */
export function FileTypeIcon({ file: f, size = 40 }: { file: FileEntry; size?: number }) {
    const allowed = useMediaSrc();
    const picture = usePicture(rowThumb(f.media, allowed));
    const type = fileType(f);
    return (
        <span className="file-icon" style={{ width: size, height: size }} aria-hidden="true">
            {picture.src ? <img src={picture.src} alt="" loading="lazy" decoding="async" onError={picture.onError} onLoad={picture.onLoad} /> : <Icon name={type.icon} size={size >= 64 ? 32 : 20} />}
        </span>
    );
}

/**
 * One file in a list: its type's icon, its name (which opens it beside the list; Cmd+click,
 * Cmd+Enter or a double-click: in a window of its own), its type and size, who added it with
 * their badges after the name, and when. A flat row with a hairline, as the other lists.
 */
export function FileRow({ file: f, selected }: { file: FileEntry; selected: boolean }) {
    const { openDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const queryClient = useQueryClient();
    const detail = { kind: 'file', id: f.id } as const;
    const size = fileSizeText(f.media?.size);
    const open = (m?: { metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }) => {
        if (openInWindow && m && isWindowGesture(m)) {
            openInWindow(detail);
            return;
        }
        // the detail shows it at once while it loads its own copy (with its description)
        if (!queryClient.getQueryData(fileKey(f.id))) queryClient.setQueryData(fileKey(f.id), f, { updatedAt: 0 });
        openDetail(detail);
    };
    const onDoubleClick = (m: MouseEvent<HTMLElement>) => {
        if (!openInWindow || (m.target as Element).closest('button:not([data-open]), a')) return;
        window.getSelection()?.removeAllRanges();
        openInWindow(detail);
    };
    return (
        <li className="list-row file-row" data-selected={selected || undefined} onDoubleClick={onDoubleClick}>
            <span className="file-icon-link" onClick={(m) => open(m)}>
                <FileTypeIcon file={f} />
            </span>
            <div className="list-main">
                <button
                    type="button"
                    className="profile-link strong file-title"
                    data-open=""
                    aria-current={selected ? 'true' : undefined}
                    onClick={(m) => open(m)}
                    onKeyDown={(k) => {
                        if (!openInWindow || !isWindowKey(k)) return;
                        k.preventDefault();
                        openInWindow(detail);
                    }}
                >
                    <bdi className="truncate">{f.title || f.media?.original_name || t('Untitled file')}</bdi>
                    <span className="sr-only">{fileRowText(f)}</span>
                </button>
                <span className="row-sub" aria-hidden="true">
                    <span>{fileType(f).label}</span>
                    {size ? (
                        <>
                            <span>·</span>
                            <span>{size}</span>
                        </>
                    ) : null}
                </span>
                <span className="row-sub" aria-hidden="true">
                    {f.author ? (
                        <>
                            <span className={f.author.badges?.length ? 'with-badges' : undefined}>
                                <bdi className="truncate">{f.author.display_name}</bdi>
                                <ProfileBadges badges={f.author.badges} />
                            </span>
                            <span>·</span>
                        </>
                    ) : null}
                    <time dateTime={f.created_at} title={new Date(f.created_at).toLocaleString(locale())}>
                        {ago(f.created_at)}
                    </time>
                </span>
            </div>
        </li>
    );
}

/** A list of files: newest first, a page at a time, the open one marked. */
export function FilesPages({ of, label, empty, hint, selectedId, action }: { of: FilesOf; label: string; empty: string; hint?: string; selectedId: string | null; action?: ReactNode }) {
    const { api } = useApp();
    const query = useInfiniteQuery({
        queryKey: fileListKey(of),
        queryFn: async ({ pageParam }) => fetchFiles(api, of, pageParam as string | undefined),
        getNextPageParam: (last) => last.next_cursor ?? undefined,
    });
    useFillEmptyPages(query);
    const items = query.data?.pages.flatMap((p) => p.items) ?? [];
    const emptyText = emptyListText(query, items.length, empty);
    return (
        <>
            <SkeletonRows loading={query.isLoading} />
            {query.isError ? <InlineError message={errorMessage(query.error)} onRetry={() => void query.refetch()} busy={query.isFetching} /> : null}
            <EmptyState shown={!!emptyText} icon="file" title={emptyText || empty} hint={emptyText === empty ? hint : undefined} actions={emptyText === empty ? action : undefined} />
            {items.length ? (
                <ul className="list rows file-list" aria-label={label}>
                    {items.map((f) => (
                        <FileRow key={f.id} file={f} selected={selectedId === f.id} />
                    ))}
                </ul>
            ) : null}
            <MoreButton shown={!!query.hasNextPage} busy={query.isFetchingNextPage} onMore={() => void query.fetchNextPage()}>
                {t('More files')}
            </MoreButton>
        </>
    );
}

/**
 * A Files tab: a group's, space's or event's files (GET /files?context=), with Add files for
 * those who may post there, or the files a profile added (`author`).
 */
export function FilesOfTab({ of, name, canAdd = false }: { of: { context: string } | { author: string }; name: string; canAdd?: boolean }) {
    const route = useRoute();
    const { openDetail } = useNavigation();
    const base = 'context' in of ? `context-${of.context}` : `author-${of.author}`;
    const headingId = `${base}-files`;
    const add = 'context' in of && canAdd ? () => openDetail({ kind: 'new-files', contextId: of.context }) : null;
    return (
        <section className="connections context-files" aria-labelledby={headingId}>
            <h3 id={headingId} className="sr-only">
                {t('Files')}
            </h3>
            {add ? (
                <div className="tab-actions">
                    <button type="button" className="btn" onClick={add}>
                        <Icon name="file-up" size={16} />
                        <span>{t('Add files')}</span>
                    </button>
                </div>
            ) : null}
            <FilesPages
                of={of}
                label={'context' in of ? t('Files in {{name}}, newest first', { name }) : t('Files by {{name}}, newest first', { name })}
                empty={'context' in of ? t('No files in {{name}} yet', { name }) : t('{{name}} hasn’t added files', { name })}
                selectedId={route.detail?.kind === 'file' ? route.detail.id : null}
            />
        </section>
    );
}
