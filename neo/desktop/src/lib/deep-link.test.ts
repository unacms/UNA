import { describe, expect, it } from 'vitest';

import { deepLinkFor, deepLinkTarget, normalizeSite, parseDeepLink } from './deep-link';
import type { SessionSummary } from './native';
import { routeToPath } from './router';

describe('parseDeepLink', () => {
    it('opens routes the app knows', () => {
        const link = parseDeepLink('una://open?path=%2Fhome%2Fpost%2F12');
        expect(link).not.toBeNull();
        expect(link?.site).toBeNull();
        expect(routeToPath(link!.route)).toBe('/home/post/12');
        expect(routeToPath(parseDeepLink('una://open?path=/messages/conversation/7')!.route)).toBe('/messages/conversation/7');
        expect(routeToPath(parseDeepLink('una://open?path=/search?q=lily%26tab=posts')!.route)).toBe('/search?q=lily&tab=posts');
        expect(routeToPath(parseDeepLink('una://open/?path=/settings/settings/keyboard')!.route)).toBe('/settings/settings/keyboard');
    });

    it('round-trips what deepLinkFor writes', () => {
        const link = parseDeepLink(deepLinkFor('/notifications/post/12/comment-99-in-55', 'https://community.example'));
        expect(link?.site).toBe('https://community.example');
        expect(routeToPath(link!.route)).toBe('/notifications/post/12/comment-99-in-55');
    });

    it('refuses anything that is not a known route of an una://open link', () => {
        for (const bad of [
            'https://community.example/view-post?id=1',
            'una://open',
            'una://open?path=',
            'una://open?path=home',
            'una://open?path=//evil.example/home',
            'una://open?path=/nowhere',
            'una://open?path=/home/post/abc/def/ghi',
            'una://open?path=/home?feed=nope',
            'una://sign-out?path=/home',
            'una://open/sign-out?path=/home',
            'una://open?path=/home&action=delete',
            'una://open?path=/home&path=/explore',
            'una://open?path=/home#x',
            'una://user:pw@open?path=/home',
            'una://open?path=/home&site=javascript:alert(1)',
            'una://open?path=/home&site=https://community.example/?x=1',
            'una://open?path=/home&site=ftp://community.example',
            `una://open?path=/home/post/1${'1'.repeat(3000)}`,
            'not a url',
        ])
            expect(parseDeepLink(bad), bad).toBeNull();
    });

    it('keeps site addresses in one form', () => {
        expect(normalizeSite('https://community.example/')).toBe('https://community.example');
        expect(normalizeSite('https://community.example/una/')).toBe('https://community.example/una');
        expect(normalizeSite('http://desktop.localhost:8090')).toBe('http://desktop.localhost:8090');
        expect(normalizeSite('https://u:p@community.example')).toBeNull();
    });
});

describe('deepLinkTarget', () => {
    const sessions: SessionSummary[] = [
        { key: 'https://a.example|3', siteUrl: 'https://a.example', siteName: 'A', accountName: 'Lily', active: true },
        { key: 'https://b.example|7', siteUrl: 'https://b.example', siteName: 'B', accountName: 'Mila', active: false },
    ];
    const home = parseDeepLink('una://open?path=/home')!;

    it('opens here when it names no network or this one', () => {
        expect(deepLinkTarget(home, sessions, 'https://a.example').kind).toBe('here');
        expect(deepLinkTarget({ ...home, site: 'https://a.example' }, sessions, 'https://a.example/').kind).toBe('here');
    });

    it('switches to another network signed in to, and never signs in to one that is not', () => {
        expect(deepLinkTarget({ ...home, site: 'https://b.example' }, sessions, 'https://a.example')).toMatchObject({ kind: 'switch', key: 'https://b.example|7' });
        expect(deepLinkTarget({ ...home, site: 'https://c.example' }, sessions, 'https://a.example')).toEqual({ kind: 'not-signed-in', site: 'https://c.example' });
    });
});
