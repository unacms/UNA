/**
 * What each command does in the signed-in window: the ones a menu, a shortcut or the palette
 * sends that App does not handle itself.
 */
import { useQueryClient } from '@tanstack/react-query';
import { type RefObject, useCallback } from 'react';

import { NEW_POST_FIELD, useCompose } from '../features/compose/compose-sheet';
import { SEARCH_FIELD } from '../features/search/search-view';
import { focusTaskAdd } from '../features/tasks/task-list';
import { commentBoxId } from '../features/thread/comment-tree';
import { useApp } from '../lib/context';
import { errorMessage } from '../lib/errors';
import { canCommentOn, focusedPost, focusWhenPresent, openFocusedAuthor, replyToFocusedComment, toggleFocusedReaction } from '../lib/focused-entry';
import { t } from '../lib/i18n';
import { focusInListPane, isListCommand, type ListCommandHandler } from '../lib/list-commands';
import { openExternal } from '../lib/native';
import { useActiveTab, useNavigation } from '../lib/navigation';
import { opensInWindow, useOpenInWindow } from '../lib/open-in-window';
import { type DetailRoute, pageDetail, type Section, sectionRoute, settingsRoute } from '../lib/router';
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

export function useShellCommands({ siteUrl, profileId, announce, paletteOpen, setPaletteOpen, toggleSidebar, hideSidebar, focusAfterNavigation, cyclePane, listCommands }: Options): CommandHandler {
    const compose = useCompose();
    const { history, go, openDetail, closeDetail } = useNavigation();
    const openInWindow = useOpenInWindow();
    const app = useApp();
    const queryClient = useQueryClient();
    const tabs = useActiveTab()?.tabs ?? null;

    return useCallback<CommandHandler>(
        (id) => {
            // c (and r on a post): the focused post's comment box, here in the thread or in the thread it opens
            const commentOnFocusedPost = () => {
                const post = focusedPost();
                const itemId = post?.dataset.itemId;
                const postId = post?.dataset.id;
                if (!post || !itemId || !postId) return;
                // a post of the Posts module opens its own view, which has the same comments
                const articleId = post.dataset.articleId;
                const detail: DetailRoute = articleId ? { kind: 'article', id: articleId } : { kind: 'post', id: postId };
                const isOpen = () => {
                    const open = history.current.detail;
                    return open?.kind === detail.kind && open.id === detail.id;
                };
                if (!canCommentOn(post)) {
                    // nothing to go to: the thread opens (its heading takes focus) and says why
                    announce(t('Comments are closed on this post'));
                    if (!isOpen()) openDetail(detail);
                    return;
                }
                const box = document.getElementById(commentBoxId(itemId));
                if (post.closest('[data-pane="detail"]') && box) {
                    box.focus();
                    return;
                }
                // the thread may still be loading, or refuse the post: then its heading gets focus
                if (isOpen()) focusWhenPresent(commentBoxId(itemId), 3000, paneHeadingId('detail'));
                else {
                    focusAfterNavigation(commentBoxId(itemId));
                    openDetail(detail);
                }
            };

            if (id === 'command-palette') {
                // open already (a menu click reaches here): back to its field
                if (paletteOpen) document.querySelector<HTMLElement>('.palette input')?.focus();
                else setPaletteOpen(true);
                return;
            }
            // a menu command chosen while the palette is open acts on the window: the palette goes first
            if (paletteOpen) setPaletteOpen(false);

            const section = SECTION_COMMANDS[id];
            if (section) {
                go(section);
                return;
            }
            if (isListCommand(id)) {
                if (focusInListPane()) listCommands.current?.(id);
                return;
            }
            const n = tabNumber(id);
            if (n !== null) {
                if (tabs && !tabs.selectNumber(n)) announce(t('No tab {{n}}', { n }));
                return;
            }
            switch (id) {
                case 'open-settings': {
                    // open already: its heading (and the part shown), else Account
                    const open = history.current;
                    if (open.list.section === 'settings' && open.detail) focusHeading('detail');
                    else history.push(settingsRoute());
                    return;
                }
                case 'toggle-sidebar':
                    toggleSidebar();
                    return;
                case 'hide-sidebar':
                    hideSidebar();
                    return;
                case 'new-tab':
                    if (!tabs) return;
                    if (!tabs.open(sectionRoute('home'), { title: t('Home'), icon: 'house' })) announce(t('Too many tabs open: close one first'));
                    return;
                case 'close-tab': {
                    if (!tabs) return;
                    const tab = tabs.active;
                    if (!tabs.close(tab.id, () => announce(t('Closed {{title}}', { title: tabTitle(tab) })))) announce(t('The last tab stays open'));
                    return;
                }
                case 'reopen-tab':
                    if (!tabs) return;
                    if (!tabs.reopen()) announce(tabs.canReopen ? t('Too many tabs open: close one first') : t('No closed tab to reopen'));
                    return;
                case 'next-tab':
                    tabs?.selectNext(1);
                    return;
                case 'previous-tab':
                    tabs?.selectNext(-1);
                    return;
                case 'new-post':
                    // on a context's Tasks tab: a task in the list focus is in (its add field)
                    if (!compose?.isOpen && focusTaskAdd()) return;
                    // the compose sheet, over whatever is shown; open already, its text box
                    if (compose?.isOpen) document.getElementById(NEW_POST_FIELD)?.focus();
                    else compose?.open();
                    return;
                case 'open-in-window': {
                    // the open conversation or post, else the profile or group page shown
                    const detail = history.current.detail ?? pageDetail(history.current.list, profileId);
                    if (detail && opensInWindow(detail) && openInWindow) openInWindow(detail);
                    else announce(t('Nothing open goes in a window of its own'));
                    return;
                }
                case 'new-message':
                    // a new conversation, its recipient field focused, beside the inbox
                    history.push({ list: { section: 'messages' }, detail: { kind: 'new-message' } });
                    return;
                case 'back':
                    history.back();
                    return;
                case 'forward':
                    history.forward();
                    return;
                case 'close-detail':
                    closeDetail();
                    return;
                case 'go-search': {
                    // the field (the sidebar's, or the Search list's under an icon rail), with
                    // its words selected; Search opens first when it is not shown
                    const current = history.current;
                    const field = document.getElementById(SEARCH_FIELD);
                    if (current.list.section === 'search' && field instanceof HTMLInputElement && !field.closest('[inert], [hidden]')) {
                        field.focus();
                        field.select();
                        return;
                    }
                    focusAfterNavigation(SEARCH_FIELD);
                    go('search');
                    return;
                }
                case 'sign-out':
                    app.signOut();
                    return;
                case 'open-author':
                    openFocusedAuthor();
                    return;
                case 'react': {
                    // said once the site answered; a refusal shows (and is read) on the post itself
                    void toggleFocusedReaction()?.then((r) => {
                        if ('reacted' in r) announce(r.reacted ? t('Reacted') : t('Reaction taken back'));
                    });
                    return;
                }
                case 'comment':
                    commentOnFocusedPost();
                    return;
                case 'reply': {
                    if (replyToFocusedComment()) return;
                    // a focused post, in either pane: its own comment box
                    if (focusedPost()) {
                        commentOnFocusedPost();
                        return;
                    }
                    // elsewhere in the detail pane: the conversation's reply box, or the thread's comment box
                    const detail = paneElement('detail');
                    const active = document.activeElement;
                    if (!detail || !(active instanceof HTMLElement) || !detail.contains(active)) return;
                    detail.querySelector<HTMLElement>(`#${CONVERSATION_REPLY_FIELD}, [id^="comment-box-"]`)?.focus();
                    return;
                }
                case 'next-pane':
                    cyclePane(1);
                    return;
                case 'previous-pane':
                    cyclePane(-1);
                    return;
                case 'refresh':
                    announce(t('Refreshing…'));
                    // without throwOnError a failed query resolves the refetch all the same
                    void queryClient.refetchQueries({ type: 'active' }, { throwOnError: true }).then(
                        () => announce(t('Up to date')),
                        () => announce(t('Could not refresh')),
                    );
                    return;
                case 'open-site':
                    void openExternal(siteUrl).catch((e: unknown) => announce(errorMessage(e)));
                    return;
                default:
                    return;
            }
        },
        [go, history, openDetail, closeDetail, cyclePane, queryClient, siteUrl, announce, compose, paletteOpen, setPaletteOpen, app, toggleSidebar, hideSidebar, openInWindow, profileId, tabs, focusAfterNavigation, listCommands],
    );
}
