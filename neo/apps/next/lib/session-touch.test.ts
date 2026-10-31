// Run with `node --test apps/next/lib/session-touch.test.ts` from the NEO root (Node 24 strips the types).
import assert from 'node:assert/strict';
import test from 'node:test';
import {
    SESSION_MARK,
    SESSION_MARK_AGE,
    SESSION_RETRY_AGE,
    applySetCookies,
    hasStaleSessionMark,
    needsSessionTouch,
    parseSetCookie,
    sessionMarkAge,
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
    assert.deepEqual(parseSetCookie(`memberSession=abc; expires=${future}; path=/; HttpOnly`, NOW), { name: 'memberSession', value: 'abc', removed: false, expires: Date.parse(future) });
    assert.deepEqual(parseSetCookie(`memberSession=deleted; expires=${past}; Max-Age=0`, NOW), { name: 'memberSession', value: 'deleted', removed: true, expires: NOW });
    assert.equal(parseSetCookie('memberSession=abc; path=/', NOW)?.expires, null);
    assert.equal(parseSetCookie(`memberSession=abc; expires=${past}; Max-Age=60`, NOW)?.removed, false, 'Max-Age wins over Expires.');
    assert.equal(parseSetCookie(`memberSession=abc; expires=${past}`, NOW)?.removed, true);
    assert.equal(parseSetCookie('memberSession=abc; Max-Age=0', NOW)?.removed, true);
    assert.equal(parseSetCookie('memberSession=; path=/', NOW)?.removed, true);
    assert.equal(parseSetCookie('=abc', NOW), null);
    assert.equal(parseSetCookie('garbage', NOW), null);
});

test('the next touch comes while the browser cookie has half its time left', () => {
    const endingIn = (seconds: number) => `memberSession=abc; expires=${new Date(NOW + seconds * 1000).toUTCString()}; path=/`;
    assert.equal(sessionMarkAge(true, [endingIn(90 * 86400)], NOW), SESSION_MARK_AGE, 'A long lifetime touches every six hours.');
    assert.equal(sessionMarkAge(true, [endingIn(3600)], NOW), 1800, 'A one-hour lifetime touches every half hour.');
    assert.equal(sessionMarkAge(true, [endingIn(30)], NOW), 60, 'Never more often than once a minute.');
    assert.equal(sessionMarkAge(true, ['memberSession=abc; path=/'], NOW), SESSION_MARK_AGE, 'A browser session keeps the default.');
    assert.equal(sessionMarkAge(true, [], NOW), SESSION_MARK_AGE, 'No cookie back (guest, older backend): the default.');
    assert.equal(sessionMarkAge(true, ['lang=de; Max-Age=60'], NOW), SESSION_MARK_AGE, 'Other cookies do not count.');
    assert.equal(sessionMarkAge(false, [endingIn(3600)], NOW), SESSION_RETRY_AGE, 'A failed touch is retried sooner.');
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
