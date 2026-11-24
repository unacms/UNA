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
    isChipSet,
    filterMenuItems,
    applyFilterChoice,
    withoutChip,
    type FilterChip,
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

const chips: FilterChip[] = [
    { name: 'section', type: 'scope', caption: 'In: Posts', value: 'bx_posts' },
    { name: 'title_only', type: 'toggle', caption: 'Title only', value: null },
    { name: 'author', type: 'profile', caption: 'Created by', value: null },
    { name: 'date', type: 'date_range', caption: 'Date', value: null, fields: [{ value: 'created', title: 'Added' }] },
    { name: 'cat', type: 'options', caption: 'Category', value: null, options: [{ value: '3', title: 'Garden' }] },
];
const [scopeChip, toggleChip, profileChip, dateChip, optionsChip] = chips as [FilterChip, FilterChip, FilterChip, FilterChip, FilterChip];
const strings = { me: 'Me', find_person: 'Find someone…', created_by_value: 'Created by: {0}', in: 'In: {0}', past_week: 'Past 7 days', past_month: 'Past 30 days', past_year: 'Past year' };

test('the scope chip always shows; a filter only once it is set', () => {
    assert.deepEqual(chips.filter((c) => isChipSet(c, {})).map((c) => c.name), ['section']);
    const set: FilterChip[] = [{ ...toggleChip, value: '1' }, { ...profileChip, value: '5' }, { ...dateChip, value: { from: '2026-01-01', to: '' } }, optionsChip];
    assert.deepEqual(set.filter((c) => isChipSet(c, { filters: JSON.stringify({ cat: '3' }) })).map((c) => c.name), ['title_only', 'author', 'date', 'cat']);
});

test('"+ Filter" lists every filter not set, its rows naming the filter, then the modules in global search', () => {
    const items = filterMenuItems(chips, {}, strings, { global: true, groups: [{ name: 'bx_persons', title: 'People' }, { name: 'bx_posts', title: 'Posts' }], signedIn: true });
    assert.deepEqual(items.filter((i) => !i.type).map((i) => i.title), [
        'Title only', 'Created by: Me', 'Created by: Find someone…', 'Past 7 days', 'Past 30 days', 'Past year', 'Category: Garden', 'In: People', 'In: Posts',
    ]);
    assert.equal(items.filter((i) => i.type === 'separator').length, 4);
    // a guest has no "Me"; a set filter leaves the menu
    const guest = filterMenuItems([{ ...toggleChip, value: '1' }, profileChip], {}, strings, { global: false, groups: [], signedIn: false });
    assert.deepEqual(guest.filter((i) => !i.type).map((i) => i.id), ['p:find']);
});

test('a choice in "+ Filter" sets its filter and resets the tab; "Find someone" opens the picker', () => {
    const today = new Date(2026, 10, 24);
    assert.deepEqual(applyFilterChoice({ keyword: 'a', tab: 'bx_posts' }, 't:title_only', chips, {}).query, { keyword: 'a', title_only: '1' });
    assert.deepEqual(applyFilterChoice({ keyword: 'a' }, 'p:me', chips, { viewerId: 7 }).query, { keyword: 'a', author: '7' });
    assert.deepEqual(applyFilterChoice({ keyword: 'a' }, 'p:me', chips, {}).query, { keyword: 'a' }, 'a guest has no "Me"');
    assert.deepEqual(applyFilterChoice({ keyword: 'a' }, 'p:find', chips, {}), { query: { keyword: 'a' }, find: true });
    assert.deepEqual(applyFilterChoice({ keyword: 'a' }, 'd:w', chips, { today, timezone: 'Europe/Berlin', strings }).query, { keyword: 'a', date_from: '2026-11-17', date_to: '2026-11-24', timezone: 'Europe/Berlin' });
    assert.deepEqual(searchFilters(applyFilterChoice({ keyword: 'a' }, 'o:cat:3', chips, {}).query), { cat: ['3'] });
    assert.deepEqual(applyFilterChoice({ keyword: 'a' }, 's:bx_persons', chips, {}).query, { keyword: 'a', section: 'bx_persons' });
});

test('a chip\'s remove button clears only its own filter', () => {
    const query = { keyword: 'a', section: 'bx_posts', author: '5', date_from: '2026-01-01', date_to: '2026-02-01', title_only: '1', tab: 'bx_posts' };
    assert.deepEqual(withoutChip(query, profileChip), { keyword: 'a', section: 'bx_posts', date_from: '2026-01-01', date_to: '2026-02-01', title_only: '1' });
    assert.deepEqual(withoutChip(query, dateChip), { keyword: 'a', section: 'bx_posts', author: '5', title_only: '1' });
    assert.deepEqual(withoutChip(query, toggleChip), { keyword: 'a', section: 'bx_posts', author: '5', date_from: '2026-01-01', date_to: '2026-02-01' });
    assert.deepEqual(withoutChip(query, scopeChip), { keyword: 'a', author: '5', date_from: '2026-01-01', date_to: '2026-02-01', title_only: '1' });
});
