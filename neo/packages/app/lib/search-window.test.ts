import test from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizeSearchQuery,
    searchQueryFromScope,
    hasSearchQuery,
    searchResultsHref,
    withSearchValue,
    withSearchFilter,
    searchFilters,
} from './search-window.ts';

test('only the query\'s own keys, as strings, without empty ones', () => {
    assert.deepEqual(normalizeSearchQuery({ keyword: ' garden ', section: 'bx_posts', context: 12, author: 0, title_only: true, api: 1, page: 'x' }), {
        keyword: 'garden',
        section: 'bx_posts',
        context: '12',
        title_only: '1',
    });
    assert.deepEqual(normalizeSearchQuery(null), {});
});

test('a page\'s or a button\'s scope', () => {
    assert.deepEqual(searchQueryFromScope({ section: 'bx_posts', context: 0, title: 'Search posts' }), { section: 'bx_posts' });
    assert.deepEqual(searchQueryFromScope({ context: 536 }, 'tomatoes'), { keyword: 'tomatoes', context: '536' });
    assert.deepEqual(searchQueryFromScope(undefined), {});
});

test('a query asks for something with words or a narrowing', () => {
    assert.equal(hasSearchQuery({}), false);
    assert.equal(hasSearchQuery({ section: 'bx_posts' }), false, 'a module alone is a scope, not a search');
    assert.equal(hasSearchQuery({ context: '5' }), true);
    assert.equal(hasSearchQuery({ keyword: 'a' }), true);
});

test('the results page\'s link keeps every chip, never the cursor (the bugs of the old search page)', () => {
    const href = searchResultsHref({ keyword: 'events & fun', section: 'bx_events', date_from: '2026-09-23', date_to: '2026-09-24', date_field: 'starts', cursor: 'abc' });
    assert.equal(href, '/search-keyword?keyword=events%20%26%20fun&section=bx_events&date_from=2026-09-23&date_to=2026-09-24&date_field=starts');
    assert.equal(searchResultsHref({}), '/search-keyword');
});

test('changing the scope starts over: no page, tab or another module\'s fields', () => {
    const q = { keyword: 'x', section: 'bx_posts', tab: 'bx_posts', cursor: 'c', filters: '{"cat":["1"]}' };
    assert.deepEqual(withSearchValue(q, 'section', null), { keyword: 'x' });
    assert.deepEqual(withSearchValue(q, 'sort', 'new'), { keyword: 'x', section: 'bx_posts', tab: 'bx_posts', filters: '{"cat":["1"]}', sort: 'new' });
});

test('field filters', () => {
    let q = withSearchFilter({ section: 'bx_posts' }, 'cat', ['2', '3']);
    assert.deepEqual(searchFilters(q), { cat: ['2', '3'] });
    q = withSearchFilter(q, 'cat', []);
    assert.deepEqual(q, { section: 'bx_posts' });
    assert.deepEqual(searchFilters({ filters: 'not json' }), {});
});
