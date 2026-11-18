import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMenuSections, flattenMenuSections, hasItemLink, hasMenuSections, isMenuItemDanger, isMenuSectionParent, type MenuSectionItem } from './menu-sections.ts';

// UNA's sys_account_settings in the API: two section parents without a link, then the items outside them.
const SETTINGS: MenuSectionItem[] = [
    {
        name: 'account-settings-section-account', title: 'Account', link: '', subitems: [
            { name: 'account-settings-info', title: 'Account', link: 'account-settings-info' },
            { name: 'account-settings-email', title: 'Email', link: 'account-settings-email' },
        ],
    },
    {
        name: 'account-settings-section-profile', title: 'Muha', link: '', subitems: [
            { name: 'notifications-settings', title: 'Notifications', link: 'notifications-settings' },
            { name: 'acl-view', title: 'Membership', link: 'acl-view' },
        ],
    },
    { name: 'github-settings', title: 'GitHub', link: 'github-settings' },
    { name: 'account-settings-delete', title: 'Delete', link: 'account-settings-delete', config: '{"danger":true}' },
];

test('a parent without a link and with subitems heads a section', () => {
    assert.equal(isMenuSectionParent(SETTINGS[0]), true);
    assert.equal(isMenuSectionParent({ name: 'x', link: 'x', subitems: [{ name: 'y', link: 'y' }] }), false);
    assert.equal(isMenuSectionParent({ name: 'x', link: '', subitems: [] }), false);
    assert.equal(isMenuSectionParent({ name: 'x', link: 'javascript:void(0)', subitems: [{ name: 'y', link: 'y' }] }), true);
    assert.equal(hasItemLink({ url: '/a' }), true);
    assert.equal(hasItemLink({ link: 'javascript:void(0)' }), false);
});

test('flattening puts each subitem in its parent\'s place with the section, other items stay as they are', () => {
    const items = flattenMenuSections(SETTINGS);
    assert.deepEqual(items.map((item) => [item.name, item.section?.key ?? null]), [
        ['account-settings-info', 'account-settings-section-account'],
        ['account-settings-email', 'account-settings-section-account'],
        ['notifications-settings', 'account-settings-section-profile'],
        ['acl-view', 'account-settings-section-profile'],
        ['github-settings', null],
        ['account-settings-delete', null],
    ]);
    assert.equal(items[2]?.section?.title, 'Muha');
    // The menu's own items are left untouched.
    assert.equal('section' in (SETTINGS[2] as object), false);
});

test('a section parent below a section parent joins the same section', () => {
    const items = flattenMenuSections<MenuSectionItem>([{ name: 'a', title: 'A', subitems: [{ name: 'b', title: 'B', subitems: [{ name: 'c', link: 'c' }] }, { name: 'd', link: 'd' }] }]);
    assert.deepEqual(items.map((item) => [item.name, item.section?.key]), [['c', 'a'], ['d', 'a']]);
});

test('sections follow the menu: headed runs, an untitled run, and the dangerous item alone', () => {
    const items = flattenMenuSections(SETTINGS);
    assert.equal(hasMenuSections(items), true);
    const sections = buildMenuSections(items, (item) => item);
    assert.deepEqual(sections.map((s) => [s.title, s.danger, s.entries.map((e) => e.name)]), [
        ['Account', false, ['account-settings-info', 'account-settings-email']],
        ['Muha', false, ['notifications-settings', 'acl-view']],
        ['', false, ['github-settings']],
        ['', true, ['account-settings-delete']],
    ]);
    assert.equal(new Set(sections.map((s) => s.key)).size, sections.length);
});

test('a flat menu has no sections', () => {
    assert.equal(hasMenuSections([{ name: 'a', link: 'a' }, { name: 'b', link: 'b', config: '{"badge":"x"}' }]), false);
    assert.equal(hasMenuSections([]), false);
});

test('danger is read from the app config, and from an older UNA\'s group', () => {
    assert.equal(isMenuItemDanger({ config: '{"danger":true}' }), true);
    assert.equal(isMenuItemDanger({ config: { danger: true } }), true);
    assert.equal(isMenuItemDanger({ config: '{"danger":"yes"}' }), false);
    assert.equal(isMenuItemDanger({ config: 'not json' }), false);
    assert.equal(isMenuItemDanger({ group: 'danger' }), true);
    assert.equal(isMenuItemDanger({ config: '{"group":"danger"}' }), true);
});

test('an older UNA\'s groups make the sections, in the groups\' order', () => {
    const items = [
        { name: 'delete', group: 'danger' },
        { name: 'notifications', group: 'profile' },
        { name: 'email', group: 'account' },
        { name: 'custom', group: '' },
        { name: 'password', config: '{"group":"account"}' },
    ];
    assert.equal(hasMenuSections(items), true);
    const sections = buildMenuSections(items, (item) => item, { account: 'Account', profile: 'Muha' });
    assert.deepEqual(sections.map((s) => [s.key, s.title, s.danger, s.entries.map((e) => e.name)]), [
        ['account', 'Account', false, ['email', 'password']],
        ['profile', 'Muha', false, ['notifications']],
        ['other', '', false, ['custom']],
        ['danger', '', true, ['delete']],
    ]);
});

test('entries can be anything that leads to an item', () => {
    const routes = flattenMenuSections(SETTINGS).map((item, index) => ({ index, item }));
    const sections = buildMenuSections(routes, (route) => route.item);
    assert.deepEqual(sections.map((s) => s.entries.map((e) => e.index)), [[0, 1], [2, 3], [4], [5]]);
});
