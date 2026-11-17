import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSiteUnitActions, getUnitActionNames, getUnitViewAction, isUnitActionItem, isUnitDismissItem, pickUnitActions } from './unit-actions.ts';

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

test('lists that name their own actions', () => {
    assert.deepEqual(getUnitActionNames('person_friends_recommendations', 'bx_persons'), { primary: 'befriend', secondary: '', dismiss: 'ignore-befriend' });
    assert.deepEqual(getUnitActionNames('browse_friend_requests', 'system'), { primary: 'befriend', secondary: 'unfriend', dismiss: '' });
    assert.deepEqual(getUnitActionNames('person_followers', 'bx_organizations'), { primary: 'subscribe', secondary: 'unsubscribe', dismiss: '' });
    assert.deepEqual(getUnitActionNames(undefined, 'bx_persons'), { primary: '', secondary: '', dismiss: '' }, "People's own lists name none");
    assert.deepEqual(getUnitActionNames('person_friends', 'bx_persons'), { primary: '', secondary: '', dismiss: '' }, 'Friends makes its own Message');
});

test("contexts name no action: they take UNA's own", () => {
    assert.deepEqual(getUnitActionNames(undefined, 'bx_groups'), { primary: '', secondary: '', dismiss: '' });
    assert.deepEqual(getUnitActionNames('context_recommendations', 'bx_events'), { primary: '', secondary: '', dismiss: 'ignore-join' });
    assert.deepEqual(getUnitActionNames(undefined, 'bx_channels'), { primary: '', secondary: '', dismiss: '' });
});

test("the list's named actions win over UNA's order", () => {
    const names = getUnitActionNames('person_friends_recommendations', 'bx_persons');
    assert.deepEqual(pickUnitActions([ignore, friends, add], names), { primary: add, secondary: null, dismiss: ignore });
});

test("a list that names none, or finds none, takes UNA's buttons", () => {
    const none = getUnitActionNames(undefined, 'bx_persons');
    assert.deepEqual(pickUnitActions([count, friends, follow], none), { primary: friends, secondary: follow, dismiss: null });
    const followers = getUnitActionNames('person_followers', 'bx_persons');
    assert.deepEqual(pickUnitActions([friends, follow], followers), { primary: friends, secondary: follow, dismiss: null });
    assert.deepEqual(pickUnitActions([count], none), { primary: null, secondary: null, dismiss: null });
    assert.deepEqual(pickUnitActions(undefined, none), { primary: null, secondary: null, dismiss: null });
});

test('a lone second button takes the first place', () => {
    const leave = { name: 'leave', data: { type: 'connections', a: 'remove' } };
    assert.deepEqual(pickUnitActions([leave], getUnitActionNames(undefined, 'bx_groups')), { primary: leave, secondary: null, dismiss: null });
});

test("a button the list makes itself keeps its place, with nothing beside it", () => {
    const message = { title: 'Message' };
    assert.deepEqual(pickUnitActions([friends, follow], getUnitActionNames('person_friends', 'bx_persons'), message), {
        primary: message,
        secondary: null,
        dismiss: null,
    });
});

test("a context's card: Join and Follow, each a toggle", () => {
    const joinToggle = { name: 'join', data: { type: 'connections_ext', o: 'bx_groups_fans', name: 'add' } };
    const followToggle = { name: 'subscribe', data: { type: 'connections_ext', o: 'sys_profiles_subscriptions', name: 'add' } };
    const members = { name: 'members', title: '3 members' };
    assert.deepEqual(pickUnitActions([members, joinToggle, followToggle], getUnitActionNames(undefined, 'bx_groups')), {
        primary: joinToggle,
        secondary: followToggle,
        dismiss: null,
    });
    // a channel, which nobody joins: its Follow alone
    assert.deepEqual(pickUnitActions([followToggle], getUnitActionNames(undefined, 'bx_channels')), { primary: followToggle, secondary: null, dismiss: null });
});

test("a suggested group: UNA's Join, and its Ignore as the dismiss button", () => {
    const suggest = { name: 'join', data: { type: 'recommendation', a: 'add' } };
    const skip = { name: 'ignore-join', data: { type: 'recommendation', a: 'ignore' } };
    assert.deepEqual(pickUnitActions([suggest, skip], getUnitActionNames('context_recommendations', 'bx_groups')), {
        primary: suggest,
        secondary: null,
        dismiss: skip,
    });
});

test('a card with no action names what it opens', () => {
    assert.deepEqual(getUnitViewAction('bx_persons'), { title: 'View profile', icon: 'CircleUserRound' });
    assert.deepEqual(getUnitViewAction('bx_organizations'), { title: 'View profile', icon: 'CircleUserRound' });
    assert.deepEqual(getUnitViewAction('bx_groups'), { title: 'View group', icon: 'CircleArrowRight' });
    assert.deepEqual(getUnitViewAction('bx_events'), { title: 'View event', icon: 'CircleArrowRight' });
    assert.deepEqual(getUnitViewAction('bx_spaces'), { title: 'View space', icon: 'CircleArrowRight' });
    assert.deepEqual(getUnitViewAction('bx_courses'), { title: 'View course', icon: 'CircleArrowRight' });
    assert.deepEqual(getUnitViewAction('bx_channels'), { title: 'View channel', icon: 'CircleArrowRight' });
    assert.deepEqual(getUnitViewAction('bx_posts'), { title: 'View', icon: '' });
    assert.deepEqual(getUnitViewAction(undefined), { title: 'View', icon: '' });
});
