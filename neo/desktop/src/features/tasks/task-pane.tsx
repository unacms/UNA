import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

import { EmptyState } from '../../components/empty-state';
import { Icon } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { RichText } from '../../components/rich-text';
import { Tooltip } from '../../components/tooltip';
import { longTime } from '../../components/activity-card';
import { ago, ApiError, ensureOk, isGone, retryOnce, unwrap } from '../../lib/api';
import { useWindowAnnounce } from '../../lib/announce';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { goneWords } from '../../lib/gone';
import { t } from '../../lib/i18n';
import { rich } from '../../lib/i18n-rich';
import { confirmAction, isSecondaryWindow } from '../../lib/native';
import { type MenuEntry, showMenu, useMenuExpanded } from '../../lib/native-menu';
import { useNavigation } from '../../lib/navigation';
import { openInWindowEntry, useOpenInWindow } from '../../lib/open-in-window';
import { useCopyLink } from '../../lib/copy-link';
import { CloseDetailButton, Pane, ToolbarButton } from '../../shell/pane';
import { useAnnouncer } from '../feed/feed-list';
import { SideColumns } from '../page-blocks/side-columns';
import { EntryActions, EntryComments, useEntryItem } from '../photos/entry-item';
import { ProfileName } from '../profile/profile-link';
import { neighbours, subscribeTaskOrder, taskOrder } from './board';
import { TaskCheck } from './task-list';
import { TaskProperties, TaskPropertyChips, useTaskKeys } from './task-props';
import { dropTask, dueText, isOverdue, type Task, taskFromLists, taskKey, taskListsKey } from './tasks';

/** A profile with its badges after the name. */
function Person({ profile }: { profile: NonNullable<Task['author']> }) {
    return (
        <span className={profile.badges?.length ? 'with-badges' : undefined}>
            <ProfileName profile={profile} />
            <ProfileBadges badges={profile.badges} />
        </span>
    );
}

/**
 * The padding of a task's detail and the gap between its columns (styles.css .thread.task-detail
 * and .task-detail-grid[data-columns='side']): 24 + 16 + 24.
 */
const DETAIL_CHROME = 64;

/**
 * A task's text, reactions and comments, with its properties: a side card beside them where the
 * pane has room for both (the side column of every page, its divider and its width), chips
 * under the title where it has not. The docked comment box stays in the main column.
 */
function TaskDetail({
    task,
    readAt,
    activity,
    itemId,
    onCopyLink,
    announce,
}: {
    task: Task;
    readAt: number;
    activity: ReturnType<typeof useEntryItem>;
    itemId: string | null;
    onCopyLink: (url: string) => void;
    announce: (text: string) => void;
}) {
    const due = dueText(task);
    const overdue = isOverdue(task);
    const author = task.author;
    return (
        <SideColumns className="task-detail-grid" chrome={DETAIL_CHROME} side={<TaskProperties task={task} readAt={readAt} announce={announce} />} sideClassName="task-props-side" sideOffset={8}>
            {(wide) => (
                <div className="task-detail-main">
                    <article className="video-post" aria-labelledby="detail-title">
                        <div className="task-head" data-completed={task.completed || undefined}>
                            <TaskCheck task={task} announce={announce} size="large" />
                            <div className="profile-name video-heading task-heading" aria-hidden="true" dir="auto">
                                {task.title}
                            </div>
                        </div>
                        {wide ? null : <TaskPropertyChips task={task} readAt={readAt} announce={announce} />}
                        <p className="task-detail-where muted">
                            {task.context ? (
                                <>
                                    <ProfileName profile={task.context} />
                                    {task.list_title ? <span>{` · ${task.list_title}`}</span> : null}
                                    <span>{' · '}</span>
                                </>
                            ) : null}
                            <span>
                                {task.completed ? t('Completed') : overdue ? <strong className="task-overdue">{t('Overdue')}</strong> : t('Open', { context: 'state' })}
                                {due && !task.completed ? <span>{`, ${t('due {{when}}', { when: due })}`}</span> : null}
                            </span>
                            <span>{' · '}</span>
                            {rich(author ? (wide ? t('Added by <who>name</who>') : t('Added by <who>name</who> <when>time</when>')) : wide ? t('Added by someone') : t('Added by someone <when>time</when>'), {
                                who: () => (author ? <Person profile={author} /> : null),
                                when: () => (
                                    <time dateTime={task.created_at} title={longTime(task.created_at)}>
                                        {ago(task.created_at)}
                                    </time>
                                ),
                            })}
                            {!wide && task.updated_at !== task.created_at ? (
                                <>
                                    <span>{' · '}</span>
                                    {rich(t('Updated <when>time</when>'), {
                                        when: () => (
                                            <time dateTime={task.updated_at} title={longTime(task.updated_at)}>
                                                {ago(task.updated_at)}
                                            </time>
                                        ),
                                    })}
                                </>
                            ) : null}
                        </p>
                        {task.body_html ? <RichText html={task.body_html} className="discussion-body" /> : null}
                        <EntryActions activity={activity.data} url={task.url} onCopyLink={onCopyLink} onError={announce} />
                    </article>
                    <EntryComments itemId={itemId} activity={activity.data} error={activity.error} loading={activity.isLoading} />
                </div>
            )}
        </SideColumns>
    );
}

/**
 * A task in the detail pane (or a window of its own): its checkbox (completing it is said),
 * where it is (its context and list), when it is due (marked when overdue), who it is assigned
 * to and who added it (badges after their names), its priority and state, its text, and its
 * reactions and comments (its Item's), where the site also logs what was done to it. More has
 * Open in New Window, Copy Link and, for who may, Delete.
 */
export function TaskPane({ id }: { id: string }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const { forget, openDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const announceInWindow = useWindowAnnounce();
    const [announcement, announce] = useAnnouncer();
    const task = useQuery({
        queryKey: taskKey(id),
        queryFn: async () => unwrap(await api.GET('/tasks/{id}', { params: { path: { id } } })),
        initialData: () => taskFromLists(queryClient, id),
        // what a list had is old and without its text: show it and fetch the current one
        initialDataUpdatedAt: 0,
        retry: retryOnce,
    });
    const gone = task.isError && isGone(task.error);
    const current = gone ? undefined : task.data;
    const itemId = current?.content_id ?? null;
    const activity = useEntryItem(itemId, current?.stats.comments, taskKey(id));
    const moreOwner = `task-more-${id}`;
    const moreOpen = useMenuExpanded(moreOwner);

    const remove = async () => {
        if (!current) return;
        const ok = await confirmAction({ title: t('Delete this task?'), message: t('It is deleted for everyone, with its comments. This cannot be undone.'), okLabel: t('Delete') });
        if (!ok) return;
        try {
            ensureOk(await api.DELETE('/tasks/{id}', { params: { path: { id } } }));
        } catch (e) {
            if (!(e instanceof ApiError && e.status === 404)) {
                announce(t('Could not delete it: {{reason}}', { reason: errorMessage(e) }));
                return;
            }
        }
        announceInWindow(t('Task deleted'));
        dropTask(queryClient, id);
        if (current.context_id) void queryClient.invalidateQueries({ queryKey: taskListsKey(current.context_id) });
        forget({ kind: 'task', id });
    };

    const copyLink = useCopyLink(announce);

    const moreEntries = (): MenuEntry[] => {
        if (!current) return [];
        const out: MenuEntry[] = [];
        if (openInWindow) out.push(openInWindowEntry(() => openInWindow({ kind: 'task', id })));
        const url = current.url;
        if (url) out.push({ text: t('Copy Link'), run: () => copyLink(url) });
        if (current.viewer?.can_delete) out.push('separator', { text: t('Delete Task…'), run: () => void remove() });
        return out;
    };

    const title = current?.title || t('Task');
    // the list shown beside it: where this task is in it, and the ones before and after it
    const order = useSyncExternalStore(subscribeTaskOrder, taskOrder, taskOrder);
    const place = neighbours(order, id);
    const move = (step: 1 | -1) => {
        const to = step === 1 ? place.next : place.previous;
        if (to) openDetail({ kind: 'task', id: to });
        else announce(step === 1 ? t('This is the last task of the list') : t('This is the first task of the list'));
    };
    const onKeyDown = useTaskKeys(current, move);
    const actions = (
        <>
            {place.index >= 0 && !isSecondaryWindow ? (
                <>
                    <span className="task-place" aria-label={t('Task {{n}} of {{total}}', { n: place.index + 1, total: place.total })}>
                        {place.index + 1} / {place.total}
                    </span>
                    <ToolbarButton icon="arrow-up" label={t('Previous Task ({{key}})', { key: 'K' })} disabled={!place.previous} note={t('The first task of the list')} onClick={() => move(-1)} />
                    <ToolbarButton icon="arrow-down" label={t('Next Task ({{key}})', { key: 'J' })} disabled={!place.next} note={t('The last task of the list')} onClick={() => move(1)} />
                </>
            ) : null}
            {openInWindow && current ? <ToolbarButton icon="app-window" label={t('Open in New Window')} commandId="open-in-window" onClick={() => openInWindow({ kind: 'task', id })} /> : null}
            {current ? (
                <Tooltip text={t('More')}>
                    <button type="button" className="tb-btn" aria-label={t('More for the task')} aria-haspopup="menu" aria-expanded={moreOpen} onClick={(e) => void showMenu(moreEntries(), { anchor: e.currentTarget }, { label: title, owner: moreOwner })}>
                        <Icon name="ellipsis" />
                    </button>
                </Tooltip>
            ) : null}
            <CloseDetailButton />
        </>
    );
    return (
        <Pane pane="detail" title={title} hideTitle={current ? 'until-scrolled' : undefined} actions={actions} ready={!!current} busy={task.isLoading}>
            <div className="thread task-detail" onKeyDown={onKeyDown}>
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                {task.isLoading ? <div className="skeleton" aria-hidden="true" /> : null}
                {gone ? (
                    <EmptyState
                        {...goneWords(task.error, 'task', 'list-checks', !!task.data?.context_id)}
                        actions={
                            <button type="button" className="btn btn-primary" onClick={() => forget({ kind: 'task', id })}>
                                {isSecondaryWindow ? t('Close window') : t('Close')}
                            </button>
                        }
                    />
                ) : task.isError ? (
                    <div className="inline-error" role="alert">
                        <p className="inline-error-text">
                            <Icon name="circle-alert" size={20} />
                            <span>{errorMessage(task.error)}</span>
                        </p>
                        <button type="button" className="btn" onClick={() => void task.refetch()} aria-busy={task.isFetching}>
                            {t('Try again')}
                        </button>
                    </div>
                ) : null}
                {current ? <TaskDetail task={current} readAt={task.dataUpdatedAt} activity={activity} itemId={itemId} onCopyLink={copyLink} announce={announce} /> : null}
            </div>
        </Pane>
    );
}
