import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    cardProfileOfEvent,
    isCardConnection,
    listHasCard,
    patchCardItem,
    patchFromCardState,
    patchFromReply,
    patchListPages,
} from './connection-patch.ts';

const FRIENDS = 'sys_profiles_friends';
const FOLLOW = 'sys_profiles_subscriptions';

// Loosely typed, as list items are in the cache.
const card = (profileId: number, over: Record<string, unknown> = {}): any => ({
    id: profileId + 100,
    module: 'bx_persons',
    author_data: { id: profileId },
    friends_count: 2,
    followers_count: 2,
    meta: {
        items: [
            { name: 'obj-friends', data: { type: 'connections_ext', o: FRIENDS, cid: profileId, name: 'add', title: 'Add friend', actions: [] } },
            { name: 'obj-subscriptions', data: { type: 'connections_ext', o: FOLLOW, cid: profileId, name: 'add', title: 'Follow', actions: [] } },
        ],
    },
    ...over,
});
const following = { type: 'connections_ext', name: 'remove', title: 'Following', actions: [{ name: 'remove', title: 'Unfollow' }] };

test('a follow updates the count and the button of that card', () => {
    const item = card(7);
    const next = patchCardItem(item, { profileId: 7, counts: { followers_count: 3, friends_count: 2 }, elements: { [FOLLOW]: following } });

    assert.notEqual(next, item);
    assert.equal(next.followers_count, 3);
    assert.equal(next.friends_count, 2);
    assert.equal(next.meta.items[1].data.title, 'Following');
    assert.deepEqual(next.meta.items[1].data.actions, following.actions);
    assert.equal(next.meta.items[1].data.cid, 7, 'the rest of the button stays');
    assert.equal(next.meta.items[0], item.meta.items[0], 'the other button is untouched');
    assert.equal(item.followers_count, 2, 'the cached item is not mutated');
});

test('nothing to change: the same objects come back', () => {
    const item = card(7);
    assert.equal(patchCardItem(item, { profileId: 7, counts: { followers_count: 2, friends_count: 2 } }), item);
    assert.equal(patchCardItem(item, { profileId: 8, counts: { followers_count: 9 }, elements: { [FOLLOW]: following } }), item);
    assert.equal(patchCardItem(item, { profileId: 7, elements: { [FOLLOW]: { type: 'connections_ext', name: 'add', title: 'Follow', actions: [] } } }), item);

    const cached = { pages: [{ data: [card(1), card(2)] }], pageParams: [undefined] };
    assert.equal(patchListPages(cached, { profileId: 9, counts: { followers_count: 5 } }), cached);
    assert.equal(patchListPages(null, { profileId: 1 }), null);
    assert.deepEqual(patchListPages({ data: 1 }, { profileId: 1 }), { data: 1 });
});

test('only a card gets counts: a post by the same author has none', () => {
    const post = { id: 5, module: 'bx_posts', author_data: { id: 7 }, title: 'Hello' };
    assert.equal(patchCardItem(post, { profileId: 7, counts: { followers_count: 3 } }), post);

    const noFriends = { id: 6, author_data: { id: 7 }, followers_count: 1 };
    assert.deepEqual(patchCardItem(noFriends, { profileId: 7, counts: { followers_count: 3, friends_count: 4 } }), { id: 6, author_data: { id: 7 }, followers_count: 3 });
});

test("one kind of button does not take the other's state", () => {
    const item = card(7, { meta: { items: [{ name: 'subscribe', data: { type: 'connections', o: FOLLOW, cid: 7, a: 'add', title: 'Follow' } }] } });
    assert.equal(patchCardItem(item, { profileId: 7, elements: { [FOLLOW]: following } }), item);

    const next = patchCardItem(item, { profileId: 7, elements: { [FOLLOW]: { type: 'connections', a: 'remove', title: 'Unfollow' } } });
    assert.equal(next.meta.items[0].data.a, 'remove');
    assert.equal(next.meta.items[0].data.title, 'Unfollow');
});

test('a list changes only on the page that holds the card', () => {
    const cached: any = { pages: [{ data: [card(1), card(2)], cursor: 2 }, { data: [card(3)] }], pageParams: [undefined, 2] };
    const next = patchListPages(cached, { profileId: 3, counts: { followers_count: 10 } });

    assert.notEqual(next, cached);
    assert.equal(next.pages[0], cached.pages[0]);
    assert.equal(next.pages[1].data[0].followers_count, 10);
    assert.deepEqual(next.pageParams, cached.pageParams);
});

test('a cached list is asked about only for a card it holds', () => {
    const cached = { pages: [{ data: [card(1)] }] };
    assert.equal(listHasCard(cached, 1), true);
    assert.equal(listHasCard(cached, '1'), true);
    assert.equal(listHasCard(cached, 2), false);
    assert.equal(listHasCard({ pages: [{ data: [{ id: 1, meta: { items: [{ data: { cid: 4 } }] } }] }] }, 4), true);
    assert.equal(listHasCard(undefined, 1), false);
});

test("an action's reply becomes a patch", () => {
    assert.deepEqual(
        patchFromReply(FOLLOW, 7, { ...following, o: FOLLOW, cid: 7, counts: { profile_id: 7, followers_count: 3 } }, 'connections_ext'),
        { profileId: 7, counts: { profile_id: 7, followers_count: 3 }, elements: { [FOLLOW]: following } },
    );
    assert.deepEqual(
        patchFromReply(FOLLOW, 7, { a: 'remove', title: 'Unfollow' }, 'connections'),
        { profileId: 7, counts: null, elements: { [FOLLOW]: { type: 'connections', title: 'Unfollow', a: 'remove' } } },
    );
    assert.equal(patchFromReply(FOLLOW, 7, {}, 'connections_ext'), null, 'an empty reply (UNA sent no element)');
    assert.equal(patchFromReply(FOLLOW, 7, null, 'connections_ext'), null);
});

test("UNA's card state becomes a patch", () => {
    assert.deepEqual(
        patchFromCardState({ profile_id: 7, counts: { friends_count: 1 }, elements: { [FOLLOW]: following } }),
        { profileId: 7, counts: { friends_count: 1 }, elements: { [FOLLOW]: following } },
    );
    assert.deepEqual(patchFromCardState({ profile_id: 7, counts: [], elements: [] }), { profileId: 7, counts: [], elements: null });
    assert.equal(patchFromCardState({ code: 1 }), null);
});

test('a connection event names the other profile', () => {
    assert.equal(cardProfileOfEvent({ object: FOLLOW, action: 'added', initiator: 1, content: 7 }, 1), 7);
    assert.equal(cardProfileOfEvent({ object: FRIENDS, action: 'deleted', initiator: 7, content: 1 }, '1'), 7);
    assert.equal(cardProfileOfEvent({ object: FOLLOW, action: 'deleted' }, 1), null, 'an older UNA sends no ids on delete');
    assert.equal(cardProfileOfEvent({ object: 'bx_groups_fans', initiator: 1, content: 7 }, 1), null);
    assert.equal(cardProfileOfEvent({ object: FOLLOW, initiator: 5, content: 7 }, 1), null);
    assert.equal(isCardConnection(FRIENDS), true);
    assert.equal(isCardConnection('bx_groups_fans'), false);
});
