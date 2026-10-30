// Run with `node --test apps/next/lib/session-touch.test.ts` from the NEO root (Node 24 strips the types).
import assert from 'node:assert/strict';
import test from 'node:test';
import {
    SESSION_MARK,
    applySetCookies,
    hasStaleSessionMark,
    needsSessionTouch,
    parseSetCookie,
    sessionMarkCookie,
} from './session-touch.ts';

const jar = (...names: string[]) => ({ has: (name: string) => names.includes(name) });
const NOW = Date.parse('2026-10-30T12:00:00Z');

test('only a session without a fresh mark is touched', () => {
    assert.equal(needsSessionTouch(jar('memberSession')), true);
    assert.equal(needsSessionTouch(jar('memberSession', SESSION_MARK)), false);
    assert.equal(needsSessionTouch(jar('neo_lang')), false);
});

test('a mark without a session is stale', () => {
    assert.equal(hasStaleSessionMark(jar(SESSION_MARK)), true);
    assert.equal(hasStaleSessionMark(jar(SESSION_MARK, 'memberSession')), false);
    assert.equal(hasStaleSessionMark(jar()), false);
});

test('the mark is a host-wide HttpOnly cookie', () => {
    assert.equal(sessionMarkCookie(3600, true), 'neo_session_ok=1; Path=/; Max-Age=3600; HttpOnly; SameSite=Lax; Secure');
    assert.equal(sessionMarkCookie(0, false), 'neo_session_ok=1; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
});

test('Set-Cookie lines that remove a cookie are recognised', () => {
    const future = 'Fri, 29 Jan 2027 12:00:00 GMT';
    const past = 'Thu, 29 Oct 2026 12:00:00 GMT';
    assert.deepEqual(parseSetCookie(`memberSession=abc; expires=${future}; path=/; HttpOnly`, NOW), { name: 'memberSession', value: 'abc', removed: false });
    assert.deepEqual(parseSetCookie(`memberSession=deleted; expires=${past}; Max-Age=0`, NOW), { name: 'memberSession', value: 'deleted', removed: true });
    assert.equal(parseSetCookie(`memberSession=abc; expires=${past}`, NOW)?.removed, true);
    assert.equal(parseSetCookie('memberSession=abc; Max-Age=0', NOW)?.removed, true);
    assert.equal(parseSetCookie('memberSession=; path=/', NOW)?.removed, true);
    assert.equal(parseSetCookie('=abc', NOW), null);
    assert.equal(parseSetCookie('garbage', NOW), null);
});

test('the forwarded Cookie header follows the Set-Cookie lines', () => {
    const header = 'neo_lang=en; memberSession=old; memberID=1';
    assert.equal(
        applySetCookies(header, ['memberSession=new; expires=Fri, 29 Jan 2027 12:00:00 GMT; path=/'], NOW),
        'neo_lang=en; memberSession=new; memberID=1',
    );
    assert.equal(
        applySetCookies(header, ['memberSession=deleted; Max-Age=0', 'memberID=; path=/'], NOW),
        'neo_lang=en',
    );
    assert.equal(applySetCookies('', ['lang=de; path=/'], NOW), 'lang=de');
    assert.equal(applySetCookies(header, [], NOW), header);
});
