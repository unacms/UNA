import { test } from 'node:test';
import assert from 'node:assert/strict';
import { counterItemCount, hasCounterToShow, isDrawnCounter } from './counter-items.ts';

test('a compound counter counts its parts', () => {
    const item = { display_type: 'element', data: { type: 'reactions', counter: { items: [{ count: 1 }, { count: '2' }, { count: 0 }] } } };
    assert.equal(counterItemCount(item), 3);
    assert.equal(hasCounterToShow(item), true);
});

test('a counter at zero shows nothing', () => {
    assert.equal(hasCounterToShow({ display_type: 'element', data: { type: 'reactions', counter: { items: [{ count: 0 }] } } }), false);
    assert.equal(hasCounterToShow({ display_type: 'element', data: { type: 'comments', counter: { count: 0 } } }), false);
});

test('a simple counter shows its count', () => {
    assert.equal(hasCounterToShow({ display_type: 'element', data: { type: 'comments', counter: { count: 1 } } }), true);
});

test('an element the app does not draw is left out', () => {
    assert.equal(hasCounterToShow({ display_type: 'element', data: {} }), false);
});

test('an item without counter data is kept', () => {
    assert.equal(counterItemCount({ display_type: 'element', data: { type: 'score' } }), null);
    assert.equal(hasCounterToShow({ display_type: 'element', data: { type: 'score' } }), true);
    assert.equal(hasCounterToShow({}), true);
});

test('a counter at zero is still drawn, an element without a type is not', () => {
    assert.equal(isDrawnCounter({ display_type: 'element', data: { type: 'reactions', counter: { items: [{ count: 0 }] } } }), true);
    assert.equal(isDrawnCounter({ display_type: 'element', data: {} }), false);
});
