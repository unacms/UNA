/**
 * What each command does in the signed-in window: the ones a menu, a shortcut or the palette
 * sends that App does not handle itself.
 */
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { type RefObject, useCallback } from 'react';

import { NEW_POST_FIELD, useCompose } from '../features/compose/compose-sheet';
import { SEARCH_FIELD } from '../features/search/search-view';
import { focusTaskAdd } from '../features/tasks/tasks';
import { commentBoxId } from '../features/thread/comment-tree';
import { useApp } from '../lib/context';
import { errorMessage } from '../lib/errors';
import { canCommentOn, focusedPost, focusWhenPresent, openFocusedAuthor, replyToFocusedComment, toggleFocusedReaction } from '../lib/focused-entry';
import { t } from '../lib/i18n';
import { focusInListPane, isListCommand, type ListCommandHandler } from '../lib/list-commands';
import { openExternal } from '../lib/native';
import { type Navigation, useActiveTab, useNavigation } from '../lib/navigation';
import { opensInWindow, useOpenInWindow } from '../lib/open-in-window';
import type { TabsModel } from '../lib/tabs';
import { type DetailRoute, pageDetail, type RouteHistory, type Section, sectionRoute, settingsRoute } from '../lib/router';
import { type CommandId, tabNumber } from '../lib/shortcuts';
import { CONVERSATION_REPLY_FIELD } from '../screens/conversation';
import { paneHeadingId } from './pane';
import { tabTitle } from './tab-strip';
import { focusHeading, paneElement } from './use-shell-focus';

/** Runs a command the app shell handles; App sends it the ones it doesn't handle itself. */
export type CommandHandler = (id: CommandId) => void;

const SECTION_COMMANDS: Partial<Record<CommandId, Section>> = { 'go-home': 'home', 'go-explore': 'explore', 'go-notifications': 'notifications', 'go-messages': 'messages', 'go-profile': 'profile' };

type Options = {
    siteUrl: string;
    /** The acting profile's id: its own page is what Open in New Window takes from a profile page without one. */
    profileId?: string;
    announce: (text: string) => void;
    paletteOpen: boolean;
    setPaletteOpen: (open: boolean) => void;
    toggleSidebar: () => void;
    hideSidebar: () => void;
    /** Names an element to focus after the navigation a command starts (use-shell-focus.ts). */
    focusAfterNavigation: (id: string) => void;
    cyclePane: (step: 1 | -1) => void;
    /** The list the list commands (j, k, o, .) act on. */
    listCommands: RefObject<ListCommandHandler | null>;
};

/** What a command acts on: the shell's own (Options) and what the window gives every part of it. */
type Scope = Options & {
    history: RouteHistory;
    go: Navigation['go'];
    openDetail: Navigation['openDetail'];
    closeDetail: Navigation['closeDetail'];
    compose: ReturnType<typeof useCompose>;
    openInWindow: ReturnType<typeof useOpenInWindow>;
    signOut: () => void;
    queryClient: QueryClient;
    tabs: TabsModel | null;
};

/** c (and r on a post): the focused post's comment box, here in the thread or in the thread it opens. */
function commentOnFocusedPost({ history, announce, openDetail, focusAfterNavigation }: Scope): void {
    const post = focusedPost();
    const itemId = post?.dataset.itemId;
    const postId = post?.dataset.id;
    if (!post || !itemId || !postId) return;
    // a post of the Posts module opens its own view, which has the same comments
    const articleId = post.dataset.articleId;
    const detail: DetailRoute = articleId ? { kind: 'article', id: articleId } : { kind: 'post', id: postId };
    const open = history.current.detail;
    const isOpen = open?.kind === detail.kind && open.id === detail.id;
    if (!canCommentOn(post)) {
        // nothing to go to: the thread opens (its heading takes focus) and says why
        announce(t('Comments are closed on this post'));
        if (!isOpen) openDetail(detail);
        return;
    }
    const box = document.getElementById(commentBoxId(itemId));
    if (post.closest('[data-pane="detail"]') && box) {
        box.focus();
        return;
    }
    // the thread may still be loading, or refuse the post: then its heading gets focus
    if (isOpen) focusWhenPresent(commentBoxId(itemId), 3000, paneHeadingId('detail'));
    else {
        focusAfterNavigation(commentBoxId(itemId));
        openDetail(detail);
    }
}

/** r: a reply to the focused comment, else the focused post's comment box, else the open detail's reply box. */
function reply(scope: Scope): void {
    if (replyToFocusedComment()) return;
    // a focused post, in either pane: its own comment box
    if (focusedPost()) {
        commentOnFocusedPost(scope);
        return;
    }
    // elsewhere in the detail pane: the conversation's reply box, or the thread's comment box
    const detail = paneElement('detail');
    const active = document.activeElement;
    if (!detail || !(active instanceof HTMLElement) || !detail.contains(active)) return;
    detail.querySelector<HTMLElement>(`#${CONVERSATION_REPLY_FIELD}, [id^="comment-box-"]`)?.focus();
}

/** The search field (the sidebar's, or the Search list's under an icon rail) with its words selected; Search opens first when it is not shown. */
function goSearch({ history, go, focusAfterNavigation }: Scope): void {
    const field = document.getElementById(SEARCH_FIELD);
    if (history.current.list.section === 'search' && field instanceof HTMLInputElement && !field.closest('[inert], [hidden]')) {
        field.focus();
        field.select();
        return;
    }
    focusAfterNavigation(SEARCH_FIELD);
    go('search');
}

/** Cmd+N: a task on a context's Tasks tab (its add field), else the compose sheet (open already: its text box). */
function newPost({ compose }: Scope): void {
    if (!compose?.isOpen && focusTaskAdd()) return;
    if (compose?.isOpen) document.getElementById(NEW_POST_FIELD)?.focus();
    else compose?.open();
}

/** The open conversation or post, else the profile or group page shown, in a window of its own. */
function openInOwnWindow({ history, profileId, openInWindow, announce }: Scope): void {
    const detail = history.current.detail ?? pageDetail(history.current.list, profileId);
    if (detail && opensInWindow(detail) && openInWindow) openInWindow(detail);
    else announce(t('Nothing open goes in a window of its own'));
}

function closeTab({ tabs, announce }: Scope): void {
    if (!tabs) return;
    const tab = tabs.active;
    if (!tabs.close(tab.id, () => announce(t('Closed {{title}}', { title: tabTitle(tab) })))) announce(t('The last tab stays open'));
}

function reopenTab({ tabs, announce }: Scope): void {
    if (!tabs || tabs.reopen()) return;
    announce(tabs.canReopen ? t('Too many tabs open: close one first') : t('No closed tab to reopen'));
}

function refresh({ queryClient, announce }: Scope): void {
    announce(t('Refreshing…'));
    // without throwOnError a failed query resolves the refetch all the same
    void queryClient.refetchQueries({ type: 'active' }, { throwOnError: true }).then(
        () => announce(t('Up to date')),
        () => announce(t('Could not refresh')),
    );
}

/** What each command does; a command with no entry here is App's, or nothing in this window. */
const COMMANDS: Partial<Record<CommandId, (scope: Scope) => void>> = {
    // open already: its heading (and the part shown), else Account
    'open-settings': ({ history }) => {
        const open = history.current;
        if (open.list.section === 'settings' && open.detail) focusHeading('detail');
        else history.push(settingsRoute());
    },
    'toggle-sidebar': ({ toggleSidebar }) => toggleSidebar(),
    'hide-sidebar': ({ hideSidebar }) => hideSidebar(),
    'new-tab': ({ tabs, announce }) => {
        if (tabs && !tabs.open(sectionRoute('home'), { title: t('Home'), icon: 'house' })) announce(t('Too many tabs open: close one first'));
    },
    'close-tab': closeTab,
    'reopen-tab': reopenTab,
    'next-tab': ({ tabs }) => tabs?.selectNext(1),
    'previous-tab': ({ tabs }) => tabs?.selectNext(-1),
    'new-post': newPost,
    'open-in-window': openInOwnWindow,
    // a new conversation, its recipient field focused, beside the inbox
    'new-message': ({ history }) => history.push({ list: { section: 'messages' }, detail: { kind: 'new-message' } }),
    back: ({ history }) => history.back(),
    forward: ({ history }) => history.forward(),
    'close-detail': ({ closeDetail }) => closeDetail(),
    'go-search': goSearch,
    'sign-out': ({ signOut }) => signOut(),
    'open-author': () => openFocusedAuthor(),
    // said once the site answered; a refusal shows (and is read) on the post itself
    react: ({ announce }) =>
        void toggleFocusedReaction()?.then((r) => {
            if ('reacted' in r) announce(r.reacted ? t('Reacted') : t('Reaction taken back'));
        }),
    comment: commentOnFocusedPost,
    reply,
    'next-pane': ({ cyclePane }) => cyclePane(1),
    'previous-pane': ({ cyclePane }) => cyclePane(-1),
    refresh,
    'open-site': ({ siteUrl, announce }) => void openExternal(siteUrl).catch((e: unknown) => announce(errorMessage(e))),
};

/** The commands that are a family, not one entry: a section's, the list's (j, k, o, .), a tab's number. True when `id` was one. */
function runFamily(id: CommandId, { go, listCommands, tabs, announce }: Scope): boolean {
    const section = SECTION_COMMANDS[id];
    if (section) {
        go(section);
        return true;
    }
    if (isListCommand(id)) {
        if (focusInListPane()) listCommands.current?.(id);
        return true;
    }
    const n = tabNumber(id);
    if (n === null) return false;
    if (tabs && !tabs.selectNumber(n)) announce(t('No tab {{n}}', { n }));
    return true;
}

export function useShellCommands(options: Options): CommandHandler {
    const compose = useCompose();
    const { history, go, openDetail, closeDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const { signOut } = useApp();
    const queryClient = useQueryClient();
    const tabs = useActiveTab()?.tabs ?? null;
    const { siteUrl, profileId, announce, paletteOpen, setPaletteOpen, toggleSidebar, hideSidebar, focusAfterNavigation, cyclePane, listCommands } = options;

    return useCallback<CommandHandler>(
        (id) => {
            if (id === 'command-palette') {
                // open already (a menu click reaches here): back to its field
                if (paletteOpen) document.querySelector<HTMLElement>('.palette input')?.focus();
                else setPaletteOpen(true);
                return;
            }
            // a menu command chosen while the palette is open acts on the window: the palette goes first
            if (paletteOpen) setPaletteOpen(false);

            const scope: Scope = { siteUrl, profileId, announce, paletteOpen, setPaletteOpen, toggleSidebar, hideSidebar, focusAfterNavigation, cyclePane, listCommands, history, go, openDetail, closeDetail, compose, openInWindow, signOut, queryClient, tabs };
            if (!runFamily(id, scope)) COMMANDS[id]?.(scope);
        },
        [go, history, openDetail, closeDetail, cyclePane, queryClient, siteUrl, announce, compose, paletteOpen, setPaletteOpen, signOut, toggleSidebar, hideSidebar, openInWindow, profileId, tabs, focusAfterNavigation, listCommands],
    );
}
