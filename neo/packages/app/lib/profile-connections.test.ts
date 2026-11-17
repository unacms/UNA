import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectionProfileId, mergeConnectionProfiles, withMergedItemLists, getCardCountParts, getCardPreviewLists } from './profile-connections.ts';

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

test("a person's counts: friends, then followers", () => {
    assert.deepEqual(getCardCountParts({ module: 'bx_persons', friends_count: 2, followers_count: 5 }), [
        { key: 'friends', count: 2, labelKey: 'friends' },
        { key: 'followers', count: 5, labelKey: 'followers' },
    ]);
    assert.deepEqual(getCardCountParts({ module: 'bx_persons', friends_count: 4, mutual_friends_count: 1, followers_count: 0 }), [
        { key: 'friends', count: 1, labelKey: 'mutual_friends' },
    ]);
    assert.deepEqual(getCardCountParts({ module: 'bx_persons' }), []);
    assert.deepEqual(getCardCountParts(null), []);
});

test("a group's and a space's: members, then followers", () => {
    assert.deepEqual(getCardCountParts({ module: 'bx_groups', members_count: 12, followers_count: '3' }), [
        { key: 'members', count: 12, labelKey: 'members' },
        { key: 'followers', count: 3, labelKey: 'followers' },
    ]);
    assert.deepEqual(getCardCountParts({ module: 'bx_spaces', members_count: 0, followers_count: 1 }), [
        { key: 'followers', count: 1, labelKey: 'followers' },
    ]);
});

test("an event's: going and interested", () => {
    assert.deepEqual(getCardCountParts({ module: 'bx_events', members_count: 7, followers_count: 2 }), [
        { key: 'members', count: 7, labelKey: 'going' },
        { key: 'followers', count: 2, labelKey: 'intrested' },
    ]);
});

test('an organization has room for its first two counts', () => {
    assert.deepEqual(getCardCountParts({ module: 'bx_organizations', members_count: 3, friends_count: 2, followers_count: 9 }).map((part) => part.key), [
        'members',
        'friends',
    ]);
    assert.deepEqual(getCardCountParts({ module: 'bx_organizations', members_count: 0, friends_count: 2, followers_count: 9 }).map((part) => part.key), [
        'friends',
        'followers',
    ]);
});

test('the members come first in the group of avatars', () => {
    const data = { members_list: [lily], mutual_friends_list: [mila], friends_list: [mila, eric], followers_list: [lily, tom] };
    assert.deepEqual(mergeConnectionProfiles(getCardPreviewLists(data), { max: 4 }), [lily, mila, eric, tom]);
    assert.deepEqual(mergeConnectionProfiles(getCardPreviewLists({ followers_list: [tom] })), [tom]);
    assert.deepEqual(mergeConnectionProfiles(getCardPreviewLists(null)), []);
});
