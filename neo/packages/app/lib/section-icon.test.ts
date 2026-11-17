import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sectionLinkPath, siteMenuIconForPages } from './section-icon.ts';

const SITE = [
    { name: 'home', link: '/', icon: 'home' },
    { name: 'persons-home', link: 'persons-home', icon: 'user' },
    { name: 'orgs', link: '/organizations-home', icon: 'building-columns' },
    { name: 'more', link: '', items: [{ name: 'events', link: 'https://example.com/events-home?x=1', icon: 'calendar' }] },
];

test('paths drop the origin, query, hash and outer slashes', () => {
    assert.equal(sectionLinkPath('/persons-home/'), 'persons-home');
    assert.equal(sectionLinkPath('https://site.com/events-home?a=1#b'), 'events-home');
    assert.equal(sectionLinkPath(null), '');
});

test('the site menu item that links to a page of the section gives the icon', () => {
    assert.equal(siteMenuIconForPages(SITE, ['organizations-home']), 'building-columns');
    assert.equal(siteMenuIconForPages(SITE, [null, 'persons-active', '/persons-home']), 'user');
});

test('items under a parent count, and an object list works as an array', () => {
    assert.equal(siteMenuIconForPages(SITE, ['events-home']), 'calendar');
    assert.equal(siteMenuIconForPages({ a: SITE[1] }, ['persons-home']), 'user');
});

test('no match, no pages or no items give null', () => {
    assert.equal(siteMenuIconForPages(SITE, ['albums-home']), null);
    assert.equal(siteMenuIconForPages(SITE, ['', '/']), null);
    assert.equal(siteMenuIconForPages(undefined, ['persons-home']), null);
});
