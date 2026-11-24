import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPageCoverShown, isPageCoverHiddenOn, isPageTitleShown, isPageTitleHiddenOn, isPageTitleOn } from './page-cover.ts';

test('disabled or missing', () => {
    assert.equal(isPageCoverShown(0, false), false);
    assert.equal(isPageCoverShown(0, true), false);
    assert.equal(isPageCoverShown(undefined, true), false);
    assert.equal(isPageCoverShown('', false), false);
});

test('enabled for all', () => {
    assert.equal(isPageCoverShown(1, false), true);
    assert.equal(isPageCoverShown('1', true), true);
});

test('visitors only', () => {
    assert.equal(isPageCoverShown(2, false), true);
    assert.equal(isPageCoverShown(2, true), false);
});

test('members only', () => {
    assert.equal(isPageCoverShown(3, false), false);
    assert.equal(isPageCoverShown(3, true), true);
});

test('set in code as a boolean', () => {
    assert.equal(isPageCoverShown(true, false), true);
    assert.equal(isPageCoverShown(false, true), false);
});

test('hidden on a screen size', () => {
    assert.equal(isPageCoverHiddenOn(['phone'], 'phone', false), true);
    assert.equal(isPageCoverHiddenOn(['phone'], 'desktop', false), false);
    assert.equal(isPageCoverHiddenOn([], 'phone', false), false);
    assert.equal(isPageCoverHiddenOn(undefined, 'phone', true), false, 'an older UNA sends nothing');
});

test('the apps are the mobile app too', () => {
    assert.equal(isPageCoverHiddenOn(['mobile-app'], 'phone', true), true);
    assert.equal(isPageCoverHiddenOn(['mobile-app'], 'phone', false), false, 'not on the web');
    assert.equal(isPageCoverHiddenOn(['tablet'], 'tablet', true), true);
});

test('the title has settings of its own', () => {
    assert.equal(isPageTitleShown({ cover: 0, title_show: 1 }, false), true, 'title without the cover');
    assert.equal(isPageTitleShown({ cover: 1, title_show: 0 }, true), false, 'cover without the title');
    assert.equal(isPageTitleShown({ cover: 1, title_show: 3 }, false), false, 'members only');
    assert.equal(isPageTitleShown({ cover: 1, title_show: 2 }, false), true, 'guests only');
    assert.equal(isPageTitleHiddenOn({ cover_hidden_on: ['phone'], title_hidden_on: ['desktop'] }, 'phone', false), false);
    assert.equal(isPageTitleHiddenOn({ cover_hidden_on: [], title_hidden_on: ['desktop'] }, 'desktop', false), true);
    assert.equal(isPageTitleHiddenOn({ title_hidden_on: ['mobile-app'] }, 'tablet', true), true, 'the apps');
});

test('an older UNA: the title follows the cover', () => {
    assert.equal(isPageTitleShown({ cover: 2 }, false), true);
    assert.equal(isPageTitleShown({ cover: 2 }, true), false);
    assert.equal(isPageTitleShown(null, true), false);
    assert.equal(isPageTitleHiddenOn({ cover_hidden_on: ['tablet'] }, 'tablet', false), true);
    assert.equal(isPageTitleOn({ cover: 1, cover_hidden_on: ['desktop'] }, true, 'desktop', false), false);
    assert.equal(isPageTitleOn({ cover: 1, title_show: 1, title_hidden_on: [] , cover_hidden_on: ['desktop'] }, true, 'desktop', false), true);
});
