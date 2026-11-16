import test from 'node:test';
import assert from 'node:assert/strict';
import { blockSizeKey, blockSize, withoutGap } from './block-size.ts';

test('only the sizes UNA sends', () => {
    assert.equal(blockSize('compact'), 'compact');
    assert.equal(blockSize('large'), 'large');
    assert.equal(blockSize(''), '');
    assert.equal(blockSize(undefined), '');
    assert.equal(blockSize('relaxed'), '', 'Relaxed is now Large');
    assert.equal(blockSize('Compact'), '');
    assert.equal(blockSize(false), '');
});

test('sized theme keys', () => {
    assert.equal(blockSizeKey('u-block-pad-x', 'compact'), 'u-block-pad-x-compact');
    assert.equal(blockSizeKey('block-pad-y', 'large'), 'block-pad-y-large');
    assert.equal(blockSizeKey('u-block-title-stacked', 'large'), 'u-block-title-stacked-large');
    assert.equal(blockSizeKey('u-block-pad-x', ''), 'u-block-pad-x');
    assert.equal(blockSizeKey('u-block-pad-x', 'huge'), 'u-block-pad-x');
});

test('gap utilities come out, others stay', () => {
    assert.equal(withoutGap(' text-card-foreground gap-4 '), 'text-card-foreground');
    assert.equal(withoutGap('gap-x-2 sm:gap-4 lg:dark:gap-6 flex'), 'flex');
    assert.equal(withoutGap(''), '');
});
