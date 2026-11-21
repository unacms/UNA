import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MENU_VIEWER_GUEST, isMenuOf, menuToRemember, menuViewerKey, rememberedMenuData, rememberedMenuKey, shouldForgetMenu } from './menu-remember.ts';

const MENU = { items: [{ name: 'home' }], persistent: 1 };

test('the viewer: a member by id, a visitor, or not known yet', () => {
    assert.equal(menuViewerKey({ id: 12 }), 'user-12');
    assert.equal(menuViewerKey({ id: '7' }), 'user-7');
    assert.equal(menuViewerKey(false), MENU_VIEWER_GUEST);
    assert.equal(menuViewerKey(null), null);
    assert.equal(menuViewerKey(undefined), null);
    assert.equal(menuViewerKey({}), null);
    assert.equal(menuViewerKey({ id: '' }), null);
});

test('one key per menu', () => {
    assert.equal(rememberedMenuKey('sys_site'), 'menu-sys_site');
});

test("a member's menu is kept with its viewer; a visitor's is not", () => {
    assert.deepEqual(menuToRemember('user-12', MENU), { viewer: 'user-12', data: MENU });
    assert.equal(menuToRemember(MENU_VIEWER_GUEST, MENU), null);
    assert.equal(menuToRemember(null, MENU), null);
    assert.equal(menuToRemember('user-12', false), null);
    assert.equal(menuToRemember('user-12', null), null);
});

test('only the viewer who saved a menu gets it back', () => {
    const stored = menuToRemember('user-12', MENU);
    assert.equal(rememberedMenuData(stored, 'user-12'), MENU);
    assert.equal(rememberedMenuData(stored, 'user-13'), null);
    assert.equal(rememberedMenuData(stored, MENU_VIEWER_GUEST), null);
    assert.equal(rememberedMenuData(stored, null), null);
});

test('what storage holds is read with care', () => {
    assert.equal(rememberedMenuData(null, 'user-12'), null);
    assert.equal(rememberedMenuData('x', 'user-12'), null);
    assert.equal(rememberedMenuData({ viewer: 'user-12' }, 'user-12'), null);
    assert.equal(rememberedMenuData({ viewer: 12, data: MENU }, 'user-12'), null);
    assert.equal(rememberedMenuData({ viewer: 'user-12', data: false }, 'user-12'), null);
});

test("another viewer's copy is dropped, also when the viewer signs out", () => {
    const stored = menuToRemember('user-12', MENU);
    assert.equal(shouldForgetMenu(stored, 'user-12'), false);
    assert.equal(shouldForgetMenu(stored, 'user-13'), true);
    assert.equal(shouldForgetMenu(stored, MENU_VIEWER_GUEST), true);
    // nothing kept, or the viewer not known yet: nothing to do
    assert.equal(shouldForgetMenu(null, MENU_VIEWER_GUEST), false);
    assert.equal(shouldForgetMenu(stored, null), false);
    // not a copy at all
    assert.equal(shouldForgetMenu('x', 'user-12'), true);
});

test('a menu belongs to the viewer it was first seen with', () => {
    const owners = new WeakMap<object, string>();
    assert.equal(isMenuOf(owners, MENU, 'user-12'), true);
    assert.equal(isMenuOf(owners, MENU, 'user-12'), true);
    // the profile is switched without a page load: the loaded menu is still the first profile's
    assert.equal(isMenuOf(owners, MENU, 'user-13'), false);
    // UNA's answer for the new viewer is another object
    const fresh = { ...MENU };
    assert.equal(isMenuOf(owners, fresh, 'user-13'), true);
    assert.equal(isMenuOf(owners, fresh, 'user-12'), false);
});

test("a visitor's menu is not a member's after signing in on the same page", () => {
    const owners = new WeakMap<object, string>();
    assert.equal(isMenuOf(owners, MENU, MENU_VIEWER_GUEST), true);
    assert.equal(isMenuOf(owners, MENU, 'user-12'), false);
});

test('nothing is anyone\'s without a viewer or a menu', () => {
    const owners = new WeakMap<object, string>();
    assert.equal(isMenuOf(owners, MENU, null), false);
    assert.equal(isMenuOf(owners, false, 'user-12'), false);
    assert.equal(isMenuOf(owners, null, 'user-12'), false);
    // an unknown viewer claims nothing: the first known one does
    assert.equal(isMenuOf(owners, MENU, 'user-12'), true);
});
