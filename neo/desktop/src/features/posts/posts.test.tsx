import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { ActivityCard } from '../../components/activity-card';
import { MenuHost } from '../../components/menu-popover';
import { ago } from '../../lib/api';
import { AnnounceContext } from '../../lib/announce';
import { AppContext, type AppContextValue } from '../../lib/context';
import { RouterProvider, useRoute } from '../../lib/navigation';
import { opensInWindow } from '../../lib/open-in-window';
import { parseRoute, type Route, RouteHistory, routeToPath } from '../../lib/router';
import { setSiteModules } from '../../lib/site-modules';
import { contextTabs, tabLabel } from '../groups/group-view';
import { isEditableText, mayBeCutSummary, postChanges, postChangesBlocker, postSummary, postValue } from './edit-post';
import { NewPost, newPostBlocker, newPostFieldError } from './new-post';
import { Posts, PostsOfTab } from './post-list';
import { PostPane } from './post-pane';
import { activityDetail, type Post, postKey, postListKey, postRowText, readingText, stateText } from './posts';
import { setRichText } from '../../components/rich-editor/test-utils';

const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily Carter', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const mila: Schema<'Profile'> = { id: '8', kind: 'person', module: 'bx_persons', display_name: 'Mila Novak', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z', badges: [{ id: '9', name: 'Photographer', color: null, icon: null }] };
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;
const MODULES = [{ module: 'bx_posts', tag: 'posts', title: 'Posts', kind: 'post', audiences: ['public', 'friends', 'private'] }] as Schema<'ModuleInfo'>[];

function post(over: Partial<Post> = {}): Post {
    return {
        id: '37',
        content_id: '7700',
        module: 'bx_posts',
        title: 'A slow walk with one lens',
        summary: 'Why I left the zoom at home for a month.',
        body_html: null,
        author: mila,
        anonymous: false,
        context_id: null,
        audience: 'public',
        state: 'published',
        moderation: 'approved',
        category: { id: '3', slug: '3', name: 'Art' },
        cover: null,
        media: [],
        links: [],
        poll: null,
        reading_minutes: 2,
        comments_enabled: true,
        featured: false,
        stats: { comments: 2, reactions: 1, views: 40 },
        revision: 1,
        url: 'https://community.example/view-post/a-slow-walk',
        viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: false, can_delete: false },
        published_at: '2026-11-05T10:00:00Z',
        publish_at: null,
        created_at: '2026-11-05T10:00:00Z',
        updated_at: '2026-11-05T10:00:00Z',
        ...over,
    };
}

type Call = { method: string; path: string; query: string; body: string; key?: string | null };

type Answer = { status: number; body?: unknown } | 'lost' | null;

function site(answer: (c: Call) => Answer | Promise<Answer> = () => null) {
    const calls: Call[] = [];
    const api: UnaApi = createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            const c = { method: request.method, path: url.pathname.replace(/^\/api\/v2/, '') || '/', query: url.search, body: request.method === 'GET' ? '' : await request.text(), key: request.headers.get('Idempotency-Key') };
            calls.push(c);
            const a = c.path === '/' ? { status: 200, body: { modules: MODULES } } : c.path === '/me/groups' || c.path === '/me/spaces' ? { status: 200, body: [] } : await answer(c);
            if (a === 'lost') throw new TypeError('Load failed');
            if (!a) return new Promise<Response>(() => {});
            return a.body === undefined ? new Response(null, { status: a.status }) : new Response(JSON.stringify(a.body), { status: a.status, headers: { 'Content-Type': 'application/json' } });
        },
    });
    return { api, calls };
}

function renderWith(node: ReactNode, api: UnaApi, route: Route = { list: { section: 'posts' }, detail: null }, seed?: (client: QueryClient) => void) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    seed?.(client);
    const ctx: AppContextValue = { api, siteUrl: 'https://community.example', me, signOut: () => {}, signingOut: false, messageTo: () => {} };
    const history = new RouteHistory(route);
    render(
        <QueryClientProvider client={client}>
            <AppContext.Provider value={ctx}>
                <AnnounceContext.Provider value={() => {}}>
                    <RouterProvider history={history}>
                        {node}
                        <MenuHost />
                    </RouterProvider>
                </AnnounceContext.Provider>
            </AppContext.Provider>
        </QueryClientProvider>,
    );
    return { client, history };
}

/** The post the route shows, as the detail pane keys it: another post is another pane. */
function Shown() {
    const d = useRoute().detail;
    return d?.kind === 'article' ? <PostPane key={d.id} id={d.id} /> : null;
}

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    setSiteModules(null);
});

describe('what a post is to the app', () => {
    it('is a post beside a list and in a window of its own, with a Posts section and Posts tabs', () => {
        const route: Route = { list: { section: 'posts', feed: 'mine' }, detail: { kind: 'article', id: '37' } };
        expect(routeToPath(route)).toBe('/posts/article/37?feed=mine');
        expect(parseRoute('/posts/article/37?feed=mine')).toEqual(route);
        expect(parseRoute('/spaces/article/37?space=725&tab=articles')).toEqual({ list: { section: 'spaces', group: '725', groupTab: 'articles' }, detail: { kind: 'article', id: '37' } });
        expect(parseRoute('/profile/article/37?id=8&tab=articles')).toEqual({ list: { section: 'profile', profile: '8', profileTab: 'articles' }, detail: { kind: 'article', id: '37' } });
        expect(parseRoute('/posts/new-article/725')).toEqual({ list: { section: 'posts' }, detail: { kind: 'new-article', contextId: '725' } });
        expect(parseRoute('/posts/article/x')).toBeNull();
        expect(opensInWindow({ kind: 'article', id: '37' })).toBe(true);
        expect(opensInWindow({ kind: 'new-article' })).toBe(false);
        const tabs = contextTabs({ content_visible: true, content_kinds: ['posts', 'polls'] }, 'group');
        expect(tabs).toEqual(['posts', 'articles', 'polls', 'members', 'about']);
        // the feed is Feed where the Posts module's posts are Posts
        expect([tabLabel('posts', tabs), tabLabel('articles', tabs), tabLabel('posts', ['posts', 'members'])]).toEqual(['Feed', 'Posts', 'Posts']);
    });

    it('opens a feed item of a post as the post, anything else as its thread', () => {
        const item = { kind: 'post', module: 'bx_posts', entry_id: '37' };
        expect(activityDetail({ id: '7700', object: item })).toEqual({ kind: 'article', id: '37' });
        expect(activityDetail({ id: '7700', object: { ...item, entry_id: undefined } })).toEqual({ kind: 'post', id: '7700' });
        expect(activityDetail({ id: '7701', object: { kind: 'feed_post', module: 'bx_timeline' } })).toEqual({ kind: 'post', id: '7701' });
        expect(activityDetail({ id: '7702', object: { kind: 'video', module: 'bx_videos', entry_id: '5' } })).toEqual({ kind: 'post', id: '7702' });
    });

    it('says how long a post reads, what state one’s own is in, and all a row shows', () => {
        expect(readingText(0)).toBe('1 min read');
        expect(stateText(post())).toBeNull();
        expect(stateText(post({ state: 'scheduled', publish_at: null }))).toBe('Scheduled');
        expect(stateText(post({ state: 'scheduled', publish_at: '2030-01-02T10:00:00Z' }))).toMatch(/^Scheduled for /);
        expect(stateText(post({ moderation: 'pending' }))).toBe('Waiting for approval');
        const when = ago('2026-11-05T10:00:00Z');
        expect(postRowText(post())).toBe(`, by Mila Novak, ${when}, 2 min read, 2 comments`);
        expect(postRowText(post({ author: null, anonymous: true, state: 'hidden', stats: { comments: 0, reactions: 0, views: 0 } }))).toBe(`, anonymous, ${when}, Hidden, 2 min read`);
    });

    it('keeps New post back until it has a title of 3 to 160 and text, and says why', () => {
        expect(newPostBlocker({ title: 'A title', text: 'Text', coverBlocker: null })).toBeNull();
        expect(newPostBlocker({ title: ' ', text: 'Text', coverBlocker: null })?.text).toBe('Give it a title.');
        expect(newPostBlocker({ title: 'ab', text: 'Text', coverBlocker: null })?.field).toBe('title');
        expect(newPostBlocker({ title: 'é'.repeat(161), text: 'Text', coverBlocker: null })?.field).toBe('title');
        expect(newPostBlocker({ title: 'A title', text: ' \n', coverBlocker: null })).toEqual({ field: 'text', text: 'Write the post.' });
        expect(newPostBlocker({ title: 'A title', text: 'Text', coverBlocker: 'Wait until the uploads are done' })).toEqual({ field: 'cover', text: 'Wait until the uploads are done.' });
        // characters, not UTF-16 units: 160 emoji are a title
        expect(newPostBlocker({ title: '📷'.repeat(160), text: 'Text', coverBlocker: null })).toBeNull();
        expect(newPostBlocker({ title: 'A title', summary: 'é'.repeat(5001), text: 'Text', coverBlocker: null })?.field).toBe('summary');
        // the text as it is sent: each line a paragraph, & < > escaped
        expect(newPostBlocker({ title: 'A title', text: '<'.repeat(25000), coverBlocker: null })?.field).toBe('text');
        expect(newPostBlocker({ title: 'A title', text: 'a'.repeat(99000), coverBlocker: null })).toBeNull();
        expect(newPostBlocker({ title: 'A title', text: 'Text', coverBlocker: null, categoryMissing: true })).toEqual({ field: 'category', text: 'Choose a category.' });
    });

    it('puts a 422 of the site at the field it names', () => {
        const problem = (field: string) => ({ type: 'urn:una:problem:validation', title: 'Invalid', status: 422, code: 'validation', errors: [{ field, code: 'rejected', message: 'The site refused it' }] });
        expect(newPostFieldError(problem('body_html'))).toEqual({ field: 'text', text: 'The site refused it.' });
        expect(newPostFieldError(problem('category_id'))?.field).toBe('category');
        expect(newPostFieldError(problem('cover_media_id'))?.field).toBe('cover');
        expect(newPostFieldError(problem('(body)'))).toBeNull();
        expect(newPostFieldError(new Error('x'))).toBeNull();
    });
});

describe('the Posts section and tabs', () => {
    it('lists the newest posts, one’s own under Mine, and opens one beside the list', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site((c) => (c.path === '/posts' || c.path === '/me/posts' ? { status: 200, body: { items: [post({ cover: null }), post({ id: '38', title: 'Golden hour, every day for a week', summary: '', author: lily, stats: { comments: 0, reactions: 0, views: 3 } })], next_cursor: null } } : null));
        const { history } = renderWith(<Posts />, api);
        const list = await screen.findByRole('list', { name: 'Posts, newest first' });
        expect(calls.find((c) => c.path === '/posts')?.query).toContain('sort=recent');
        const row = within(list).getByRole('button', { name: `A slow walk with one lens, by Mila Novak, ${ago('2026-11-05T10:00:00Z')}, 2 min read, 2 comments` });
        // what it is about, as its description
        expect(row.getAttribute('aria-describedby')).toBeTruthy();
        expect(document.getElementById(row.getAttribute('aria-describedby') ?? '')?.textContent).toBe('Why I left the zoom at home for a month.');
        // badges after the name, in the row
        expect(row.closest('li')?.textContent).toContain('Photographer');
        fireEvent.click(row);
        expect(routeToPath(history.current)).toBe('/posts/article/37');

        fireEvent.click(screen.getByRole('tab', { name: 'Mine' }));
        await screen.findByRole('list', { name: 'Your posts, newest first' });
        expect(calls.some((c) => c.path === '/me/posts')).toBe(true);
        expect(screen.getByRole('button', { name: 'New post' })).toBeTruthy();
    });

    it('lists a context’s posts with New post for who may post there, and a profile’s without', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site((c) => (c.path === '/posts' ? { status: 200, body: { items: [post({ context_id: '725', audience: 'context' })], next_cursor: null } } : null));
        const first = renderWith(<PostsOfTab of={{ context: '725' }} name="Makers Guild" canAdd />, api, { list: { section: 'spaces', group: '725', groupTab: 'articles' }, detail: null });
        await screen.findByRole('list', { name: 'Posts in Makers Guild, newest first' });
        expect(calls.find((c) => c.path === '/posts')?.query).toContain('context=725');
        fireEvent.click(screen.getByRole('button', { name: 'New post' }));
        expect(first.history.current.detail).toEqual({ kind: 'new-article', contextId: '725' });
        cleanup();

        renderWith(<PostsOfTab of={{ author: '8' }} name="Mila Novak" />, api, { list: { section: 'profile', profile: '8', profileTab: 'articles' }, detail: null });
        await screen.findByRole('list', { name: 'Posts by Mila Novak, newest first' });
        expect(screen.queryByRole('button', { name: 'New post' })).toBeNull();
    });
});

describe('a post beside the list', () => {
    it('shows its cover, title as the hero, who wrote it, its whole text and the comments of its Item, and deletes it for who may', async () => {
        setSiteModules(MODULES);
        const full = post({
            body_html: '<p>A 35mm lens makes you walk.</p><p>After a week the photos changed.</p>',
            cover: { id: '81604378630', kind: 'image', mime: 'image/jpeg', size: 0, state: 'ready', original_name: '', url: 'https://community.example/c/large.jpg', download_url: 'https://community.example/c/large.jpg', variants: { large: { url: 'https://community.example/c/large.jpg', width: 1200, height: 800 } }, width: 1600, height: 1000, duration_ms: null },
            viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: true, can_delete: true },
        });
        const { api, calls } = site((c) => {
            if (c.path === '/posts/37' && c.method === 'GET') return { status: 200, body: full };
            if (c.path === '/posts/37' && c.method === 'DELETE') return { status: 204 };
            return null;
        });
        renderWith(<PostPane id="37" />, api, { list: { section: 'posts' }, detail: { kind: 'article', id: '37' } });
        expect(await screen.findByText('After a week the photos changed.')).toBeTruthy();
        const hero = document.querySelector('.article-heading');
        expect([hero?.textContent, hero?.getAttribute('aria-hidden')]).toEqual(['A slow walk with one lens', 'true']);
        expect(screen.getAllByRole('heading', { name: 'A slow walk with one lens' })).toHaveLength(1);
        expect((document.querySelector('.article-cover') as HTMLImageElement | null)?.getAttribute('alt')).toBe('');
        expect(screen.getByText('2 min read')).toBeTruthy();
        // the comments are its Item's, read as a feed post's thread
        await waitFor(() => expect(calls.some((c) => c.path === '/activities/7700')).toBe(true));
    });

    it('links only to http and https pages, which open in the browser', async () => {
        const link = (id: string, url: string) => ({ id, url, host: 'example.com', state: 'ready' as const, title: `Link ${id}`, description: '', site_name: 'example.com', image: null });
        const { api } = site((c) => (c.path === '/posts/37' ? { status: 200, body: post({ body_html: '<p>Text.</p>', links: [link('1', 'javascript:alert(1)'), link('2', 'https://example.com/a'), link('3', 'file:///etc/passwd')] }) } : null));
        renderWith(<PostPane id="37" />, api, { list: { section: 'posts' }, detail: { kind: 'article', id: '37' } });
        const links = await screen.findByRole('list', { name: 'Links' });
        expect(within(links).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['https://example.com/a']);
        expect(within(links).getByRole('link', { name: 'Link 2 (opens in your browser)' })).toBeTruthy();
    });

    it('says a post one may not see is not shown, and a gone one is gone', async () => {
        const { api } = site((c) => (c.path === '/posts/37' ? { status: 404, body: { type: 'about:blank', title: 'Not Found', status: 404, detail: 'The post was not found' } } : null));
        renderWith(<PostPane id="37" />, api, { list: { section: 'posts' }, detail: { kind: 'article', id: '37' } });
        expect(await screen.findByText('This post is gone')).toBeTruthy();
    });
});

describe('a feed card of a post', () => {
    it('opens the post’s own view, not the thread', async () => {
        const { api } = site();
        const activity: Schema<'Activity'> = {
            id: '7700',
            verb: 'posted',
            actor: mila,
            owner_id: '8',
            object: {
                id: '7700',
                kind: 'post',
                module: 'bx_posts',
                entry_id: '37',
                author: mila,
                anonymous: false,
                audience: 'public',
                context_id: null,
                card: { title: 'A slow walk with one lens', text: 'A 35mm lens makes you walk.', body_html: null, url: 'https://community.example/view-post/a-slow-walk' },
                media: [],
                links: [],
                stats: { comments: 2, reactions: 1, reposts: 0, views: 40 },
                published_at: '2026-11-05T10:00:00Z',
                viewer: { reaction: null, favorited: false, can_react: false, can_comment: true, can_edit: false, can_delete: false },
                version: 'v1',
            },
            pinned: false,
            sticky: false,
            promoted: false,
            viewer: { reposted: false, can_repost: false },
            created_at: '2026-11-05T10:00:00Z',
            version: 'v1',
        };
        const { history } = renderWith(<ActivityCard activity={activity} />, api, { list: { section: 'home' }, detail: null });
        fireEvent.click(screen.getByRole('button', { name: '2 comments, open the post' }));
        expect(history.current.detail).toEqual({ kind: 'article', id: '37' });
        expect(document.querySelector('article')?.getAttribute('data-article-id')).toBe('37');
    });
});

describe('New post', () => {
    it('puts a pasted picture in the text through POST /uploads/inline', async () => {
        setSiteModules(MODULES);
        const src = 'https://community.example/image_transcoder.php?o=sys_images_editor&h=7&s=abc';
        const { api, calls } = site((c) => {
            if (c.path === '/uploads/inline' && c.method === 'POST') return { status: 201, body: { url: src, width: 640, height: 480, mime_type: 'image/png' } };
            if (c.path === '/posts' && c.method === 'POST') return { status: 201, body: post({ id: '61', title: 'With a map' }) };
            return null;
        });
        renderWith(<NewPost />, api, { list: { section: 'posts' }, detail: { kind: 'new-article' } });
        const text = screen.getByRole('textbox', { name: 'Text' });
        setRichText(text, 'See the map');
        const png = new File([new Uint8Array([137, 80, 78, 71])], 'map.png', { type: 'image/png' });
        fireEvent.paste(text, { clipboardData: { files: [png], getData: () => '' } });
        await waitFor(() => expect(calls.some((c) => c.path === '/uploads/inline')).toBe(true));
        // the file alone: the inline path takes no purpose
        expect(calls.find((c) => c.path === '/uploads/inline')?.body).not.toContain('name="purpose"');
        fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), { target: { value: 'With a map' } });
        await waitFor(() => expect(text.querySelector('img')).toBeTruthy());
        fireEvent.click(screen.getByRole('button', { name: 'Post' }));
        await waitFor(() => expect(calls.some((c) => c.path === '/posts' && c.method === 'POST')).toBe(true));
        const body = JSON.parse(calls.find((c) => c.path === '/posts' && c.method === 'POST')?.body ?? '{}') as { body_html: string };
        expect(body.body_html).toContain('<img src="https://community.example/image_transcoder.php?o=sys_images_editor&amp;h=7&amp;s=abc" width="640" height="480">');
    });

    it('writes a post through POST /posts, with the same key again after an answer that never came, and opens it', async () => {
        setSiteModules(MODULES);
        let posts = 0;
        const { api, calls } = site((c) => {
            if (c.path === '/posts' && c.method === 'POST') {
                posts++;
                return posts === 1 ? 'lost' : { status: 201, body: post({ id: '60', title: 'Notes from the meetup', body_html: '<p>First.</p><p>Second.</p>' }) };
            }
            return null;
        });
        const { history } = renderWith(<NewPost />, api, { list: { section: 'posts' }, detail: { kind: 'new-article' } });
        const send = screen.getByRole('button', { name: 'Post' });
        fireEvent.click(send);
        expect((await screen.findByRole('alert')).textContent).toBe('Give it a title.');
        expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Title' }));
        fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), { target: { value: '  Notes from the meetup ' } });
        fireEvent.change(screen.getByRole('textbox', { name: 'Summary' }), { target: { value: 'The short version.' } });
        setRichText(screen.getByRole('textbox', { name: 'Text' }), 'First.\nSecond.');
        await waitFor(() => expect((screen.getByRole('combobox', { name: 'Who can see it' }) as HTMLSelectElement).value).toBe('public'));
        fireEvent.click(send);
        await waitFor(() => expect(calls.filter((c) => c.method === 'POST' && c.path === '/posts')).toHaveLength(1));
        expect((await screen.findByRole('alert')).textContent).toBe('The post was not sent: Load failed');
        fireEvent.click(send);
        await waitFor(() => expect(history.current.detail).toEqual({ kind: 'article', id: '60' }));
        const [first, retry] = calls.filter((c) => c.method === 'POST' && c.path === '/posts');
        expect(JSON.parse(first?.body ?? '{}')).toEqual({ title: 'Notes from the meetup', body_html: '<p>First.</p><p>Second.</p>', summary: 'The short version.', audience: 'public' });
        expect(first?.key).toBeTruthy();
        expect(retry?.key).toBe(first?.key);
    });

    it('asks for one of the site’s categories, and shows the site’s refusal at its field', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site((c) => {
            if (c.path === '/posts/categories') return { status: 200, body: [{ id: '1', slug: '1', name: 'Animals & Pets' }, { id: '2', slug: '2', name: 'Architecture' }] };
            if (c.path === '/posts' && c.method === 'POST') return { status: 422, body: { type: 'urn:una:problem:validation', title: 'Invalid', status: 422, code: 'validation', errors: [{ field: 'body_html', code: 'required', message: 'A post needs text' }] } };
            return null;
        });
        renderWith(<NewPost />, api, { list: { section: 'posts' }, detail: { kind: 'new-article' } });
        const select = (await screen.findByRole('combobox', { name: 'Category' })) as HTMLSelectElement;
        expect(select.value).toBe('');
        fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), { target: { value: 'Notes from the meetup' } });
        setRichText(screen.getByRole('textbox', { name: 'Text' }), 'First.');
        fireEvent.click(screen.getByRole('button', { name: 'Post' }));
        expect((await screen.findByRole('alert')).textContent).toBe('Choose a category.');
        expect(document.activeElement).toBe(select);
        expect(calls.some((c) => c.method === 'POST')).toBe(false);
        fireEvent.change(select, { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'Post' }));
        await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/posts')).toBe(true));
        expect(JSON.parse(calls.find((c) => c.method === 'POST')?.body ?? '{}').category_id).toBe('2');
        expect((await screen.findByRole('alert')).textContent).toBe('A post needs text.');
        expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Text' }));
    });
});

describe('Editing a post', () => {
    const mine = (over: Partial<Post> = {}) => post({ body_html: '<p>A 35mm lens makes you walk.</p>', viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: true, can_delete: true }, ...over });
    const route: Route = { list: { section: 'posts' }, detail: { kind: 'article', id: '37' } };
    const CATEGORIES = [{ id: '3', slug: '3', name: 'Art' }, { id: '5', slug: '5', name: 'Travel' }];
    const openForm = async () => {
        fireEvent.click(await screen.findByRole('button', { name: 'More for the post' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Edit Post' }));
        return (await screen.findByRole('textbox', { name: 'Title' })) as HTMLInputElement;
    };

    it('sends only what changed, and never the audience of a post in a context', () => {
        const initial = postValue(mine());
        expect(initial).toEqual({ title: 'A slow walk with one lens', summary: 'Why I left the zoom at home for a month.', html: '<p>A 35mm lens makes you walk.</p>', category: '3', audience: 'public' });
        const all = { text: true, summary: true, audience: true };
        expect(postChanges(initial, initial, all)).toEqual({});
        expect(postChanges(initial, { ...initial, title: ' One lens ', audience: 'friends' }, all)).toEqual({ title: 'One lens', audience: 'friends' });
        const changed = { ...initial, summary: '', html: '<p>New.</p>', category: '5', audience: 'friends' as const };
        expect(postChanges(initial, changed, { ...all, audience: false })).toEqual({ summary: '', body_html: '<p>New.</p>', category_id: '5' });
        // a text or a summary the form does not offer is never sent, whatever the form holds
        expect(postChanges(initial, changed, { text: false, summary: false, audience: false })).toEqual({ category_id: '5' });
    });

    it('edits only a text the editor keeps whole', () => {
        expect(isEditableText('<p>One <strong>bold</strong> <a href="https://example.com">link</a>.</p><h2>Part</h2><ul><li>a</li></ul><p style="text-align: center">mid</p>')).toBe(true);
        expect(isEditableText('<h1>Big heading</h1><p>End.</p>')).toBe(false);
        expect(isEditableText('<p>Clip</p><iframe src="https://video.example/1"></iframe>')).toBe(false);
        expect(isEditableText('<table><tr><td>cell</td></tr></table>')).toBe(false);
        expect(isEditableText('<p><span style="color: rgb(230, 0, 0);">Red text</span></p>')).toBe(false);
        // such a text is the form's as the site has it, not as the editor would rewrite it
        const html = '<h1>Big heading</h1><p>End.</p>';
        expect(postValue(mine({ body_html: html })).html).toBe(html);
    });

    it('takes a summary that is the start of the text as none, and leaves one the API cut alone', () => {
        expect(postSummary({ summary: 'Why I left the zoom at home.', body_html: '<p>A 35mm lens makes you walk.</p>' })).toEqual({ editable: true, text: 'Why I left the zoom at home.' });
        // no summary of its own: the API answers with the start of the text
        expect(postSummary({ summary: 'First line.\nSecond & last.', body_html: '<p>First line.</p><p>Second &amp; last.</p>' })).toEqual({ editable: true, text: '' });
        const long = 'word '.repeat(100).trim();
        const cut = `${long.slice(0, 299).trimEnd()}…`;
        expect(postSummary({ summary: cut, body_html: `<p>${long}</p>` })).toEqual({ editable: true, text: '' });
        // an abstract longer than the API shows: its start is not the summary
        expect(postSummary({ summary: cut, body_html: '<p>Another text.</p>' })).toEqual({ editable: false, text: cut });
    });

    it('takes any summary that may be the API’s cut as one, whatever its length', () => {
        // BxDolApiV2Map::text: the first 299 characters, white space trimmed from their end, and "…"
        const served = (whole: string) => ([...whole.trim()].length > 300 ? `${[...whole.trim()].slice(0, 299).join('').trimEnd()}…` : whole.trim());
        // blank lines where the API cuts: what comes back is far shorter than 300 characters
        const whole = `The short start.${'\n'.repeat(290)}And the ending that must not be lost.`;
        const cut = served(whole);
        expect(cut).toBe('The short start.…');
        expect(mayBeCutSummary(cut)).toBe(true);
        expect(postSummary({ summary: cut, body_html: '<p>Another text.</p>' })).toEqual({ editable: false, text: cut });
        // one written whole that ends the same way reads the same, so it is left alone too
        expect(postSummary({ summary: 'To be continued…', body_html: '<p>Another text.</p>' })).toEqual({ editable: false, text: 'To be continued…' });
        // known whole: no "…" at its end, a space before it (the API trims there), longer than the API serves, or nothing else
        for (const summary of ['Why I left the zoom at home.', 'To be continued …', 'An aside…\n…', `${'é'.repeat(300)}…`, '…']) {
            expect(mayBeCutSummary(summary), summary).toBe(false);
            expect(postSummary({ summary, body_html: '<p>Another text.</p>' }), summary).toEqual({ editable: true, text: summary });
        }
        // 300 characters with the "…" is the longest the API cuts to
        expect(mayBeCutSummary(`${'é'.repeat(299)}…`)).toBe(true);
    });

    it('checks only the fields that are sent, and takes a picture as a text', () => {
        expect(postChangesBlocker({ category_id: '5' }, '')).toBeNull();
        expect(postChangesBlocker({ title: 'Hi' }, 'Text')?.field).toBe('title');
        expect(postChangesBlocker({ summary: 'é'.repeat(5001) }, 'Text')?.field).toBe('summary');
        expect(postChangesBlocker({ body_html: '<p></p>' }, '')).toEqual({ field: 'text', text: 'Write the post.' });
        expect(postChangesBlocker({ body_html: '<p><img src="https://community.example/s/1.jpg"></p>' }, '')).toBeNull();
        expect(newPostBlocker({ title: 'A title', text: '', html: '<p><img src="https://community.example/s/1.jpg"></p>', coverBlocker: null })).toBeNull();
    });

    it('is offered only to who may edit', async () => {
        const { api } = site((c) => (c.path === '/posts/37' ? { status: 200, body: mine({ viewer: { reaction: null, favorited: false, can_react: true, can_comment: true, can_edit: false, can_delete: true } }) } : null));
        renderWith(<PostPane id="37" />, api, route);
        await screen.findByText('A 35mm lens makes you walk.');
        fireEvent.click(screen.getByRole('button', { name: 'More for the post' }));
        expect(screen.getByRole('menuitem', { name: 'Delete Post…' })).toBeTruthy();
        expect(screen.queryByRole('menuitem', { name: 'Edit Post' })).toBeNull();
    });

    it('is not offered on a list’s row or a copy kept from before, until the site has answered here', async () => {
        // the site never answers: what shows is what the app had
        const { api } = site(() => null);
        const row = mine({ body_html: null });
        renderWith(<PostPane id="37" />, api, route, (client) => client.setQueryData(postListKey({ feed: 'latest' }), { pages: [{ items: [row], next_cursor: null }], pageParams: [undefined] }));
        fireEvent.click(await screen.findByRole('button', { name: 'More for the post' }));
        expect(screen.getByRole('menuitem', { name: 'Delete Post…' })).toBeTruthy();
        expect(screen.queryByRole('menuitem', { name: 'Edit Post' })).toBeNull();
        cleanup();

        // a whole copy kept from before (the cache is persisted) may be older than the site's
        const kept = site(() => null);
        renderWith(<PostPane id="37" />, kept.api, route, (client) => client.setQueryData(postKey('37'), mine()));
        expect(await screen.findByText('A 35mm lens makes you walk.')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'More for the post' }));
        expect(screen.getByRole('menuitem', { name: 'Delete Post…' })).toBeTruthy();
        expect(screen.queryByRole('menuitem', { name: 'Edit Post' })).toBeNull();
    });

    it('shows a text written on the site with what the editor would lose, and never sends it', async () => {
        const html = '<h1>Big heading</h1><p>End.</p><iframe src="https://video.example/1"></iframe>';
        const { api, calls } = site((c) => {
            if (c.path === '/posts/37' && c.method === 'GET') return { status: 200, body: mine({ body_html: html }) };
            if (c.path === '/posts/37' && c.method === 'PATCH') return { status: 200, body: mine({ title: 'One lens', body_html: html }) };
            return null;
        });
        renderWith(<PostPane id="37" />, api, route);
        const title = await openForm();
        expect(screen.queryByRole('textbox', { name: 'Text' })).toBeNull();
        const shown = screen.getByRole('group', { name: 'Text' });
        expect(within(shown).getByText('Big heading')).toBeTruthy();
        expect(within(shown).getByText('This text has formatting that editing here would remove, so it is edited on the network’s site.')).toBeTruthy();
        fireEvent.change(title, { target: { value: 'One lens' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(await screen.findByText('Post saved')).toBeTruthy();
        expect(calls.filter((c) => c.method === 'PATCH').map((c) => JSON.parse(c.body))).toEqual([{ title: 'One lens' }]);
    });

    it('shows a summary the API cut without a field for it, and starts empty for one that is the start of the text', async () => {
        const long = 'word '.repeat(100).trim();
        const cut = `${long.slice(0, 299).trimEnd()}…`;
        const { api, calls } = site((c) => {
            if (c.path === '/posts/37' && c.method === 'GET') return { status: 200, body: mine({ summary: cut }) };
            if (c.path === '/posts/37' && c.method === 'PATCH') return { status: 200, body: mine({ title: 'One lens', summary: cut }) };
            return null;
        });
        renderWith(<PostPane id="37" />, api, route);
        const title = await openForm();
        expect(screen.queryByRole('textbox', { name: 'Summary' })).toBeNull();
        const shown = screen.getByRole('group', { name: 'Summary' });
        expect(within(shown).getByText(cut)).toBeTruthy();
        expect(within(shown).getByText('This summary ends with “…”, so the app may have only its start: it is edited on the network’s site.')).toBeTruthy();
        fireEvent.change(title, { target: { value: 'One lens' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(await screen.findByText('Post saved')).toBeTruthy();
        expect(calls.filter((c) => c.method === 'PATCH').map((c) => JSON.parse(c.body))).toEqual([{ title: 'One lens' }]);
        cleanup();

        const derived = site((c) => (c.path === '/posts/37' && c.method === 'GET' ? { status: 200, body: mine({ summary: 'A 35mm lens makes you walk.' }) } : null));
        renderWith(<PostPane id="37" />, derived.api, route);
        await openForm();
        expect((screen.getByRole('textbox', { name: 'Summary' }) as HTMLTextAreaElement).value).toBe('');
    });

    it('keeps a category the site no longer lists, and lets a post with a short title change its category', async () => {
        const { api, calls } = site((c) => {
            if (c.path === '/posts/categories') return { status: 200, body: CATEGORIES };
            if (c.path === '/posts/37' && c.method === 'GET') return { status: 200, body: mine({ title: 'Hi', category: { id: '9', slug: '9', name: 'Retired' } }) };
            if (c.path === '/posts/37' && c.method === 'PATCH') return { status: 200, body: mine({ title: 'Hi', category: CATEGORIES[1] ?? null }) };
            return null;
        });
        renderWith(<PostPane id="37" />, api, route);
        await openForm();
        const category = (await screen.findByRole('combobox', { name: 'Category' })) as HTMLSelectElement;
        await waitFor(() => expect(within(category).getAllByRole('option').map((o) => o.textContent)).toEqual(['Choose a category', 'Retired', 'Art', 'Travel']));
        expect(category.value).toBe('9');
        expect(category.required).toBe(false);
        fireEvent.change(category, { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(await screen.findByText('Post saved')).toBeTruthy();
        expect(calls.filter((c) => c.method === 'PATCH').map((c) => JSON.parse(c.body))).toEqual([{ category_id: '5' }]);
    });

    it('changes who sees it through the form, and leaves an audience the site does not offer alone', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site((c) => {
            if (c.path === '/posts/37' && c.method === 'GET') return { status: 200, body: mine() };
            if (c.path === '/posts/37' && c.method === 'PATCH') return { status: 200, body: mine({ audience: 'friends' }) };
            return null;
        });
        renderWith(<PostPane id="37" />, api, route);
        await openForm();
        const who = (await screen.findByRole('combobox', { name: 'Who can see it' })) as HTMLSelectElement;
        await waitFor(() => expect(who.value).toBe('public'));
        fireEvent.change(who, { target: { value: 'friends' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(await screen.findByText('Post saved')).toBeTruthy();
        expect(calls.filter((c) => c.method === 'PATCH').map((c) => JSON.parse(c.body))).toEqual([{ audience: 'friends' }]);
        cleanup();

        // 'members' is not one of the audiences the site offers for posts: the form has no field for it
        const other = site((c) => {
            if (c.path === '/posts/37' && c.method === 'GET') return { status: 200, body: mine({ audience: 'members' }) };
            if (c.path === '/posts/37' && c.method === 'PATCH') return { status: 200, body: mine({ title: 'One lens', audience: 'members' }) };
            return null;
        });
        renderWith(<PostPane id="37" />, other.api, route);
        const title = await openForm();
        await waitFor(() => expect(screen.queryByRole('combobox', { name: 'Who can see it' })).toBeNull());
        fireEvent.change(title, { target: { value: 'One lens' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(await screen.findByText('Post saved')).toBeTruthy();
        expect(other.calls.filter((c) => c.method === 'PATCH').map((c) => JSON.parse(c.body))).toEqual([{ title: 'One lens' }]);
    });

    it('saves the changed fields through PATCH /posts/{id}, then shows the post as saved in its view and the lists', async () => {
        setSiteModules(MODULES);
        const { api, calls } = site((c) => {
            if (c.path === '/posts/categories') return { status: 200, body: CATEGORIES };
            if (c.path === '/posts/37' && c.method === 'GET') return { status: 200, body: mine() };
            if (c.path === '/posts/37' && c.method === 'PATCH') {
                const body = JSON.parse(c.body) as Schema<'PostChanges'>;
                return { status: 200, body: mine({ title: body.title ?? '', body_html: body.body_html ?? '', category: CATEGORIES[1] ?? null }) };
            }
            return null;
        });
        const { client } = renderWith(<PostPane id="37" />, api, route);
        client.setQueryData(postListKey({ feed: 'latest' }), { pages: [{ items: [post()], next_cursor: null }], pageParams: [undefined] });
        const invalidate = vi.spyOn(client, 'invalidateQueries');
        const title = await openForm();
        expect(screen.getByRole('form', { name: 'Edit the post' })).toBeTruthy();
        expect(title.value).toBe('A slow walk with one lens');
        expect((screen.getByRole('textbox', { name: 'Summary' }) as HTMLTextAreaElement).value).toBe('Why I left the zoom at home for a month.');
        const category = (await screen.findByRole('combobox', { name: 'Category' })) as HTMLSelectElement;
        expect(category.value).toBe('3');
        await waitFor(() => expect((screen.getByRole('combobox', { name: 'Who can see it' }) as HTMLSelectElement).value).toBe('public'));
        // the cover changes on the site: the form has no field for it
        expect(screen.queryByRole('group', { name: 'Cover' })).toBeNull();

        fireEvent.change(title, { target: { value: 'One lens, one month' } });
        setRichText(screen.getByRole('textbox', { name: 'Text' }), 'It makes you walk.\nA lot.');
        fireEvent.change(category, { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(calls.some((c) => c.method === 'PATCH')).toBe(true));
        const patch = calls.find((c) => c.method === 'PATCH');
        expect(JSON.parse(patch?.body ?? '{}')).toEqual({ title: 'One lens, one month', body_html: '<p>It makes you walk.</p><p>A lot.</p>', category_id: '5' });
        expect(patch?.key).toBeTruthy();
        expect(await screen.findByText('Post saved')).toBeTruthy();
        expect(screen.queryByRole('form', { name: 'Edit the post' })).toBeNull();
        expect(screen.getByText('A lot.')).toBeTruthy();
        expect(client.getQueryData<Post>(postKey('37'))?.title).toBe('One lens, one month');
        // the list's row is the saved post, as lists have one: without its text
        const list = client.getQueryData<{ pages: { items: Post[] }[] }>(postListKey({ feed: 'latest' }));
        expect([list?.pages[0]?.items[0]?.title, list?.pages[0]?.items[0]?.body_html]).toEqual(['One lens, one month', null]);
        // the lists, the feeds and its feed item are read again
        expect(invalidate.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining([['posts', 'list'], ['feed'], ['activity', '7700']]));
        // focus is back where the form was opened from
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'More for the post' })));
    });

    it('says a 422 at its field, saves again with the same key after an answer that never came, and leaves who sees a post in a group alone', async () => {
        let patches = 0;
        const { api, calls } = site((c) => {
            if (c.path === '/posts/37' && c.method === 'GET') return { status: 200, body: mine({ context_id: '12', audience: 'context' }) };
            if (c.path === '/posts/37' && c.method === 'PATCH') {
                patches++;
                if (patches === 1) return { status: 422, body: { type: 'urn:una:problem:validation', title: 'Invalid', status: 422, code: 'validation', errors: [{ field: 'title', code: 'invalid', message: 'This title is taken' }] } };
                return patches === 2 ? 'lost' : { status: 200, body: mine({ title: 'Another title', context_id: '12', audience: 'context' }) };
            }
            return null;
        });
        renderWith(<PostPane id="37" />, api, route);
        const title = await openForm();
        expect(screen.queryByRole('combobox', { name: 'Who can see it' })).toBeNull();
        fireEvent.change(title, { target: { value: 'ab' } });
        const save = screen.getByRole('button', { name: 'Save' });
        fireEvent.click(save);
        expect((await screen.findByRole('alert')).textContent).toBe('A title has at least 3 characters.');
        expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
        fireEvent.change(title, { target: { value: 'A taken title' } });
        fireEvent.click(save);
        await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('This title is taken.'));
        expect(document.activeElement).toBe(title);
        expect(title.getAttribute('aria-invalid')).toBe('true');
        fireEvent.change(title, { target: { value: 'Another title' } });
        fireEvent.click(save);
        await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('It was not saved: Load failed'));
        fireEvent.click(save);
        expect(await screen.findByText('Post saved')).toBeTruthy();
        const sent = calls.filter((c) => c.method === 'PATCH');
        expect(sent.map((c) => JSON.parse(c.body))).toEqual([{ title: 'A taken title' }, { title: 'Another title' }, { title: 'Another title' }]);
        expect(sent[2]?.key).toBe(sent[1]?.key);
        expect(sent[1]?.key).not.toBe(sent[0]?.key);
    });

    it('takes no change while it is being saved, and takes them again with what was typed when it was not saved', async () => {
        setSiteModules(MODULES);
        let answer: (a: Answer) => void = () => {};
        let patches = 0;
        const { api, calls } = site((c) => {
            if (c.path === '/posts/categories') return { status: 200, body: CATEGORIES };
            if (c.path === '/posts/37' && c.method === 'GET') return { status: 200, body: mine() };
            if (c.path === '/posts/37' && c.method === 'PATCH') {
                patches++;
                return patches === 1 ? new Promise<Answer>((resolve) => (answer = resolve)) : { status: 200, body: mine({ title: 'One lens' }) };
            }
            return null;
        });
        renderWith(<PostPane id="37" />, api, route);
        const title = await openForm();
        const summary = screen.getByRole('textbox', { name: 'Summary' }) as HTMLTextAreaElement;
        const text = screen.getByRole('textbox', { name: 'Text' });
        const category = (await screen.findByRole('combobox', { name: 'Category' })) as HTMLSelectElement;
        const who = (await screen.findByRole('combobox', { name: 'Who can see it' })) as HTMLSelectElement;
        fireEvent.change(title, { target: { value: 'One lens' } });
        const save = screen.getByRole('button', { name: 'Save' });
        fireEvent.click(save);
        await waitFor(() => expect(save.getAttribute('aria-busy')).toBe('true'));
        // the site has not answered: nothing in the form takes a change
        expect(title.readOnly).toBe(true);
        expect(summary.readOnly).toBe(true);
        expect(text.getAttribute('aria-readonly')).toBe('true');
        // the lists take none either, and keep the keyboard: disabled would drop focus to the page
        for (const list of [category, who]) {
            expect(list.getAttribute('aria-disabled')).toBe('true');
            expect(list.disabled).toBe(false);
            expect(fireEvent.mouseDown(list)).toBe(false);
            expect(fireEvent.keyDown(list, { key: 'ArrowDown' })).toBe(false);
            expect(fireEvent.keyDown(list, { key: ' ' })).toBe(false);
            expect(fireEvent.keyDown(list, { key: 'Tab' })).toBe(true);
        }
        fireEvent.change(title, { target: { value: 'One lens, typed while it saved' } });
        fireEvent.change(summary, { target: { value: 'Typed while it saved' } });
        fireEvent.change(category, { target: { value: '5' } });
        fireEvent.change(who, { target: { value: 'friends' } });
        expect(title.value).toBe('One lens');
        expect(summary.value).toBe('Why I left the zoom at home for a month.');
        expect(category.value).toBe('3');
        expect(who.value).toBe('public');
        // it was not saved: the form stays, with what was typed, and takes changes again
        answer('lost');
        await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('It was not saved: Load failed'));
        expect(title.value).toBe('One lens');
        expect(title.readOnly).toBe(false);
        expect(summary.readOnly).toBe(false);
        expect(text.getAttribute('aria-readonly')).toBeNull();
        expect(category.getAttribute('aria-disabled')).toBeNull();
        expect(who.getAttribute('aria-disabled')).toBeNull();
        expect(fireEvent.keyDown(category, { key: 'ArrowDown' })).toBe(true);
        fireEvent.click(save);
        expect(await screen.findByText('Post saved')).toBeTruthy();
        expect(calls.filter((c) => c.method === 'PATCH').map((c) => JSON.parse(c.body))).toEqual([{ title: 'One lens' }, { title: 'One lens' }]);
    });

    it('keeps the keyboard in a list the save started from, so the form still hears its keys after a save that failed', async () => {
        setSiteModules(MODULES);
        let answer: (a: Answer) => void = () => {};
        let patches = 0;
        const { api, calls } = site((c) => {
            if (c.path === '/posts/categories') return { status: 200, body: CATEGORIES };
            if (c.path === '/posts/37' && c.method === 'GET') return { status: 200, body: mine() };
            if (c.path === '/posts/37' && c.method === 'PATCH') {
                patches++;
                return patches === 1 ? new Promise<Answer>((resolve) => (answer = resolve)) : { status: 200, body: mine({ title: 'One lens' }) };
            }
            return null;
        });
        renderWith(<PostPane id="37" />, api, route);
        const title = await openForm();
        const category = (await screen.findByRole('combobox', { name: 'Category' })) as HTMLSelectElement;
        fireEvent.change(title, { target: { value: 'One lens' } });
        category.focus();
        fireEvent.keyDown(category, { key: 'Enter', metaKey: true, ctrlKey: true });
        const save = screen.getByRole('button', { name: 'Save' });
        await waitFor(() => expect(save.getAttribute('aria-busy')).toBe('true'));
        expect(document.activeElement).toBe(category);
        answer('lost');
        await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('It was not saved: Load failed'));
        // still in the list, so the form's own keys still reach it
        expect(document.activeElement).toBe(category);
        fireEvent.keyDown(document.activeElement!, { key: 'Enter', metaKey: true, ctrlKey: true });
        expect(await screen.findByText('Post saved')).toBeTruthy();
        expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(2);
    });

    it('holds a leave while it is being saved, without a question: it leaves once the post was saved and stays when it was not', async () => {
        let answer: (a: Answer) => void = () => {};
        const { api, calls } = site((c) => {
            if (/^\/posts\/\d+$/.test(c.path) && c.method === 'GET') return { status: 200, body: mine({ id: c.path.slice(7) }) };
            if (c.path === '/posts/37' && c.method === 'PATCH') return new Promise<Answer>((resolve) => (answer = resolve));
            return null;
        });
        const here = route;
        const other: Route = { list: { section: 'posts' }, detail: { kind: 'article', id: '38' } };
        const { history } = renderWith(<Shown />, api, here);
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
        const title = await openForm();
        fireEvent.change(title, { target: { value: 'One lens' } });
        const save = screen.getByRole('button', { name: 'Save' });
        fireEvent.click(save);
        await waitFor(() => expect(save.getAttribute('aria-busy')).toBe('true'));
        // the site has not answered: the leave waits, and nobody is told the post stays as it was
        act(() => history.push(other));
        await act(async () => {});
        expect(confirm).not.toHaveBeenCalled();
        expect(history.current).toEqual(here);
        expect(screen.getByRole('form', { name: 'Edit the post' })).toBeTruthy();
        // it was not saved: the leave is dropped, the form stays with why
        await act(async () => answer('lost'));
        await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('It was not saved: Load failed'));
        await act(async () => {});
        expect(confirm).not.toHaveBeenCalled();
        expect(history.current).toEqual(here);
        expect((screen.getByRole('textbox', { name: 'Title' }) as HTMLInputElement).value).toBe('One lens');
        // saved while a leave waited: the leave happens, still without a question
        fireEvent.click(save);
        await waitFor(() => expect(save.getAttribute('aria-busy')).toBe('true'));
        act(() => history.push(other));
        await act(async () => {});
        expect(history.current).toEqual(here);
        await act(async () => answer({ status: 200, body: mine({ title: 'One lens' }) }));
        await waitFor(() => expect(history.current).toEqual(other));
        expect(confirm).not.toHaveBeenCalled();
        expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(2);
    });

    it('asks before anything else takes a changed form away: the pane closing, another post, Back', async () => {
        const { api } = site((c) => (/^\/posts\/\d+$/.test(c.path) && c.method === 'GET' ? { status: 200, body: mine({ id: c.path.slice(7) }) } : null));
        const here: Route = { list: { section: 'posts' }, detail: { kind: 'article', id: '38' } };
        const other = route;
        const { history } = renderWith(<Shown />, api, { list: { section: 'posts' }, detail: null });
        act(() => history.push(other));
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        await openForm();
        // nothing changed: leaving asks nothing
        act(() => history.push(here));
        expect(confirm).not.toHaveBeenCalled();
        expect(history.current).toEqual(here);
        await waitFor(() => expect(screen.queryByRole('form', { name: 'Edit the post' })).toBeNull());
        const title = await openForm();
        fireEvent.change(title, { target: { value: 'Changed' } });
        // the pane's Close and Esc on the toolbar (closeDetail), another row (openDetail), Back, the sidebar
        const leaves = [() => history.push({ list: here.list, detail: null }), () => history.push(other), () => void history.back(), () => history.push({ list: { section: 'home' }, detail: null })];
        for (const [i, leave] of leaves.entries()) {
            act(leave);
            await waitFor(() => expect(confirm).toHaveBeenCalledTimes(i + 1));
            await act(async () => {});
            expect(history.current).toEqual(here);
            expect((screen.getByRole('textbox', { name: 'Title' }) as HTMLInputElement).value).toBe('Changed');
        }
        // another list beside the same post takes nothing away
        act(() => history.push({ list: { section: 'posts', feed: 'mine' }, detail: here.detail }));
        expect(confirm).toHaveBeenCalledTimes(leaves.length);
        expect((screen.getByRole('textbox', { name: 'Title' }) as HTMLInputElement).value).toBe('Changed');
        // a browser tab warns before it unloads while the changes are there
        const unload = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(unload);
        expect(unload.defaultPrevented).toBe(true);
        // agreed: the other post shows
        confirm.mockReturnValue(true);
        act(() => history.push(other));
        await waitFor(() => expect(history.current).toEqual(other));
        await waitFor(() => expect(screen.queryByRole('form', { name: 'Edit the post' })).toBeNull());
        const quiet = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(quiet);
        expect(quiet.defaultPrevented).toBe(false);
    });

    it('asks before Esc or Cancel throws changes away, and sends nothing when nothing changed', async () => {
        const { api, calls } = site((c) => (c.path === '/posts/37' && c.method === 'GET' ? { status: 200, body: mine() } : null));
        renderWith(<PostPane id="37" />, api, route);
        let title = await openForm();
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(screen.queryByRole('form', { name: 'Edit the post' })).toBeNull());
        expect(confirm).not.toHaveBeenCalled();
        title = await openForm();
        fireEvent.change(title, { target: { value: 'Changed' } });
        fireEvent.keyDown(title, { key: 'Escape' });
        await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
        expect(screen.getByRole('form', { name: 'Edit the post' })).toBeTruthy();
        confirm.mockReturnValue(true);
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        await waitFor(() => expect(screen.queryByRole('form', { name: 'Edit the post' })).toBeNull());
        expect(screen.getByText('A 35mm lens makes you walk.')).toBeTruthy();
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'More for the post' })));
        expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
    });
});
