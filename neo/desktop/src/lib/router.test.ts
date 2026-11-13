import { describe, expect, it, vi } from 'vitest';

import { categoryPage, connectionsPage, connectionsRoute, feedRoute, groupPage, groupRoute, isPage, listFeed, listPath, pageDetail, pageRoute, parseRoute, profilePage, profileRoute, type Route, RouteHistory, routeToPath, ScrollMemory, searchRoute, sectionRoute, SECTIONS, settingsRoute } from './router';

describe('search routes', () => {
    it('keep the words and the tab in the path, and read it back', () => {
        const cases: [Route, string][] = [
            [{ list: searchRoute(''), detail: null }, '/search'],
            [{ list: searchRoute('  lily  '), detail: null }, '/search?q=lily'],
            [{ list: searchRoute('lily carter', 'posts'), detail: null }, '/search?q=lily+carter&tab=posts'],
            [{ list: searchRoute('a/b?c&d', 'groups'), detail: { kind: 'post', id: '12' } }, '/search/post/12?q=a%2Fb%3Fc%26d&tab=groups'],
            [{ list: searchRoute('', 'posts'), detail: null }, '/search?tab=posts'],
        ];
        for (const [route, path] of cases) {
            expect(routeToPath(route)).toBe(path);
            expect(parseRoute(path)).toEqual(route);
        }
        expect(searchRoute('x'.repeat(150)).q).toHaveLength(100);
        expect(listPath(searchRoute('lily', 'posts'))).toBe('/search?q=lily&tab=posts');
    });

    it('refuse other forms of the same search, and words elsewhere', () => {
        for (const path of ['/search?tab=people', '/search?q=', '/search?q=+lily', '/search?tab=posts&q=lily', '/search?q=a&q=b', '/search?q=a&x=1', '/search?tab=nope', '/home?q=lily'])
            expect(parseRoute(path), path).toBeNull();
    });
});

const post = (id: string): Route => ({ list: { section: 'home' }, detail: { kind: 'post', id } });

describe('unsaved changes in the detail shown', () => {
    const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

    it('are asked about before another detail, or none, is shown, by push, Back and Forward', async () => {
        const history = new RouteHistory(post('1'));
        history.push(post('2'));
        let dirty = false;
        let discard = false;
        const confirm = vi.fn(() => Promise.resolve(discard));
        const off = history.guard({ dirty: () => dirty, confirm });
        // nothing unsaved: nothing is asked
        history.push(post('3'));
        expect(routeToPath(history.current)).toBe('/home/post/3');
        expect(confirm).not.toHaveBeenCalled();

        dirty = true;
        const seen = vi.fn();
        history.subscribe(seen);
        history.push(post('4'));
        history.push({ list: { section: 'home' }, detail: null });
        expect(history.back()).toBe(true);
        await settled();
        // one question at a time, answered no: it stays
        expect(confirm).toHaveBeenCalledTimes(1);
        expect(routeToPath(history.current)).toBe('/home/post/3');
        expect(seen).not.toHaveBeenCalled();
        // another list beside the same detail takes nothing away
        history.push({ list: { section: 'explore' }, detail: post('3').detail });
        expect(routeToPath(history.current)).toBe('/explore/post/3');
        expect(confirm).toHaveBeenCalledTimes(1);

        discard = true;
        history.back();
        expect(routeToPath(history.current)).toBe('/home/post/3');
        expect(confirm).toHaveBeenCalledTimes(1);
        history.back();
        await settled();
        expect(confirm).toHaveBeenCalledTimes(2);
        expect(routeToPath(history.current)).toBe('/home/post/2');
        history.forward();
        await settled();
        expect(routeToPath(history.current)).toBe('/home/post/3');
        history.push(post('5'));
        await settled();
        expect(routeToPath(history.current)).toBe('/home/post/5');
        expect(confirm).toHaveBeenCalledTimes(4);

        // the form went: nothing is asked any more
        off();
        history.push(post('6'));
        expect(routeToPath(history.current)).toBe('/home/post/6');
        expect(confirm).toHaveBeenCalledTimes(4);
    });

    it('stay when the question fails, and are not asked about by what follows something done', async () => {
        const history = new RouteHistory(post('1'));
        const confirm = vi.fn(() => Promise.reject(new Error('no dialog')));
        history.guard({ dirty: () => true, confirm });
        const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
        history.push(post('2'));
        await settled();
        expect(routeToPath(history.current)).toBe('/home/post/1');
        expect(logged).toHaveBeenCalled();
        logged.mockRestore();
        // a deleted post is closed, another profile starts over: nobody is asked
        history.forget({ kind: 'post', id: '1' });
        expect(routeToPath(history.current)).toBe('/home');
        history.reset(post('9'));
        expect(routeToPath(history.current)).toBe('/home/post/9');
        expect(confirm).toHaveBeenCalledTimes(1);
    });
});

describe('pages: profiles and groups in the content pane', () => {
    it('are list routes with their tab, one string form each', () => {
        const cases: [Route, string][] = [
            [{ list: profilePage(null), detail: null }, '/profile'],
            [{ list: profilePage(null, 'friends'), detail: null }, '/profile?tab=friends'],
            [{ list: profilePage('8'), detail: null }, '/profile?id=8'],
            [{ list: profilePage('8', 'about'), detail: null }, '/profile?id=8&tab=about'],
            [{ list: profilePage('8'), detail: { kind: 'post', id: '5' } }, '/profile/post/5?id=8'],
            [groupRoute('67'), '/groups?group=67'],
            [groupRoute('67', 'members'), '/groups?group=67&tab=members'],
            [{ list: groupPage('67'), detail: { kind: 'post', id: '5', comment: '9' } }, '/groups/post/5/comment-9?group=67'],
        ];
        for (const [route, path] of cases) {
            expect(routeToPath(route)).toBe(path);
            expect(parseRoute(path)).toEqual(route);
        }
        for (const bad of ['/profile?id=x', '/profile?tab=posts', '/profile?tab=friends&id=8', '/profile?id=8&tab=likes', '/profile?id=8&x=1', '/groups?group=67&tab=posts', '/home?id=8'])
            expect(parseRoute(bad), bad).toBeNull();
        expect(isPage(profilePage(null))).toBe(true);
        expect(isPage(groupPage('67'))).toBe(true);
        expect(isPage({ section: 'groups' })).toBe(false);
        expect(isPage({ section: 'home' })).toBe(false);
    });

    it('open where a detail would have: the main window history keeps them as pages', () => {
        expect(pageRoute({ list: { section: 'home' }, detail: profileRoute('8', 'followers') })).toEqual({ list: profilePage('8', 'followers'), detail: null });
        expect(pageRoute({ list: { section: 'search', q: 'x' }, detail: { kind: 'group', id: '67', tab: 'about' } })).toEqual(groupRoute('67', 'about'));
        // a post stays beside its list
        expect(pageRoute(post('12'))).toEqual(post('12'));
        // an older path, a deep link, a notification: the page
        const h = new RouteHistory(parseRoute('/notifications/profile/8/friends')!);
        expect(h.snapshot().paths).toEqual(['/profile?id=8&tab=friends']);
        h.push({ list: h.current.list, detail: { kind: 'post', id: '5' } });
        h.push({ list: h.current.list, detail: { kind: 'group', id: '67' } });
        h.replace({ list: { section: 'home' }, detail: profileRoute('9') });
        expect(h.snapshot().paths).toEqual(['/profile?id=8&tab=friends', '/profile/post/5?id=8&tab=friends', '/profile?id=9']);
        h.reset({ list: { section: 'home' }, detail: { kind: 'group', id: '1' } });
        expect(h.snapshot().paths).toEqual(['/groups?group=1']);
    });

    it('stay details in a window of its own, which keeps them', () => {
        const h = new RouteHistory({ list: { section: 'home' }, detail: profileRoute('8') }, undefined, (r) => r);
        expect(h.snapshot().paths).toEqual(['/home/profile/8']);
        h.push({ list: { section: 'home' }, detail: { kind: 'group', id: '67', tab: 'members' } });
        expect(h.snapshot().paths).toEqual(['/home/profile/8', '/home/group/67/members']);
    });

    it('name the detail a window of its own takes for the page shown', () => {
        expect(pageDetail(groupPage('67'))).toEqual({ kind: 'group', id: '67' });
        expect(pageDetail(groupPage('67', 'members'))).toEqual({ kind: 'group', id: '67', tab: 'members' });
        expect(pageDetail(profilePage('8', 'friends'))).toEqual(profileRoute('8', 'friends'));
        // one's own page names no id: the acting profile's
        expect(pageDetail(profilePage(null))).toBeNull();
        expect(pageDetail(profilePage(null), '4')).toEqual(profileRoute('4'));
        expect(pageDetail({ section: 'home' }, '4')).toBeNull();
        expect(pageDetail({ section: 'groups' })).toBeNull();
    });
});

describe('a category of Posts or Discussions', () => {
    it('has one path, the feed first, the default feed not written out', () => {
        const cases: [string, Route][] = [
            ['/posts?category=3', { list: categoryPage('posts', '3'), detail: null }],
            ['/posts?feed=popular&category=3', { list: categoryPage('posts', '3', 'popular'), detail: null }],
            ['/discussions?feed=new&category=1', { list: categoryPage('discussions', '1', 'new'), detail: null }],
            ['/posts/article/9?category=3', { list: categoryPage('posts', '3'), detail: { kind: 'article', id: '9' } }],
        ];
        for (const [path, route] of cases) {
            expect(routeToPath(route)).toBe(path);
            expect(parseRoute(path)).toEqual(route);
        }
        expect(categoryPage('posts', '3', 'mine')).toEqual({ section: 'posts', feed: 'mine' });
        expect(categoryPage('posts', null, 'popular')).toEqual({ section: 'posts', feed: 'popular' });
        for (const bad of ['/posts?category=x', '/posts?category=3&feed=popular', '/posts?feed=latest&category=3', '/posts?feed=mine&category=3', '/posts?category=3&q=1', '/home?category=3', '/discussions?feed=hot&category=1'])
            expect(parseRoute(bad), bad).toBeNull();
    });
});

describe('route paths', () => {
    const routes: Route[] = [
        ...SECTIONS.map(sectionRoute),
        post('12'),
        { list: { section: 'messages' }, detail: { kind: 'conversation', id: '7' } },
        { list: { section: 'messages' }, detail: { kind: 'new-message', profileId: '8' } },
        { list: { section: 'profile' }, detail: { kind: 'post', id: 'a/b c?' } },
        { list: { section: 'home', feed: 'hot' }, detail: null },
        { list: { section: 'home', feed: 'for-you' }, detail: { kind: 'post', id: '5' } },
        { list: { section: 'explore', feed: 'hot' }, detail: null },
        { list: { section: 'home' }, detail: { kind: 'profile', id: '8' } },
        { list: { section: 'notifications' }, detail: { kind: 'profile', id: '8', tab: 'followers' } },
        { list: { section: 'home', feed: 'hot' }, detail: { kind: 'profile', id: '8', tab: 'friends' } },
        connectionsRoute('requests'),
        connectionsRoute('sent'),
        connectionsRoute('following'),
        connectionsRoute('followers'),
        { list: { section: 'notifications', filter: 'unread' }, detail: null },
        { list: { section: 'notifications', filter: 'unread' }, detail: { kind: 'post', id: '12', comment: '99' } },
        { list: { section: 'notifications' }, detail: { kind: 'post', id: '12', comment: '99', thread: '55' } },
    ];

    it.each(routes.map((r) => [routeToPath(r), r] as const))('%s round-trips', (path, route) => {
        expect(parseRoute(path)).toEqual(route);
    });

    it('writes profile tabs as a path part, Posts not at all', () => {
        expect(routeToPath({ list: { section: 'home' }, detail: profileRoute('8') })).toBe('/home/profile/8');
        expect(routeToPath({ list: { section: 'home' }, detail: profileRoute('8', 'posts') })).toBe('/home/profile/8');
        expect(routeToPath({ list: { section: 'home' }, detail: profileRoute('8', 'following') })).toBe('/home/profile/8/following');
    });

    it('has Connections at its tabs, Friends not written out', () => {
        expect(routeToPath(connectionsRoute())).toBe('/connections');
        expect(routeToPath(connectionsRoute('friends'))).toBe('/connections');
        expect(routeToPath(connectionsRoute('requests'))).toBe('/connections?tab=requests');
        expect(listPath(connectionsPage('sent'))).toBe('/connections?tab=sent');
        expect(parseRoute('/connections')).toEqual(connectionsRoute('friends'));
        expect(parseRoute('/connections?tab=followers')).toEqual(connectionsRoute('followers'));
        for (const bad of ['/connections?tab=friends', '/connections?tab=nope', '/connections?tab=sent&x=1', '/connections?feed=hot', '/connections?tab=sent&tab=sent', '/connections/friends'])
            expect(parseRoute(bad), bad).toBeNull();
    });

    it('takes the friend requests detail of older paths and links to Connections\' Requests tab', () => {
        expect(parseRoute('/notifications/friend-requests')).toEqual(connectionsRoute('requests'));
        expect(parseRoute('/home/friend-requests')).toEqual(connectionsRoute('requests'));
        expect(parseRoute('/home/friend-requests?feed=hot')).toEqual(connectionsRoute('requests'));
        expect(parseRoute('/notifications/friend-requests/1')).toBeNull();
    });

    it('keeps a section\'s own parts beside its own list in the main window', () => {
        // a part of Settings or a new conversation opened over another list brings its section
        expect(pageRoute({ list: { section: 'notifications' }, detail: { kind: 'settings', tab: 'account' } })).toEqual(settingsRoute('account'));
        expect(pageRoute({ list: { section: 'home', feed: 'hot' }, detail: { kind: 'new-message', profileId: '8' } })).toEqual({ list: { section: 'messages' }, detail: { kind: 'new-message', profileId: '8' } });
        expect(pageRoute(settingsRoute('keyboard'))).toEqual(settingsRoute('keyboard'));
        // an item opens beside the list it was picked in
        expect(pageRoute(post('12'))).toEqual(post('12'));
        const h = new RouteHistory(sectionRoute('notifications'));
        h.push({ list: h.current.list, detail: { kind: 'settings', tab: 'about' } });
        expect(h.snapshot().paths).toEqual(['/notifications', '/settings/settings/about']);
    });

    it('writes readable paths', () => {
        expect(routeToPath(sectionRoute('home'))).toBe('/home');
        expect(routeToPath(post('12'))).toBe('/home/post/12');
        expect(routeToPath({ list: { section: 'profile' }, detail: { kind: 'post', id: 'a/b' } })).toBe('/profile/post/a%2Fb');
    });

    it('names a feed only when it is not the section\'s default', () => {
        expect(routeToPath({ list: { section: 'home', feed: 'hot' }, detail: { kind: 'post', id: '12' } })).toBe('/home/post/12?feed=hot');
        expect(listPath({ section: 'home', feed: 'hot' })).toBe('/home?feed=hot');
        expect(feedRoute('home', 'following')).toEqual({ section: 'home' });
        expect(feedRoute('explore', 'latest')).toEqual({ section: 'explore' });
        expect(parseRoute('/home?feed=following')).toEqual(sectionRoute('home'));
        expect(listFeed({ section: 'home' })).toBe('following');
        expect(listFeed({ section: 'explore' })).toBe('latest');
        expect(listFeed({ section: 'messages' })).toBeNull();
    });

    it('has Settings, its parts and editing a profile', () => {
        expect(routeToPath(settingsRoute())).toBe('/settings/settings/account');
        expect(routeToPath(settingsRoute('keyboard'))).toBe('/settings/settings/keyboard');
        expect(parseRoute('/settings/settings/startup')).toEqual(settingsRoute('startup'));
        expect(parseRoute('/settings')).toEqual(sectionRoute('settings'));
        expect(parseRoute('/settings/edit-profile/4')).toEqual({ list: { section: 'settings' }, detail: { kind: 'edit-profile', id: '4' } });
        for (const bad of ['/settings/settings/nope', '/settings/settings', '/settings/edit-profile/x', '/settings/settings/account/more', '/settings?tab=keyboard'])
            expect(parseRoute(bad), bad).toBeNull();
    });

    it('rejects anything else', () => {
        for (const path of [
            '',
            '/',
            '/settingz',
            '/home/post',
            '/home/post/',
            '/home/unknown/1',
            '/home/post/1/extra',
            '/home/post/%E0%A4%A',
            '/home?feed=latest',
            '/messages?feed=hot',
            '/home?feed=hot&x=1',
            '/home?feed=',
            '/home?x=1?y=2',
            '/home/profile/8/posts',
            '/home/profile/8/likes',
            '/home/profile/8/friends/x',
            '/home/post/8/friends',
            '/notifications/friend-requests/1',
            '/notifications?filter=read',
            '/home?filter=unread',
            '/notifications?filter=unread&feed=hot',
            '/notifications/post/12/comment-',
            '/notifications/post/12/comment-x',
            '/notifications/post/12/comment-99-in-',
            '/notifications/post/12/comment-99/x',
        ]) {
            expect(parseRoute(path), path).toBeNull();
        }
    });

    it('writes a filter and a comment in a post readably', () => {
        expect(routeToPath({ list: { section: 'notifications', filter: 'unread' }, detail: null })).toBe('/notifications?filter=unread');
        expect(routeToPath({ list: { section: 'notifications' }, detail: { kind: 'post', id: '12', comment: '99', thread: '55' } })).toBe('/notifications/post/12/comment-99-in-55');
        expect(listPath({ section: 'notifications', filter: 'unread' })).toBe('/notifications?filter=unread');
    });

    it('takes paths without the leading or trailing slash', () => {
        expect(parseRoute('home/post/3/')).toEqual(post('3'));
    });
});

describe('RouteHistory', () => {
    it('pushes, goes back and forward', () => {
        const h = new RouteHistory(sectionRoute('home'));
        expect(h.canGoBack).toBe(false);
        h.push(post('1'));
        h.push(sectionRoute('explore'));
        expect(h.snapshot()).toEqual({ paths: ['/home', '/home/post/1', '/explore'], index: 2 });

        expect(h.back()).toBe(true);
        expect(routeToPath(h.current)).toBe('/home/post/1');
        expect(h.back()).toBe(true);
        expect(h.back()).toBe(false);
        expect(routeToPath(h.current)).toBe('/home');

        expect(h.forward()).toBe(true);
        expect(h.forward()).toBe(true);
        expect(h.forward()).toBe(false);
        expect(routeToPath(h.current)).toBe('/explore');
    });

    it('drops the forward entries when pushing after going back', () => {
        const h = new RouteHistory(sectionRoute('home'));
        h.push(sectionRoute('explore'));
        h.push(sectionRoute('messages'));
        h.back();
        h.push(sectionRoute('profile'));
        expect(h.snapshot()).toEqual({ paths: ['/home', '/explore', '/profile'], index: 2 });
        expect(h.canGoForward).toBe(false);
    });

    it('ignores a push of the current route', () => {
        const h = new RouteHistory(sectionRoute('home'));
        const listener = vi.fn();
        h.subscribe(listener);
        h.push(sectionRoute('home'));
        expect(h.snapshot().paths).toEqual(['/home']);
        expect(listener).not.toHaveBeenCalled();
    });

    it('replaces the current entry', () => {
        const h = new RouteHistory(sectionRoute('messages'));
        h.push({ list: { section: 'messages' }, detail: { kind: 'new-message', profileId: '8' } });
        h.replace({ list: { section: 'messages' }, detail: { kind: 'conversation', id: '3' } });
        expect(h.snapshot()).toEqual({ paths: ['/messages', '/messages/conversation/3'], index: 1 });
    });

    it('tells subscribers about every move, and stops when they unsubscribe', () => {
        const h = new RouteHistory(sectionRoute('home'));
        const listener = vi.fn();
        const stop = h.subscribe(listener);
        h.push(post('1'));
        h.back();
        h.forward();
        expect(listener).toHaveBeenCalledTimes(3);
        stop();
        h.back();
        expect(listener).toHaveBeenCalledTimes(3);
    });

    it('starts over at one route', () => {
        const h = new RouteHistory(sectionRoute('home'));
        h.push(post('1'));
        h.push(sectionRoute('profile'));
        h.back();
        const listener = vi.fn();
        h.subscribe(listener);
        h.reset(sectionRoute('profile'));
        expect(h.snapshot()).toEqual({ paths: ['/profile'], index: 0 });
        expect(h.canGoBack || h.canGoForward).toBe(false);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('forgets a detail everywhere, closing it when open', () => {
        const h = new RouteHistory(sectionRoute('home'));
        h.push(post('12'));
        h.push(sectionRoute('explore'));
        h.push({ list: { section: 'explore' }, detail: { kind: 'post', id: '12' } });
        h.push(post('3'));
        h.back();
        const listener = vi.fn();
        h.subscribe(listener);

        h.forget({ kind: 'post', id: '12' });
        // /home/post/12 became /home and merged with the /home before it
        expect(h.snapshot()).toEqual({ paths: ['/home', '/explore', '/home/post/3'], index: 1 });
        expect(listener).toHaveBeenCalledTimes(1);
        expect(h.back()).toBe(true);
        expect(routeToPath(h.current)).toBe('/home');
    });

    it('forgets a post with the comments in it that routes point to', () => {
        const h = new RouteHistory(sectionRoute('notifications'));
        h.push({ list: { section: 'notifications' }, detail: { kind: 'post', id: '12', comment: '99' } });
        h.forget({ kind: 'post', id: '12' });
        expect(h.snapshot()).toEqual({ paths: ['/notifications'], index: 0 });
    });

    it('keeps the current route as it is when a forgotten detail is elsewhere in history', () => {
        const h = new RouteHistory(sectionRoute('home'));
        h.push(post('12'));
        h.push(sectionRoute('explore'));
        const current = h.current;
        const listener = vi.fn();
        h.subscribe(listener);

        h.forget({ kind: 'post', id: '12' });
        expect(h.snapshot()).toEqual({ paths: ['/home', '/explore'], index: 1 });
        expect(h.current).toBe(current);
        expect(listener).not.toHaveBeenCalled();

        h.forget({ kind: 'post', id: '99' });
        expect(h.snapshot()).toEqual({ paths: ['/home', '/explore'], index: 1 });
    });

    it('keeps at most the limit of entries', () => {
        const h = new RouteHistory(sectionRoute('home'), 3);
        for (const id of ['1', '2', '3', '4']) h.push(post(id));
        expect(h.snapshot()).toEqual({ paths: ['/home/post/2', '/home/post/3', '/home/post/4'], index: 2 });
    });
});

describe('ScrollMemory', () => {
    it('remembers positions per key', () => {
        const m = new ScrollMemory();
        m.set('/home', 120);
        m.set('/explore', 40);
        expect(m.get('/home')).toBe(120);
        expect(m.get('/explore')).toBe(40);
        expect(m.get('/messages')).toBeUndefined();
    });

    it('clears every position', () => {
        const m = new ScrollMemory();
        m.set('/home', 120);
        m.clear();
        expect(m.get('/home')).toBeUndefined();
    });

    it('forgets the least recently written key past the limit', () => {
        const m = new ScrollMemory(2);
        m.set('a', 1);
        m.set('b', 2);
        m.set('a', 3);
        m.set('c', 4);
        expect(m.get('b')).toBeUndefined();
        expect(m.get('a')).toBe(3);
        expect(m.get('c')).toBe(4);
    });
});
