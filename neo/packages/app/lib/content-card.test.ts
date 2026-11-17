import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getContentCardImage, getContentCardPrice, getContentCardSummary, getContentCardTime } from './content-card.ts';

test('the picture is the image, else the cover, else none', () => {
    const image = { storage: 'bx_posts_photos', src: 'https://site/s/a.jpg' };
    const cover = { src: 'https://site/s/c.jpg' };
    assert.equal(getContentCardImage({ image, cover }), image);
    assert.equal(getContentCardImage({ image: false, cover }), cover, "a product's cover");
    assert.equal(getContentCardImage({ image: '', cover: { storage: 'x' } }), null, 'a cover without a picture');
    assert.equal(getContentCardImage({ image: { src: '' } }), null);
    assert.equal(getContentCardImage(null), null);
});

test("the price is UNA's text", () => {
    assert.equal(getContentCardPrice({ price_text: ' €12.50 ' }), '€12.50');
    assert.equal(getContentCardPrice({ price_text: 'Free' }), 'Free');
    assert.equal(getContentCardPrice({ price_single: 12 }), '', 'no text: no price, never a made-up "$"');
    assert.equal(getContentCardPrice(undefined), '');
});

test('the summary is one line', () => {
    assert.equal(getContentCardSummary({ summary_plain: 'Trip notes\n\n #neotrip  and more ' }), 'Trip notes #neotrip and more');
    assert.equal(getContentCardSummary({ summary_plain: null }), '');
});

test('the time is the first known one', () => {
    assert.equal(getContentCardTime({ added: 1794552299 }), 1794552299);
    assert.equal(getContentCardTime({ date: '1794149090', added: 1 }), 1794149090);
    assert.equal(getContentCardTime({ date: 'soon' }), 0);
    assert.equal(getContentCardTime({}), 0);
});
