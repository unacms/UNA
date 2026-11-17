import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSectionRootPage, resolveSectionNavSmall, withSectionListBlock } from './section-list.ts';

const MENU = { object: 'sys_account_settings_submenu', title: 'Settings', items: [{ name: 'account-settings-info' }] };

test('a section without a page of its own keeps tabs', () => {
    assert.equal(resolveSectionNavSmall('list', ''), 'tabs');
    assert.equal(resolveSectionNavSmall(undefined, ''), 'tabs');
});

test('UNA decides between the list and tabs; an older UNA with a hub is a list', () => {
    assert.equal(resolveSectionNavSmall('list', 'settings'), 'list');
    assert.equal(resolveSectionNavSmall('', 'settings'), 'tabs');
    assert.equal(resolveSectionNavSmall('columns', 'settings'), 'tabs');
    assert.equal(resolveSectionNavSmall(undefined, 'settings'), 'list');
});

test('the section root is the page the menu names', () => {
    assert.equal(isSectionRootPage({ url: 'settings' }, 'settings'), true);
    assert.equal(isSectionRootPage({ url: '/page/settings?x=1' }, 'settings'), false);
    assert.equal(isSectionRootPage({ url: 'page/settings?x=1' }, 'settings'), true);
    assert.equal(isSectionRootPage({ uri: 'settings' }, 'settings'), true);
    assert.equal(isSectionRootPage({ url: 'account-settings-email' }, 'settings'), false);
    assert.equal(isSectionRootPage({ url: 'settings' }, ''), false);
});

test('an empty section root gets the menu as its one block', () => {
    const data = withSectionListBlock({ url: 'settings', name: 'Settings', layout_parsed: true, elements: { cell_center: [] } }, MENU);
    const blocks = data.elements?.cell_center as any[];
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].designbox_id, 0);
    assert.equal(blocks[0].source, 'sys_account_settings_submenu');
    assert.deepEqual(blocks[0].content, [{ id: 1, type: 'menu', data: { title: 'Settings', content: MENU } }]);
});

test('the list goes before the blocks a site gave the page', () => {
    const own = { id: 7, content: [{ type: 'html', data: {} }] };
    const data = withSectionListBlock({ url: 'settings', layout_parsed: true, elements: { cell_center: [own] } }, MENU);
    assert.deepEqual((data.elements?.cell_center as any[]).map((block) => block.id), ['section-list', 7]);
});

test('a page that already lists the menu is left as it is', () => {
    const page = { url: 'settings', layout_parsed: true, elements: { cell_center: [{ id: 85, content: [{ type: 'menu', data: { content: MENU } }] }] } };
    assert.equal(withSectionListBlock(page, MENU), page);
});

test('a page in the flat format with blocks of its own is left as it is', () => {
    const page = { url: 'settings', layout_parsed: false, elements: { a: [{ id: 1, content: [{ type: 'html' }] }] } };
    assert.equal(withSectionListBlock(page, MENU), page);
});
