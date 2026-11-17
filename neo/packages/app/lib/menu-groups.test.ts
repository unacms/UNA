import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMenuItemGroup, groupMenuEntries, hasMenuGroups } from './menu-groups.ts';

test("an item's group is UNA's own field", () => {
    assert.equal(getMenuItemGroup({ group: 'account' }), 'account');
    assert.equal(getMenuItemGroup({ group: 'danger', config: '{"group":"profile"}' }), 'danger');
    assert.equal(getMenuItemGroup({ group: '' }), null);
    assert.equal(getMenuItemGroup({ group: 'other' }), null);
    assert.equal(getMenuItemGroup({ group: 'tools' }), null);
    assert.equal(getMenuItemGroup(null), null);
});

test("an older UNA keeps the group in the item's config", () => {
    assert.equal(getMenuItemGroup({ config: '{"group":"profile"}' }), 'profile');
    assert.equal(getMenuItemGroup({ group: '', config: '{"group":"account","badge":"x"}' }), 'account');
    assert.equal(getMenuItemGroup({ config: { group: 'danger' } }), 'danger');
    assert.equal(getMenuItemGroup({ config: '{"badge":"friends"}' }), null);
    assert.equal(getMenuItemGroup({ config: 'group: not json' }), null);
    assert.equal(getMenuItemGroup({ config: '' }), null);
});

test('a menu is in sections when an item has a group', () => {
    assert.equal(hasMenuGroups([{ group: '' }, { group: 'profile' }]), true);
    assert.equal(hasMenuGroups([{ group: '' }, { config: '' }]), false);
    assert.equal(hasMenuGroups([]), false);
});

test('sections come in their order, entries keep the menu order', () => {
    const items = [
        { name: 'delete', group: 'danger' },
        { name: 'notifications', group: 'profile' },
        { name: 'email', group: 'account' },
        { name: 'custom', group: '' },
        { name: 'password', group: 'account' },
    ];
    const sections = groupMenuEntries(items, getMenuItemGroup);
    assert.deepEqual(sections.map((s) => [s.group, s.entries.map((e) => e.name)]), [
        ['account', ['email', 'password']],
        ['profile', ['notifications']],
        ['other', ['custom']],
        ['danger', ['delete']],
    ]);
});

test('entries can be anything that leads to an item', () => {
    const routes = [{ index: 0, item: { group: 'profile' } }, { index: 1, item: { group: 'account' } }];
    const sections = groupMenuEntries(routes, (route) => getMenuItemGroup(route.item));
    assert.deepEqual(sections.map((s) => [s.group, s.entries.map((e) => e.index)]), [['account', [1]], ['profile', [0]]]);
});
