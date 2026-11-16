import test from 'node:test';
import assert from 'node:assert/strict';
import { blockPaddingKey, blockPaddingSize, withoutGap } from './block-padding.ts';

test('only the sizes UNA sends', () => {
    assert.equal(blockPaddingSize('compact'), 'compact');
    assert.equal(blockPaddingSize('relaxed'), 'relaxed');
    assert.equal(blockPaddingSize(''), '');
    assert.equal(blockPaddingSize(undefined), '');
    assert.equal(blockPaddingSize('Compact'), '');
    assert.equal(blockPaddingSize(false), '');
});

test('sized theme keys', () => {
    assert.equal(blockPaddingKey('u-block-pad-x', 'compact'), 'u-block-pad-x-compact');
    assert.equal(blockPaddingKey('block-pad-y', 'relaxed'), 'block-pad-y-relaxed');
    assert.equal(blockPaddingKey('u-block-pad-x', ''), 'u-block-pad-x');
    assert.equal(blockPaddingKey('u-block-pad-x', 'huge'), 'u-block-pad-x');
});

test('gap utilities come out, others stay', () => {
    assert.equal(withoutGap(' text-card-foreground gap-4 '), 'text-card-foreground');
    assert.equal(withoutGap('gap-x-2 sm:gap-4 lg:dark:gap-6 flex'), 'flex');
    assert.equal(withoutGap(''), '');
});
