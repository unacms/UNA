import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialCountState, nextCountState, settleCountState, splitCount } from './count-change.ts';

test('the number is found in the text around it', () => {
    assert.deepEqual(splitCount('3 followers'), { before: '', number: '3', after: ' followers' });
    assert.deepEqual(splitCount('Followers: 1,204'), { before: 'Followers: ', number: '1,204', after: '' });
    assert.deepEqual(splitCount('1 204 подписчика'), { before: '', number: '1 204', after: ' подписчика' });
    assert.deepEqual(splitCount('3K followers'), { before: '', number: '3K', after: ' followers' });
    assert.deepEqual(splitCount('2 mutual friends'), { before: '', number: '2', after: ' mutual friends' });
    assert.deepEqual(splitCount('No followers'), { before: 'No followers', number: '', after: '' });
});

test('a new number for the same profile is a change, up or down', () => {
    const shown = initialCountState('2 followers', 2, 7);
    assert.equal(shown.change, null, 'the first number is not a change');

    const more = nextCountState(shown, '3 followers', 3, 7);
    assert.deepEqual(more.change, { from: '2', direction: 'up', tick: 1 });
    assert.equal(more.text, '3 followers');

    const fewer = nextCountState(more, '2 followers', 2, 7);
    assert.deepEqual(fewer.change, { from: '3', direction: 'down', tick: 2 });
});

test('nothing new: the same state comes back', () => {
    const shown = initialCountState('2 followers', 2, 7);
    assert.equal(nextCountState(shown, '2 followers', 2, 7), shown);
    assert.equal(nextCountState(shown, '2 followers', '2', '7'), shown, 'UNA sends ids and counts as text too');

    const translated = nextCountState(shown, '2 подписчика', 2, 7);
    assert.equal(translated.text, '2 подписчика');
    assert.equal(translated.change, null, 'the language changed, not the count');
});

test('another profile in the same row is not a change', () => {
    const shown = nextCountState(initialCountState('2 followers', 2, 7), '3 followers', 3, 7);
    const recycled = nextCountState(shown, '9 followers', 9, 8);
    assert.equal(recycled.change, null);
    assert.equal(recycled.value, 9);
    assert.equal(recycled.tick, shown.tick, 'ticks keep counting, so a later change restarts the effect');
});

test('a count that appears or goes away does not roll', () => {
    const none = initialCountState('', null, 7);
    const first = nextCountState(none, '1 follower', 1, 7);
    assert.equal(first.change, null);
    assert.equal(nextCountState(first, '', undefined, 7).change, null);
});

test('the effect ends, unless a newer change has started', () => {
    const once = nextCountState(initialCountState('2 followers', 2, 7), '3 followers', 3, 7);
    assert.equal(settleCountState(once, 1).change, null);

    const twice = nextCountState(once, '4 followers', 4, 7);
    assert.equal(settleCountState(twice, 1), twice, 'the first timer does not end the second change');
    assert.equal(settleCountState(twice, 2).change, null);
});
