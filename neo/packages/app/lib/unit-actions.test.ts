import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSiteUnitActions, isUnitActionItem, isUnitDismissItem } from './unit-actions.ts';

const friends = { name: 'obj-friends', data: { type: 'connections_ext', o: 'sys_profiles_friends' } };
const follow = { name: 'obj-subscriptions', data: { type: 'connections_ext', o: 'sys_profiles_subscriptions' } };
const join = { name: 'join', data: { type: 'connections', a: 'add' } };
const add = { name: 'befriend', data: { type: 'recommendation', a: 'add' } };
const ignore = { name: 'ignore-befriend', data: { type: 'recommendation', a: 'ignore' } };
const count = { name: 'friends', title: '3 friends' };
const stars = { name: 'votes', data: { type: 'stars' } };

test('a button is a connection or a suggestion action', () => {
    assert.equal(isUnitActionItem(friends), true);
    assert.equal(isUnitActionItem(join), true);
    assert.equal(isUnitActionItem(add), true);
    assert.equal(isUnitActionItem(count), false);
    assert.equal(isUnitActionItem(stars), false);
    assert.equal(isUnitActionItem({ name: 'obj-friends', data: { primary: false } }), false, 'an element UNA left empty');
    assert.equal(isUnitActionItem(null), false);
});

test("a suggestion's Ignore is the dismiss button", () => {
    assert.equal(isUnitDismissItem(ignore), true);
    assert.equal(isUnitDismissItem(add), false);
    assert.equal(isUnitDismissItem({ name: 'x', data: { type: 'connections', a: 'ignore' } }), false);
});

test("the card takes UNA's first two buttons, in the menu's order", () => {
    assert.deepEqual(getSiteUnitActions([count, friends, stars, follow]), { primary: friends, secondary: follow, dismiss: null });
    assert.deepEqual(getSiteUnitActions([join, friends, follow]), { primary: join, secondary: friends, dismiss: null });
    assert.deepEqual(getSiteUnitActions([follow]), { primary: follow, secondary: null, dismiss: null });
});

test('Ignore never takes an action slot', () => {
    assert.deepEqual(getSiteUnitActions([ignore, add]), { primary: add, secondary: null, dismiss: ignore });
    assert.deepEqual(getSiteUnitActions([ignore]), { primary: null, secondary: null, dismiss: ignore });
});

test('no buttons from UNA: none', () => {
    const none = { primary: null, secondary: null, dismiss: null };
    assert.deepEqual(getSiteUnitActions([count, stars]), none);
    assert.deepEqual(getSiteUnitActions([]), none);
    assert.deepEqual(getSiteUnitActions(null), none);
    assert.deepEqual(getSiteUnitActions(undefined), none);
});
