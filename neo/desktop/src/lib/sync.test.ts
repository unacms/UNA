import { type InfiniteData, QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import type { Schema } from 'una-api';

import { announcementFor, applySync, clickedNotification, LOCAL_READ_WINDOW, markReadInCache, newNotifications, nextDelay, prependNotifications, type SyncAnswer } from './sync';

type Notification = Schema<'Notification'>;
type Page = Schema<'Page_Notification'>;

const n = (id: string, read = false): Notification => ({
    id,
    kind: 'social.comment',
    source: 'bx_timeline.commentPost',
    module: 'bx_timeline',
    actors: 1,
    text: `Notification ${id}`,
    object_kind: 'content',
    object_id: '12',
    data: { comment_id: '99' },
    read,
    created_at: '2026-11-06T10:00:00Z',
    updated_at: '2026-11-06T10:00:00Z',
});

const pages = (...lists: Notification[][]): InfiniteData<Page> => ({ pages: lists.map((items) => ({ items, next_cursor: null })), pageParams: lists.map(() => undefined) });

const answer = (fresh: Notification[], badges: Schema<'Badges'>, extra: Partial<SyncAnswer> = {}): SyncAnswer => ({
    cursor: 'c',
    // new notifications are changes of type notification
    changes: fresh.map((x) => ({ type: 'notification', id: x.id, version: `v${x.id}`, data: x })),
    more: false,
    reset: false,
    badges,
    lists: {},
    ...extra,
});

describe('the page’s half of the focus gate', () => {
    it('announces new notifications only when the OS did not show them and the page has focus', () => {
        expect(announcementFor(2, false, false, true)).toBe('2 new notifications');
        expect(announcementFor(1, false, false, true)).toBe('1 new notification');
        expect(announcementFor(10, true, false, true)).toBe('10+ new notifications');
        // the window was not focused, so Rust showed OS notifications: nothing to say here
        expect(announcementFor(2, false, true, true)).toBeNull();
        // nobody is reading the page
        expect(announcementFor(2, false, false, false)).toBeNull();
        expect(announcementFor(0, false, false, true)).toBeNull();
    });
});

describe('clicks on OS notifications', () => {
    it('open the notification for the profile it was shown for, and only for that one', () => {
        const shown = n('500');
        expect(clickedNotification({ notification: shown, profile_id: '4' }, '4')).toBe(shown);
        // the account switched to another profile since: the inbox opens, nothing is marked read
        expect(clickedNotification({ notification: shown, profile_id: '4' }, '8')).toBeNull();
        expect(clickedNotification({ notification: null, profile_id: '4' }, '4')).toBeNull();
        expect(clickedNotification(null, '4')).toBeNull();
        // a notification Rust could not place
        expect(clickedNotification({ notification: shown, profile_id: null }, '4')).toBe(shown);
    });
});

describe('the page’s own poll', () => {
    it('polls as often as the Rust one and backs off up to 10 minutes', () => {
        expect(nextDelay(0, true)).toBe(30_000);
        expect(nextDelay(0, false)).toBe(60_000);
        expect(nextDelay(1, true)).toBe(30_000);
        expect(nextDelay(3, true)).toBe(120_000);
        expect(nextDelay(50, true)).toBe(600_000);
    });
});

describe('sync answers in the caches', () => {
    it('put new notifications on top, once', () => {
        const before = pages([n('5'), n('4')], [n('3')]);
        const after = prependNotifications(before, [n('7'), n('6'), n('5')]);
        expect(after?.pages.map((p) => p.items.map((x) => x.id))).toEqual([['7', '6', '5', '4'], ['3']]);
        expect(prependNotifications(after, [n('7')])).toBe(after);
        expect(prependNotifications(undefined, [n('7')])).toBeUndefined();
    });

    it('go into both inbox lists, the unread list taking only unread ones', () => {
        const client = new QueryClient();
        client.setQueryData(['notifications', 'all'], pages([n('5')]));
        client.setQueryData(['notifications', 'unread'], pages([n('5')]));
        applySync(client, answer([n('7'), n('6', true)], { notifications: 2 }), { notifications: 1 });
        expect(client.getQueryData<InfiniteData<Page>>(['notifications', 'all'])?.pages[0]?.items.map((x) => x.id)).toEqual(['7', '6', '5']);
        expect(client.getQueryData<InfiniteData<Page>>(['notifications', 'unread'])?.pages[0]?.items.map((x) => x.id)).toEqual(['7', '5']);
    });

    it('refetch a list whose count changed elsewhere', () => {
        const client = new QueryClient();
        const invalidate = vi.spyOn(client, 'invalidateQueries');
        const badges = { notifications: 3, messages: 1, friend_requests: 0 };
        // the first answer only sets the counts
        applySync(client, answer([], badges), null);
        expect(invalidate).not.toHaveBeenCalled();
        // the same counts: nothing
        applySync(client, answer([], badges), badges);
        expect(invalidate).not.toHaveBeenCalled();
        // read on the site, a message came, a request was answered there
        applySync(client, answer([], { notifications: 0, messages: 2, friend_requests: 1 }), badges);
        expect(invalidate.mock.calls.map((c) => c[0])).toEqual([['notifications'], ['conversations'], ['conversation'], ['friend-requests']]);
    });

    it('take a lower count right after marking read here as that, keeping the lists (and focus in them)', () => {
        const client = new QueryClient();
        const invalidate = vi.spyOn(client, 'invalidateQueries');
        const before = { notifications: 3 };
        markReadInCache(client, '8', 1_000);
        applySync(client, answer([], { notifications: 1 }), before, 2_000);
        expect(invalidate).not.toHaveBeenCalled();
        // long after: read elsewhere
        applySync(client, answer([], { notifications: 0 }), { notifications: 1 }, 1_000 + LOCAL_READ_WINDOW);
        expect(invalidate.mock.calls.map((c) => c[0])).toEqual([['notifications']]);
    });

    it('reload the inbox after a reset, or when more came than one answer brings', () => {
        const client = new QueryClient();
        const invalidate = vi.spyOn(client, 'invalidateQueries');
        applySync(client, answer([], { notifications: 1 }, { reset: true }), null);
        applySync(client, answer([n('9')], { notifications: 1 }, { more: true }), null);
        expect(invalidate.mock.calls.map((c) => c[0])).toEqual([['notifications'], ['notifications']]);
    });

    it('take the notifications of the changes, and skip other types and tombstones', () => {
        const a = answer([n('9')], { notifications: 1 });
        a.changes.push({ type: 'activity', id: '5', version: 'x', data: { id: '5' } }, { type: 'notification', id: '8', gone: true });
        expect(newNotifications(a).map((x) => x.id)).toEqual(['9']);
    });

    it('mark one read with the older ones, or all of them', () => {
        const client = new QueryClient();
        client.setQueryData(['notifications', 'all'], pages([n('9'), n('8')], [n('7'), n('3')]));
        markReadInCache(client, '8');
        const read = () => client.getQueryData<InfiniteData<Page>>(['notifications', 'all'])?.pages.flatMap((p) => p.items.map((x) => [x.id, x.read]));
        expect(read()).toEqual([
            ['9', false],
            ['8', true],
            ['7', true],
            ['3', true],
        ]);
        markReadInCache(client, null);
        expect(read()?.every(([, r]) => r)).toBe(true);
    });
});
