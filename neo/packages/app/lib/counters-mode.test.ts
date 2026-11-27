import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countLabel, countersModeParams, isStatShown, menuCountersMode } from './counters-mode.ts';

test('the menu mode is one of the three, or null', () => {
    assert.equal(menuCountersMode({ counters: 'count' }), 'count');
    assert.equal(menuCountersMode({ counters: 'group' }), 'group');
    assert.equal(menuCountersMode({ counters: '' }), null);
    assert.equal(menuCountersMode({ counters: 'other' }), null);
    assert.equal(menuCountersMode(null), null);
});

test('each mode gives its display flags', () => {
    assert.deepEqual(countersModeParams('label'), { show_action: true, show_counter: false, show_combined: false, show_action_count: false });
    assert.deepEqual(countersModeParams('count'), { show_action: true, show_counter: false, show_combined: false, show_action_count: true });
    assert.deepEqual(countersModeParams('group'), { show_action: true, show_counter: true, show_combined: true, show_action_count: false });
});

test('the stats row follows the actions mode', () => {
    const reactions = { name: 'item-reaction', data: { type: 'reactions' } };
    const comments = { name: 'item-comment', data: { type: 'comments' } };
    assert.equal(isStatShown(comments, null), true);
    assert.equal(isStatShown(comments, 'label'), true);
    assert.equal(isStatShown(reactions, 'count'), true);
    assert.equal(isStatShown(comments, 'count'), false);
    assert.equal(isStatShown(reactions, 'group'), false);
});

test('a count label is the number, or nothing at 0', () => {
    assert.equal(countLabel(12), '12');
    assert.equal(countLabel('3'), '3');
    assert.equal(countLabel(0), false);
    assert.equal(countLabel(undefined), false);
});
