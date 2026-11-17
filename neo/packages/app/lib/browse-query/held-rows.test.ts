import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refreshHeldRows } from './held-rows.ts';

test('held rows keep their place and take their newest copy', () => {
    const a = { id: 1, followers_count: 2 };
    const b = { id: 2, followers_count: 5 };
    const held = [a, b];
    const a2 = { id: 1, followers_count: 3 };
    const added = { id: 9, followers_count: 0 };

    const rows = refreshHeldRows(held, [added, a2, b]);
    assert.deepEqual(rows, [a2, b], 'the new row stays held back, the order is the held one');
    assert.equal(rows[0], a2);
    assert.equal(rows[1], b);
});

test('nothing newer: the held rows come back as they are', () => {
    const held = [{ id: 1 }, { id: 2 }];
    assert.equal(refreshHeldRows(held, [...held].reverse()), held);
    assert.equal(refreshHeldRows(held, []), held);
    assert.equal(refreshHeldRows(held, [{ id: 7 }]), held, 'a held row that left the cache stays');
});

test('ids match as text, rows without one are left alone', () => {
    // Loosely typed, as list items are in the cache.
    const noId: any = { title: 'skeleton' };
    const rows = refreshHeldRows<any>([{ id: '1', n: 1 }, noId], [{ id: 1, n: 2 }]);
    assert.deepEqual(rows, [{ id: 1, n: 2 }, noId]);
    assert.equal(rows[1], noId);
});
