import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { actionRequest, afterGraphChange, announcement, type Connections, countsAfter, countText, followAction, friendActions, type Relation, relationAfter, relationSummary } from './graph';
import { profileTabs } from './profile-view';
import { requestCountText } from './friend-requests';
import { withoutProfile } from './connections-list';

const none: Relation = {
    following: false,
    followed_by: false,
    friends: false,
    request_sent: false,
    request_received: false,
    blocking: false,
    muting: false,
    can_follow: true,
    can_befriend: true,
};

const counts = (viewer: Relation, over: Partial<Connections> = {}): Connections => ({
    followers: 3,
    following: 2,
    friends: 1,
    viewer,
    lists: { followers: false, following: false, friends: true },
    ...over,
});

describe('relation buttons', () => {
    it('offer what the relation allows', () => {
        expect(followAction(none)).toBe('follow');
        expect(followAction({ ...none, following: true, can_follow: false })).toBe('unfollow');
        expect(followAction({ ...none, can_follow: false })).toBeNull();

        expect(friendActions(none)).toEqual(['befriend']);
        expect(friendActions({ ...none, can_befriend: false })).toEqual([]);
        expect(friendActions({ ...none, request_sent: true, can_befriend: false })).toEqual(['cancel']);
        expect(friendActions({ ...none, request_received: true })).toEqual(['accept', 'decline']);
        expect(friendActions({ ...none, friends: true, can_befriend: false })).toEqual(['unfriend']);
    });

    it('map to the API', () => {
        expect(actionRequest('follow')).toEqual({ method: 'POST', path: '/profiles/{id}/follow' });
        expect(actionRequest('unfollow')).toEqual({ method: 'DELETE', path: '/profiles/{id}/follow' });
        expect(actionRequest('accept')).toEqual({ method: 'POST', path: '/profiles/{id}/friend' });
        for (const a of ['decline', 'cancel', 'unfriend'] as const) expect(actionRequest(a)).toEqual({ method: 'DELETE', path: '/profiles/{id}/friend' });
    });
});

describe('after an action', () => {
    it('a follow counts the viewer as a follower, and back', () => {
        const after = relationAfter(none, 'follow');
        expect(after.following).toBe(true);
        expect(after.can_follow).toBe(false);
        const c = countsAfter(counts(none), none, after);
        expect(c.followers).toBe(4);
        expect(c.viewer).toBe(after);
        const back = relationAfter(after, 'unfollow');
        expect(countsAfter(c, after, back).followers).toBe(3);
    });

    it('a request waits; accepting makes friends who follow each other, as UNA does', () => {
        const sent = relationAfter(none, 'befriend', 'requested');
        expect(sent).toMatchObject({ request_sent: true, can_befriend: false, friends: false });
        expect(countsAfter(counts(none), none, sent).friends).toBe(1);

        const received = { ...none, request_received: true };
        const friends = relationAfter(received, 'accept', 'friends');
        expect(friends).toMatchObject({ friends: true, request_received: false, following: true, followed_by: true });
        expect(countsAfter(counts(received), received, friends)).toMatchObject({ friends: 2, followers: 4, following: 3 });
    });

    it('ending a friendship ends both follows; a declined or cancelled request can be sent again', () => {
        const friends = { ...none, friends: true, following: true, followed_by: true, can_follow: false, can_befriend: false };
        const ended = relationAfter(friends, 'unfriend');
        expect(ended).toMatchObject({ friends: false, following: false, followed_by: false, can_befriend: true, can_follow: true });
        expect(countsAfter(counts(friends), friends, ended)).toMatchObject({ friends: 0, followers: 2, following: 1 });
        expect(relationAfter({ ...none, request_sent: true }, 'cancel')).toMatchObject({ request_sent: false, can_befriend: true });
        expect(relationAfter({ ...none, request_received: true }, 'decline')).toMatchObject({ request_received: false });
    });

    it('never counts below zero', () => {
        const following = { ...none, following: true };
        expect(countsAfter(counts(following, { followers: 0 }), following, none).followers).toBe(0);
    });

    it('says what happened', () => {
        expect(announcement('follow', 'Mila')).toBe('You follow Mila now');
        expect(announcement('befriend', 'Mila', 'requested')).toBe('Friend request sent to Mila');
        expect(announcement('accept', 'Mila', 'friends')).toBe('You and Mila are friends');
        expect(announcement('unfriend', 'Mila')).toBe('Mila is no longer your friend');
    });
});

describe('profile texts', () => {
    it('sums up the relation', () => {
        expect(relationSummary(none)).toBe('');
        expect(relationSummary({ ...none, followed_by: true })).toBe('Follows you');
        expect(relationSummary({ ...none, request_received: true, followed_by: true })).toBe('Wants to be your friend · Follows you');
        expect(relationSummary({ ...none, friends: true, followed_by: true })).toBe('Friends');
    });

    it('counts with their nouns', () => {
        expect(countText(1, 'followers')).toBe('1 follower');
        expect(countText(0, 'friends')).toBe('0 friends');
        expect(countText(7, 'following')).toBe('7 following');
    });

    it('shows the tabs the viewer may open', () => {
        expect(profileTabs(undefined)).toEqual(['posts']);
        expect(profileTabs(counts(none))).toEqual(['posts', 'friends']);
        expect(profileTabs(counts(none, { lists: { followers: true, following: true, friends: false } }))).toEqual(['posts', 'followers', 'following']);
    });

    it('counts waiting requests from one page', () => {
        expect(requestCountText(0, false)).toBe('');
        expect(requestCountText(3, false)).toBe('3');
        expect(requestCountText(30, true)).toBe('30+');
    });

    it('takes an answered request off every page', () => {
        const p = (id: string) => ({ profile: { id, kind: 'person', module: 'bx_persons', display_name: id, status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' }, since: '2026-11-01T00:00:00Z' }) as const;
        const data = { pages: [{ items: [p('1'), p('2')], next_cursor: 'x' }, { items: [p('3')], next_cursor: null }], pageParams: [undefined, 'x'] };
        expect(withoutProfile(data, '2')?.pages.map((pg) => pg.items.map((c) => c.profile.id))).toEqual([['1'], ['3']]);
        expect(withoutProfile(undefined, '2')).toBeUndefined();
    });
});

describe('after a graph change', () => {
    /** A query on screen (an observer is subscribed) holding `data`; counts its fetches. */
    function shown(client: QueryClient, key: readonly unknown[], data: unknown) {
        const fetches = { n: 0 };
        client.setQueryData(key, data);
        const observer = new QueryObserver(client, {
            queryKey: key,
            queryFn: () => {
                fetches.n++;
                return data;
            },
            staleTime: Infinity,
        });
        const stop = observer.subscribe(() => {});
        return { fetches, stop };
    }
    const page = (ids: string[]) => ({ items: ids.map((id) => ({ id })), next_cursor: null });

    it('polls the Following feed’s first page now and leaves its pages, so new posts wait behind the pill', async () => {
        const client = new QueryClient();
        const feed = shown(client, ['feed', 'following'], { pages: [page(['1'])], pageParams: [undefined] });
        const head = shown(client, ['feed-head', 'following'], page(['1']));
        afterGraphChange(client, '8', '4');
        await new Promise((r) => setTimeout(r, 0));
        expect(head.fetches.n).toBe(1);
        expect(feed.fetches.n).toBe(0);
        feed.stop();
        head.stop();
    });

    it('refetches an empty Following feed on screen at once', async () => {
        const client = new QueryClient();
        const feed = shown(client, ['feed', 'following'], { pages: [page([])], pageParams: [undefined] });
        afterGraphChange(client, '8', '4');
        await new Promise((r) => setTimeout(r, 0));
        expect(feed.fetches.n).toBe(1);
        feed.stop();
    });
});
