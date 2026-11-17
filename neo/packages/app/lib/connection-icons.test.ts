import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectionButtonIcon, withConnectionRowIcons } from './connection-icons.ts';

const friends = { add: 'UserRoundPlus', remove: 'UserRoundX', default: 'UserRoundCheck' };
const follow = { add: 'CirclePlus', remove: 'CircleMinus', default: 'CircleCheck' };
const fans = { add: 'LogIn', remove: 'LogOut' };

test('the button shows its state', () => {
    assert.equal(connectionButtonIcon(friends, 'add'), 'UserRoundPlus');
    assert.equal(connectionButtonIcon(friends, 'default', true), 'UserRoundCheck', 'Request sent, Friends');
    assert.equal(connectionButtonIcon(friends, 'add', true), 'UserRoundPlus', 'a request to answer');
    assert.equal(connectionButtonIcon(follow, 'add'), 'CirclePlus');
    assert.equal(connectionButtonIcon(follow, 'default', true), 'CircleCheck', 'Following');
});

test("an older UNA's following state is still the made one", () => {
    assert.equal(connectionButtonIcon(follow, 'remove', true), 'CircleCheck');
    assert.equal(connectionButtonIcon(follow, 'remove', false), 'CircleMinus', 'a single Unfollow button is the action');
    assert.equal(connectionButtonIcon(fans, 'remove', true), 'LogOut', 'a set without a made icon keeps the action');
});

test('no icon where the set has none', () => {
    assert.equal(connectionButtonIcon(fans, 'default', true), undefined);
    assert.equal(connectionButtonIcon(null, 'add'), undefined);
    assert.equal(connectionButtonIcon(friends, undefined), undefined);
});

test("a menu row shows its action's icon", () => {
    assert.deepEqual(withConnectionRowIcons([{ name: 'remove', title: 'Cancel request' }], friends), [
        { name: 'remove', title: 'Cancel request', icon: 'UserRoundX' },
    ]);
    assert.deepEqual(withConnectionRowIcons([{ name: 'add', title: 'Confirm' }, { name: 'remove', title: 'Reject' }], friends).map((row) => row.icon), [
        'UserRoundPlus',
        'UserRoundX',
    ]);
    assert.deepEqual(withConnectionRowIcons([{ name: 'remove', title: 'Unfollow' }], follow)[0]?.icon, 'CircleMinus');
});

test('a row keeps its own icon, and rows without one stay as they are', () => {
    const own = { name: 'remove', title: 'Leave', icon: 'DoorOpen' };
    assert.deepEqual(withConnectionRowIcons([own], fans), [own]);
    const plain = { name: 'mute', title: 'Mute' };
    assert.equal(withConnectionRowIcons([plain], friends)[0], plain);
    assert.deepEqual(withConnectionRowIcons(null, friends), []);
    assert.deepEqual(withConnectionRowIcons(undefined, null), []);
});
