import test from 'node:test';
import assert from 'node:assert/strict';
import { PICTURE_VIEW_BOX, introOwn, isIntroItem, unaPicture } from './intro-block.ts';

const plus = 'M28 4H72A24 24 0 0 1 96 28V72A24 24 0 0 1 72 96H28A24 24 0 0 1 4 72V28A24 24 0 0 1 28 4Z';
const dot = 'M136 50a14 14 0 1 0 28 0a14 14 0 1 0 -28 0Z';

test("UNA's shapes with the app's tone names", () => {
    const picture = unaPicture({
        name: 'create_account',
        view_box: '0 0 200 200',
        shapes: [
            { d: plus, tone: 'primary' },
            { d: dot, tone: 'accent-foreground' },
            { d: dot, tone: 'primary-foreground' },
            { d: dot, tone: 'muted', even_odd: true },
            { d: dot, tone: 'accent' },
        ],
    });
    assert.deepEqual(picture, {
        viewBox: '0 0 200 200',
        shapes: [
            { d: plus, tone: 'primary' },
            { d: dot, tone: 'accentForeground' },
            { d: dot, tone: 'primaryForeground' },
            { d: dot, tone: 'muted', evenOdd: true },
            { d: dot, tone: 'accent' },
        ],
    });
});

test('no picture from an older UNA or from anything that is not shapes', () => {
    assert.equal(unaPicture(undefined), null);
    assert.equal(unaPicture(false), null);
    assert.equal(unaPicture('join'), null);
    assert.equal(unaPicture({}), null);
    assert.equal(unaPicture({ shapes: 'M0 0' }), null);
    assert.equal(unaPicture({ shapes: [] }), null);
});

test('a shape the app cannot draw is left out, the rest stay', () => {
    const picture = unaPicture({
        shapes: [
            { d: plus, tone: 'primary' },
            { d: plus, tone: 'brand' },
            { d: plus },
            { d: '', tone: 'muted' },
            { d: 'M0 0"/><script>alert(1)</script>', tone: 'muted' },
            { d: 'url(#x)', tone: 'muted' },
            { d: 'M0 0' + ' 1'.repeat(1200), tone: 'muted' },
            { d: plus, tone: 'constructor' },
            null,
            'M0 0',
        ],
    });
    assert.deepEqual(picture?.shapes, [{ d: plus, tone: 'primary' }]);
    assert.equal(unaPicture({ shapes: [{ d: plus, tone: 'brand' }] }), null);
});

test('the view box, or the usual one', () => {
    assert.equal(unaPicture({ view_box: '0 0 120 80', shapes: [{ d: plus, tone: 'muted' }] })?.viewBox, '0 0 120 80');
    assert.equal(unaPicture({ view_box: ' -10 -10 220.5 220.5 ', shapes: [{ d: plus, tone: 'muted' }] })?.viewBox, '-10 -10 220.5 220.5');
    assert.equal(unaPicture({ shapes: [{ d: plus, tone: 'muted' }] })?.viewBox, PICTURE_VIEW_BOX);
    assert.equal(unaPicture({ view_box: '0 0 100%', shapes: [{ d: plus, tone: 'muted' }] })?.viewBox, PICTURE_VIEW_BOX);
    assert.equal(unaPicture({ view_box: 200, shapes: [{ d: plus, tone: 'muted' }] })?.viewBox, PICTURE_VIEW_BOX);
});

test('no more shapes than a picture needs', () => {
    const shapes = Array.from({ length: 100 }, () => ({ d: dot, tone: 'muted' }));
    assert.equal(unaPicture({ shapes })?.shapes.length, 64);
});

test("a project's own words and picture for the Sign up intro", () => {
    assert.deepEqual(introOwn('create_account'), {
        titleKey: 'create_account_page_title',
        textKey: 'create_account_page_text',
        picture: 'join_text',
    });
    assert.equal(introOwn('create_account_invite')?.titleKey, 'create_account_page_title_request_invite');
    assert.equal(introOwn('create_account_invite')?.textKey, 'create_account_page_text_request_invite');
    assert.equal(introOwn('welcome'), null);
    assert.equal(introOwn('constructor'), null);
    assert.equal(introOwn(undefined), null);
});

test('an intro content item', () => {
    assert.equal(isIntroItem({ type: 'intro', data: {} }), true);
    assert.equal(isIntroItem({ type: 'form' }), false);
    assert.equal(isIntroItem(null), false);
    assert.equal(isIntroItem('intro'), false);
});
