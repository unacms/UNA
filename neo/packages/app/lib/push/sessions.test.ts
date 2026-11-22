import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPushSessions } from './sessions.ts';

function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => { resolve = r; });
    return { promise, resolve };
}

test('a link asked for in the current session runs', async () => {
    const sessions = createPushSessions();
    const calls: string[] = [];
    assert.equal(await sessions.link(sessions.current(), async () => { calls.push('login'); }), true);
    assert.deepEqual(calls, ['login']);
});

test('a link asked for before the session ended is dropped', async () => {
    const sessions = createPushSessions();
    const calls: string[] = [];
    // "Turn on" is pressed, the system's request stays open, the member signs out, then says yes.
    const pressedIn = sessions.current();
    await sessions.end(async () => { calls.push('logout'); });
    assert.equal(await sessions.link(pressedIn, async () => { calls.push('login'); }), false);
    assert.deepEqual(calls, ['logout']);
});

test('the session ends at once, before its unlink has run', async () => {
    const sessions = createPushSessions();
    const calls: string[] = [];
    const pressedIn = sessions.current();
    const gate = deferred();
    const ended = sessions.end(async () => { await gate.promise; calls.push('logout'); });
    const linked = sessions.link(pressedIn, async () => { calls.push('login'); });
    gate.resolve();
    await ended;
    assert.equal(await linked, false);
    assert.deepEqual(calls, ['logout']);
});

test('an unlink waits for a link that is on its way, so it comes last', async () => {
    const sessions = createPushSessions();
    const calls: string[] = [];
    const gate = deferred();
    const linked = sessions.link(sessions.current(), async () => {
        calls.push('login');
        await gate.promise;
        calls.push('tag');
    });
    // The link has started (its login is out) when the member signs out.
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(calls, ['login']);
    const ended = sessions.end(async () => { calls.push('logout'); });
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(calls, ['login']);
    gate.resolve();
    assert.equal(await linked, true);
    await ended;
    assert.deepEqual(calls, ['login', 'tag', 'logout']);
});

test('the next session links again', async () => {
    const sessions = createPushSessions();
    const calls: string[] = [];
    await sessions.end(async () => { calls.push('logout'); });
    assert.equal(await sessions.link(sessions.current(), async () => { calls.push('login'); }), true);
    assert.deepEqual(calls, ['logout', 'login']);
});

test('a link that fails rejects and does not hold up what follows', async () => {
    const sessions = createPushSessions();
    const calls: string[] = [];
    await assert.rejects(sessions.link(sessions.current(), async () => { throw new Error('offline'); }), /offline/);
    await sessions.end(async () => { calls.push('logout'); });
    assert.equal(await sessions.link(sessions.current(), async () => { calls.push('login'); }), true);
    assert.deepEqual(calls, ['logout', 'login']);
});

test('an unlink that fails rejects and does not hold up what follows', async () => {
    const sessions = createPushSessions();
    const calls: string[] = [];
    await assert.rejects(sessions.end(async () => { throw new Error('sdk'); }), /sdk/);
    assert.equal(await sessions.link(sessions.current(), async () => { calls.push('login'); }), true);
    assert.deepEqual(calls, ['login']);
});
