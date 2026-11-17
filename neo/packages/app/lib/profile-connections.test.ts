import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectionProfileId, mergeConnectionProfiles, withMergedItemLists } from './profile-connections.ts';

const card = (profileId: number, contentId = profileId + 100) => ({ id: contentId, module: 'bx_persons', author_data: { id: profileId } });
const lily = card(4), mila = card(8), eric = card(6), tom = card(10), viewer = card(116);

test("a list entry's id is its profile's", () => {
    assert.equal(connectionProfileId(lily), '4');
    assert.equal(connectionProfileId({ id: 7 }), '7');
    assert.equal(connectionProfileId({}), '');
    assert.equal(connectionProfileId(null), '');
});

test('friends and followers make one group, each person once', () => {
    assert.deepEqual(mergeConnectionProfiles([[lily, mila], [lily, mila, eric]]), [lily, mila, eric]);
    assert.deepEqual(mergeConnectionProfiles([[lily], [card(4, 999)]]), [lily], 'the same profile from another list');
});

test('the lists keep their order: mutual friends, friends, followers', () => {
    assert.deepEqual(mergeConnectionProfiles([[tom], [lily, tom], [mila, eric]]), [tom, lily, mila]);
});

test('the viewer is left out', () => {
    assert.deepEqual(mergeConnectionProfiles([[lily], [viewer, mila]], { exclude: 116 }), [lily, mila]);
    assert.deepEqual(mergeConnectionProfiles([[viewer]], { exclude: '116' }), []);
    assert.deepEqual(mergeConnectionProfiles([[viewer]], { exclude: false }), [viewer], 'a guest excludes nobody');
});

test('three avatars at most, or the number asked for', () => {
    assert.equal(mergeConnectionProfiles([[lily, mila, eric, tom]]).length, 3);
    assert.equal(mergeConnectionProfiles([[lily, mila, eric, tom]], { max: 5 }).length, 4);
});

test('one list off, or none sent', () => {
    assert.deepEqual(mergeConnectionProfiles([undefined, [], [mila]]), [mila]);
    assert.deepEqual(mergeConnectionProfiles([null, undefined]), []);
});

test("a profile page's counts: the first one takes the group", () => {
    const items = [
        { name: 'membership', title: 'Standard' },
        { name: 'friends', title: '2 friends', list: [lily, mila] },
        { name: 'subscribers', title: '3 followers', list: [lily, mila, viewer] },
    ];
    const merged = withMergedItemLists(items, { exclude: 116 });
    assert.deepEqual(merged[0], items[0]);
    assert.deepEqual(merged[1], { name: 'friends', title: '2 friends', list: [lily, mila] });
    assert.deepEqual(merged[2], { name: 'subscribers', title: '3 followers' });
    assert.ok(Array.isArray(items[2]?.list), 'the items given are left as they are');
});

test('friends off: the followers count takes the group', () => {
    const merged = withMergedItemLists([{ name: 'friends', title: '0 friends', list: [] }, { name: 'subscribers', title: '2 followers', list: [eric, tom] }]);
    assert.deepEqual(merged[1], { name: 'subscribers', title: '2 followers', list: [eric, tom] });
});

test('nothing to merge', () => {
    const items = [{ name: 'views', title: '5 views' }];
    assert.deepEqual(withMergedItemLists(items), items);
    assert.deepEqual(withMergedItemLists(null), []);
    assert.deepEqual(withMergedItemLists([{ name: 'subscribers', title: '1 follower', list: [viewer] }], { exclude: 116 }), [
        { name: 'subscribers', title: '1 follower' },
    ]);
});
