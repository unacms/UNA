/**
 * The frame every item's detail pane has (a post, poll, video, photo, album, file, discussion,
 * task): the pane with its title, the toolbar (the pane's own buttons, Open in New Window, More,
 * Close), the live region, and the item's three states before it is drawn: loading (a skeleton),
 * gone or not to be seen (an empty state with Close), and failed (the reason and Try again).
 * The pane gives the query and draws the item; this draws the rest the same way everywhere.
 */
import type { ReactNode } from 'react';

import { EmptyState } from '../components/empty-state';
import { Icon, type IconName } from '../components/icon';
import { Tooltip } from '../components/tooltip';
import { isGone } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { goneWords } from '../lib/gone';
import { t } from '../lib/i18n';
import { useCopyLink } from '../lib/copy-link';
import { isSecondaryWindow } from '../lib/native';
import { type MenuEntry, showMenu, useMenuExpanded } from '../lib/native-menu';
import { useNavigation } from '../lib/navigation';
import { openInWindowEntry, useOpenInWindow } from '../lib/open-in-window';
import type { DetailRoute } from '../lib/router';
import { CloseDetailButton, Pane, ToolbarButton } from './pane';

/** What a pane's live region says now (feed-list.ts useAnnouncer). */
export type Announcement = { text: string; seq: number };

/** The item's query, as react-query gives it: only what the frame reads. */
export type DetailQuery<T> = {
    data: T | undefined;
    error: unknown;
    isError: boolean;
    isLoading: boolean;
    isFetching: boolean;
    refetch: () => unknown;
};

/** The item kinds this frame draws, with the noun lib/gone.ts says them by. */
export type DetailNoun = 'post' | 'poll' | 'video' | 'photo' | 'album' | 'file' | 'discussion' | 'task';

/** The More button's name for each kind: "More for the poll". */
const MORE_LABELS: Record<DetailNoun, () => string> = {
    post: () => t('More for the post'),
    poll: () => t('More for the poll'),
    video: () => t('More for the video'),
    photo: () => t('More for the photo'),
    album: () => t('More for the album'),
    file: () => t('More for the file'),
    discussion: () => t('More for the discussion'),
    task: () => t('More for the task'),
};

/** The More button of the detail pane showing this kind (focus goes back to it after an edit). */
export function moreButton(noun: DetailNoun): HTMLElement | null {
    return document.querySelector<HTMLElement>(`[data-more="${noun}"]`);
}

/** Focus the More button once the edit form it opened has gone. */
export function focusMoreButton(noun: DetailNoun): void {
    requestAnimationFrame(() => moreButton(noun)?.focus());
}

type Props<T> = {
    /** Which item: Open in New Window opens it, Close forgets it. */
    detail: DetailRoute & { kind: string; id: string };
    noun: DetailNoun;
    /** The icon of the empty state when the item is gone. */
    icon: IconName;
    query: DetailQuery<T>;
    /** The item, once there is one to draw (undefined while loading, gone or failed). */
    item: T | undefined;
    title: string;
    /** The item is in a group or another context (the "you can't see it" text says so). */
    inContext?: boolean;
    /** The heading hides until the item's own heading has scrolled under the toolbar. */
    heroTitle?: boolean;
    announcement: Announcement;
    /** Says something in the pane's live region (Copy Link's outcome). */
    announce: (text: string) => void;
    /** The class of the body around the item ("thread poll-detail"). */
    className: string;
    /** Buttons of the pane before Open in New Window (Download, Add Photos, the task's arrows). */
    tools?: ReactNode;
    /**
     * The More menu: `link` is the item's address for Copy Link, `lead` comes before Copy Link
     * (Download…), `own` after a separator (Edit, Delete). With an item only.
     */
    more?: (item: T) => { link?: string | null; lead?: MenuEntry[]; own?: MenuEntry[] };
    /** What the pane draws above the states (a form that replaces the item, for one). */
    before?: ReactNode;
    children: (item: T) => ReactNode;
};

export function DetailShell<T>({ detail, noun, icon, query, item, title, inContext = false, heroTitle = true, announcement, announce, className, tools, more, before, children }: Props<T>) {
    const { forget } = useNavigation();
    const openInWindow = useOpenInWindow();
    const owner = `${noun}-more-${detail.id}`;
    const moreOpen = useMenuExpanded(owner);
    const gone = query.isError && isGone(query.error);
    const copy = useCopyLink(announce);

    const entries = (shown: T): MenuEntry[] => {
        const parts = more?.(shown) ?? {};
        const out: MenuEntry[] = [];
        if (openInWindow) out.push(openInWindowEntry(() => openInWindow(detail)));
        out.push(...(parts.lead ?? []));
        const link = parts.link;
        if (link) out.push({ text: t('Copy Link'), run: () => copy(link) });
        if (parts.own?.length) out.push('separator', ...parts.own);
        return out;
    };

    const actions = (
        <>
            {item !== undefined ? tools : null}
            {openInWindow && item !== undefined ? <ToolbarButton icon="app-window" label={t('Open in New Window')} commandId="open-in-window" onClick={() => openInWindow(detail)} /> : null}
            {more && item !== undefined ? (
                <Tooltip text={t('More')}>
                    <button
                        type="button"
                        className="tb-btn"
                        data-more={noun}
                        aria-label={MORE_LABELS[noun]()}
                        aria-haspopup="menu"
                        aria-expanded={moreOpen}
                        onClick={(e) => void showMenu(entries(item), { anchor: e.currentTarget }, { label: title, owner })}
                    >
                        <Icon name="ellipsis" />
                    </button>
                </Tooltip>
            ) : null}
            <CloseDetailButton />
        </>
    );

    return (
        <Pane pane="detail" title={title} hideTitle={item !== undefined && heroTitle ? 'until-scrolled' : undefined} actions={actions} ready={item !== undefined} busy={query.isLoading}>
            <div className={className}>
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement.text ? <span key={announcement.seq}>{announcement.text}</span> : null}
                </p>
                {before}
                {query.isLoading ? <div className="skeleton" aria-hidden="true" /> : null}
                {gone ? (
                    <EmptyState
                        {...goneWords(query.error, noun, icon, inContext)}
                        actions={
                            <button type="button" className="btn btn-primary" onClick={() => forget(detail)}>
                                {isSecondaryWindow ? t('Close window') : t('Close')}
                            </button>
                        }
                    />
                ) : query.isError ? (
                    <div className="inline-error" role="alert">
                        <p className="inline-error-text">
                            <Icon name="circle-alert" size={20} />
                            <span>{errorMessage(query.error)}</span>
                        </p>
                        <button type="button" className="btn" onClick={() => void query.refetch()} aria-busy={query.isFetching}>
                            {t('Try again')}
                        </button>
                    </div>
                ) : null}
                {item !== undefined ? children(item) : null}
            </div>
        </Pane>
    );
}
