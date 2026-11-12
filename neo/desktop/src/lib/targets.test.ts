import { describe, expect, it } from 'vitest';

import type { Schema } from 'una-api';

import { parseRoute, routeToPath } from './router';
import { isSiteLink, linkRoute, notificationRoute, type TargetKind, targetRoute } from './targets';

type Notification = Schema<'Notification'>;

const notification = (over: Partial<Notification>): Notification => ({
    id: '50',
    kind: 'social.comment',
    source: 'bx_timeline.commentPost',
    module: 'bx_timeline',
    actors: 1,
    text: 'Eric commented on your post',
    url: 'https://community.example/item?id=12',
    object_kind: 'other',
    object_id: null,
    item_id: null,
    thread_id: null,
    data: {},
    read: false,
    created_at: '2026-11-06T10:00:00Z',
    updated_at: '2026-11-06T10:00:00Z',
    ...over,
});

describe('every object_kind of a notification has a route', () => {
    // one row per kind the API sends (Notification.object_kind): the table must cover them all
    const table: [Notification['object_kind'], Partial<Notification>, string | null][] = [
        ['content', { object_id: '12' }, '/notifications/post/12'],
        ['comment', { object_id: '99', item_id: '12' }, '/notifications/post/12/comment-99'],
        ['comment', { object_id: '99', item_id: '12', thread_id: '55' }, '/notifications/post/12/comment-99-in-55'],
        ['profile', { object_id: '8' }, '/notifications/profile/8'],
        ['conversation', { object_id: '7' }, '/notifications/conversation/7'],
        ['other', {}, null],
    ];

    it.each(table)('%s %j', (kind, fields, path) => {
        const route = notificationRoute(notification({ object_kind: kind, ...fields }));
        if (path === null) {
            expect(route).toBeNull();
            return;
        }
        expect(route).not.toBeNull();
        const full = { list: { section: 'notifications' as const }, detail: route };
        expect(routeToPath(full)).toBe(path);
        // the path comes back as the same route (history, deep links)
        expect(parseRoute(path)).toEqual(full);
    });

    it('covers every kind', () => {
        const kinds: Record<Notification['object_kind'], true> = { content: true, comment: true, profile: true, conversation: true, other: true };
        const covered = new Set(table.map(([k]) => k));
        expect([...covered].sort()).toEqual(Object.keys(kinds).sort());
    });

    it('opens the new comment of a comment or reply, which is about the item', () => {
        const comment = notificationRoute(notification({ kind: 'social.comment', object_kind: 'content', object_id: '12', item_id: '12', data: { comment_id: '99' } }));
        expect(routeToPath({ list: { section: 'notifications' }, detail: comment })).toBe('/notifications/post/12/comment-99');
        const reply = notificationRoute(notification({ kind: 'social.reply', object_kind: 'content', object_id: '12', item_id: '12', thread_id: '55', data: { comment_id: '99' } }));
        expect(routeToPath({ list: { section: 'notifications' }, detail: reply })).toBe('/notifications/post/12/comment-99-in-55');
        // a reaction to the post has no comment: the post
        expect(notificationRoute(notification({ kind: 'social.reacted', object_kind: 'content', object_id: '12', data: { kind: 'like' } }))).toEqual({ kind: 'post', id: '12' });
    });

    it('opens nothing without the ids it needs', () => {
        expect(notificationRoute(notification({ object_kind: 'content', object_id: null }))).toBeNull();
        expect(notificationRoute(notification({ object_kind: 'comment', object_id: '99', item_id: null }))).toBeNull();
    });

    it('opens nothing for a kind a newer site sends', () => {
        expect(targetRoute({ kind: 'event' as TargetKind, id: '1' })).toBeNull();
    });
});

describe('resolved site links', () => {
    const link = (kind: Schema<'LinkTarget'>['kind'], id: string, item_id: string | null = null): Schema<'LinkTarget'> => ({ kind, id, item_id, thread_id: null });

    it('open posts, profiles, groups, conversations and comments', () => {
        expect(linkRoute(link('content', '12'))).toEqual({ kind: 'post', id: '12' });
        expect(linkRoute(link('profile', '8'))).toEqual({ kind: 'profile', id: '8' });
        expect(linkRoute(link('group', '13'))).toEqual({ kind: 'group', id: '13' });
        expect(linkRoute(link('conversation', '7'))).toEqual({ kind: 'conversation', id: '7' });
        expect(linkRoute(link('comment', '99', '12'))).toEqual({ kind: 'post', id: '12', comment: '99' });
    });

    it('are asked about only for the signed-in site', () => {
        const site = 'https://community.example';
        expect(isSiteLink('https://community.example/view-post/hello', site)).toBe(true);
        expect(isSiteLink('http://COMMUNITY.example/item?id=1', site)).toBe(true);
        expect(isSiteLink('https://community.example', site)).toBe(true);
        expect(isSiteLink('https://community.example.evil.test/item', site)).toBe(false);
        expect(isSiteLink('https://other.example/item', site)).toBe(false);
        expect(isSiteLink('https://me@community.example/item', site)).toBe(false);
        expect(isSiteLink('mailto:a@community.example', site)).toBe(false);
        expect(isSiteLink('https://community.example:8443/item', site)).toBe(false);
        // a site in a folder
        expect(isSiteLink('https://host.example/una/item?id=1', 'https://host.example/una/')).toBe(true);
        expect(isSiteLink('https://host.example/other/item', 'https://host.example/una/')).toBe(false);
    });
});
