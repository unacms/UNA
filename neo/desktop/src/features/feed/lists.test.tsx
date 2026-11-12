import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Schema } from 'una-api';

import { EmptyState } from '../../components/empty-state';
import { SKELETON_DELAY_MS, SkeletonRows } from '../../components/skeleton';
import { AppContext, type AppContextValue } from '../../lib/context';
import { forgetFailures } from '../../lib/media';
import { kindBadge } from '../notifications/kind-icon';
import { dayGroup, withDayHeadings } from '../notifications/days';
import { TODAY_CHECK_MS, useToday } from '../notifications/inbox';
import { inboxTime, previewOf } from '../../screens/messages';
import { keptMeasurements, remeasureRows } from './feed-list';
import { MediaGrid, photoAlt, pictureOf, shownMedia, videoOf } from './media';
import { type PostMenuFacts, postMenuEntries, postMenuItems } from './post-menu';
import { placePicker } from './reaction-picker';
import { reactionLabel } from './reaction-button';
import { newAuthorsOf } from './use-feed';

afterEach(() => {
    cleanup();
    forgetFailures();
    vi.useRealTimers();
});

describe('notification kind badges', () => {
    it('has one for every kind of the shared vocabulary', () => {
        const kinds: Record<string, [string, string]> = {
            'graph.followed': ['user-round-check', 'green'],
            'graph.friend_requested': ['user-plus', 'green'],
            'graph.befriended': ['user-plus', 'green'],
            'social.reacted': ['heart', 'heart'],
            'social.mentioned': ['at-sign', 'violet'],
            'social.comment': ['message-square', 'accent'],
            'social.reply': ['message-square', 'accent'],
            'discussions.reply': ['message-square', 'accent'],
            'groups.join_requested': ['users-round', 'amber'],
            'groups.approved': ['users-round', 'amber'],
            'groups.invited': ['users-round', 'amber'],
            'invites.joined': ['user-plus', 'green'],
            'timeline.reposted': ['repeat-2', 'accent'],
        };
        // the kind wins over its source: a follow is a follow whatever UNA called it
        for (const [kind, [icon, tone]] of Object.entries(kinds)) expect(kindBadge(kind, 'bx_polls.closed'), kind).toEqual({ icon, tone });
    });

    it('reads `source` for other and unknown kinds, covering every source on the local site', () => {
        const kinds: Record<string, [string, string]> = {
            'bx_groups.fan_added': ['users-round', 'amber'],
            'bx_groups.join_request': ['users-round', 'amber'],
            'bx_persons.added': ['bell', 'neutral'],
            'bx_posts.added': ['bell', 'neutral'],
            'bx_posts.commentPost': ['message-square', 'accent'],
            'bx_timeline_reactions.doVote': ['heart', 'heart'],
            'bx_timeline.commentPost': ['message-square', 'accent'],
            'bx_timeline.post_common': ['bell', 'neutral'],
            'bx_timeline.replyPost': ['message-square', 'accent'],
            'sys_profiles_friends.connection_added': ['user-plus', 'green'],
            'sys_profiles_subscriptions.connection_added': ['user-round-check', 'green'],
        };
        for (const [source, [icon, tone]] of Object.entries(kinds)) expect(kindBadge('other', source), source).toEqual({ icon, tone });
        expect(kindBadge('social.someday', 'bx_timeline.commentPost'), 'a kind this app does not know yet').toEqual({ icon: 'message-square', tone: 'accent' });
    });

    it('matches sources in the spec\'s order: a comment on a group is a comment, a mention and a repost have their own', () => {
        expect(kindBadge('other', 'bx_groups.commentPost').icon).toBe('message-square');
        expect(kindBadge('other', 'meta_mention.added')).toEqual({ icon: 'at-sign', tone: 'violet' });
        expect(kindBadge('other', 'bx_timeline.mention')).toEqual({ icon: 'at-sign', tone: 'violet' });
        expect(kindBadge('other', 'bx_timeline.repost')).toEqual({ icon: 'repeat-2', tone: 'accent' });
        expect(kindBadge('other', 'bx_convos.added')).toEqual({ icon: 'message-circle', tone: 'accent' });
        expect(kindBadge('other', 'nonsense')).toEqual({ icon: 'bell', tone: 'neutral' });
        expect(kindBadge('other')).toEqual({ icon: 'bell', tone: 'neutral' });
    });
});

const viewer = (over: Partial<Schema<'ItemViewer'>> = {}): Schema<'ItemViewer'> => ({ reaction: null, favorited: false, can_react: false, can_comment: false, can_edit: false, can_delete: false, ...over });

function facts(over: Partial<PostMenuFacts> & { viewer?: Partial<Schema<'ItemViewer'>>; url?: string | null; kind?: 'feed_post' | 'content' } = {}): PostMenuFacts {
    return {
        item: { kind: over.kind ?? 'feed_post', anonymous: false, viewer: viewer(over.viewer), card: { text: '', url: over.url ?? null } },
        author: over.author === undefined ? { id: '8', kind: 'person' } : over.author,
        mine: over.mine ?? false,
        detail: over.detail ?? false,
        canOpenWindow: over.canOpenWindow ?? false,
    };
}

describe('the post menu', () => {
    it('has every item, in groups, when everything is allowed', () => {
        const all = postMenuItems(facts({ viewer: { can_comment: true, can_react: true, can_edit: true, can_delete: true }, url: 'https://s/p/1', canOpenWindow: true }));
        expect(all).toEqual(['open', 'comment', 'react', 'separator', 'message', 'author', 'separator', 'copy-link', 'open-in-window', 'separator', 'edit', 'delete']);
    });

    it('drops an item when its permission is missing, and the separators beside nothing', () => {
        expect(postMenuItems(facts())).toEqual(['open', 'separator', 'message', 'author']);
        expect(postMenuItems(facts({ viewer: { can_comment: true } }))).toContain('comment');
        expect(postMenuItems(facts({ viewer: { can_react: true } }))).toContain('react');
        // React presses the toggle, which waits for the site's kinds (none: no toggle)
        expect(postMenuItems({ ...facts({ viewer: { can_react: true } }), canReactHere: false })).not.toContain('react');
        expect(postMenuItems(facts({ viewer: { can_delete: true } })).slice(-2)).toEqual(['separator', 'delete']);
        // Edit: a feed post only (a moderator may edit others' posts: no "own post" rule)
        expect(postMenuItems(facts({ viewer: { can_edit: true } }))).toContain('edit');
        expect(postMenuItems(facts({ viewer: { can_edit: true }, kind: 'content' }))).not.toContain('edit');
        // Copy Link needs the item's page; nothing opens it on the site (the app shows the post)
        expect(postMenuItems(facts({ url: 'https://s/p/1' }))).toContain('copy-link');
        expect(postMenuItems(facts({ url: 'https://s/p/1' }))).not.toContain('open-on-site');
        expect(postMenuItems(facts())).not.toContain('copy-link');
        // Open in New Window: the main window only, and not for the post open in the detail pane
        expect(postMenuItems(facts({ canOpenWindow: true }))).toContain('open-in-window');
        expect(postMenuItems(facts({ canOpenWindow: true, detail: true }))).not.toContain('open-in-window');
        expect(postMenuItems(facts({ detail: true }))).not.toContain('open');
    });

    it('offers Message only for another person, and no author item for an anonymous post', () => {
        expect(postMenuItems(facts({ mine: true }))).not.toContain('message');
        expect(postMenuItems(facts({ author: { id: '9', kind: 'organization' } }))).not.toContain('message');
        const anonymous = postMenuItems(facts({ author: null }));
        expect(anonymous).not.toContain('message');
        expect(anonymous).not.toContain('author');
        expect(anonymous).toEqual(['open']);
    });

    it('names the items and runs each one', () => {
        const run = vi.fn();
        const entries = postMenuEntries(['open', 'react', 'separator', 'message', 'delete', 'open-in-window'], { authorName: 'Lily Carter', reacted: true, mac: true }, run);
        expect(entries.map((e) => (e === 'separator' ? '-' : e.text))).toEqual(['Open Post', 'Remove Reaction', '-', 'Message Lily Carter', 'Delete Post…', 'Open in New Window']);
        const window = entries[5];
        expect(window !== 'separator' && window?.accelerator).toBe('CmdOrCtrl+Enter');
        const del = entries[4];
        if (del !== 'separator') del?.run();
        expect(run).toHaveBeenCalledWith('delete');
    });
});

describe('notification day headings', () => {
    const at = (daysAgo: number) => new Date(new Date(2026, 10, 6, 12).getTime() - daysAgo * 86_400_000).toISOString();
    const now = new Date(2026, 10, 6, 12);
    const n = (id: string, daysAgo: number) => ({ id, created_at: at(daysAgo) }) as Schema<'Notification'>;

    it('groups by Today, Yesterday, This week and Earlier', () => {
        expect(dayGroup(at(0), now).label).toBe('Today');
        expect(dayGroup(at(1), now).label).toBe('Yesterday');
        expect(dayGroup(at(3), now).label).toBe('This week');
        expect(dayGroup(at(20), now).label).toBe('Earlier');
    });

    it('puts a heading before each group; notifications keep their own index', () => {
        const rows = withDayHeadings([n('5', 0), n('4', 0), n('3', 1), n('2', 3), n('1', 20)], now);
        expect(rows.map((r) => (r.kind === 'day' ? r.label : r.index))).toEqual(['Today', 0, 1, 'Yesterday', 2, 'This week', 3, 'Earlier', 4]);
        const yesterday = rows.find((r) => r.kind === 'notification' && r.index === 2);
        expect(yesterday?.kind === 'notification' && yesterday.day).toBe('Yesterday');
    });

    it('keys each heading uniquely when a group comes back (new events over a cached page)', () => {
        const rows = withDayHeadings([n('9', 0), n('3', 1), n('8', 0)], now);
        const days = rows.filter((r) => r.kind === 'day');
        expect(days.map((r) => r.label)).toEqual(['Today', 'Yesterday', 'Today']);
        expect(new Set(days.map((r) => r.id)).size).toBe(3);
    });

    it('moves the headings on at midnight', () => {
        vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
        vi.setSystemTime(new Date(2026, 10, 6, 23, 59, 30));
        const { result } = renderHook(() => useToday());
        const first = result.current;
        act(() => vi.advanceTimersByTime(TODAY_CHECK_MS));
        expect(new Date(result.current).getDate()).toBe(7);
        expect(dayGroup(new Date(first).toISOString(), new Date(result.current)).label).toBe('Yesterday');
        // within the same day nothing changes (no re-render of the list)
        const second = result.current;
        act(() => vi.advanceTimersByTime(TODAY_CHECK_MS));
        expect(result.current).toBe(second);
    });
});

const site: AppContextValue = { api: {} as AppContextValue['api'], siteUrl: 'https://community.example', me: { profiles: [] } as unknown as Schema<'Me'>, signOut: () => {}, signingOut: false, messageTo: () => {} };
const media = (over: Partial<Schema<'Media'>>): Schema<'Media'> => ({
    id: 'm',
    state: 'ready',
    mime: 'image/jpeg',
    size: 1,
    original_name: 'a.jpg',
    kind: 'image',
    url: 'https://cdn.example/a.jpg',
    download_url: 'https://cdn.example/a.jpg',
    variants: {},
    width: 400,
    height: 300,
    ...over,
});

describe('post media', () => {
    it('shows a video being converted as its box with a spinner, said once per post', () => {
        vi.useFakeTimers();
        const grid = (
            <AppContext.Provider value={site}>
                <MediaGrid media={[media({ id: 'v1', kind: 'video', state: 'processing', url: '' }), media({ id: 'v2', kind: 'video', state: 'processing', url: '' })]} />
            </AppContext.Provider>
        );
        const { unmount } = render(grid);
        const group = screen.getByRole('group', { name: '2 videos' });
        expect(group.querySelectorAll('[data-media-state="processing"]')).toHaveLength(2);
        expect(within(group).getAllByRole('status')).toHaveLength(1);
        // the region is there, empty, before its words: a live region is read when it changes
        expect(within(group).getByRole('status').textContent).toBe('');
        act(() => vi.runAllTimers());
        expect(within(group).getByRole('status').textContent).toBe('Processing video…');
        expect(group.querySelector('video, img')).toBeNull();
        // scrolled away and back (a virtualized row mounts again): not said a second time
        unmount();
        render(grid);
        act(() => vi.runAllTimers());
        expect(screen.getByRole('status').textContent).toBe('');
    });

    it('draws the copy of each size, falling back to the nearest and then the original', () => {
        const all = (url: string | null | undefined) => url ?? null;
        const copy = (url: string) => ({ url, width: 1, height: 1 });
        const photo = media({ url: 'https://x/o.jpg', variants: { thumb: copy('https://x/t.jpg'), medium: copy('https://x/m.jpg'), large: copy('https://x/l.jpg') } });
        expect(['thumb', 'medium', 'large'].map((size) => pictureOf(photo, size as 'thumb', all))).toEqual(['https://x/t.jpg', 'https://x/m.jpg', 'https://x/l.jpg']);
        // a message's photo has no medium copy: the original rather than the thumbnail
        expect(pictureOf(media({ url: 'https://x/o.jpg', variants: { thumb: copy('https://x/t.jpg') } }), 'medium', all)).toBe('https://x/o.jpg');
        // a copy the page may not load is passed over
        expect(pictureOf(photo, 'medium', (url) => (url === 'https://x/m.jpg' ? null : (url ?? null)))).toBe('https://x/l.jpg');
        expect(pictureOf(media({ url: '', variants: {} }), 'large', all)).toBeNull();
    });

    it('plays a video\'s MP4 copy with its poster, never the upload while it is converted', () => {
        const all = (url: string | null | undefined) => url || null;
        const copy = (url: string) => ({ url, width: 1, height: 1 });
        const ready = media({ kind: 'video', url: 'https://x/o.mov', variants: { mp4: copy('https://x/v.mp4'), poster: copy('https://x/p.jpg') } });
        expect(videoOf(ready, all)).toEqual({ src: 'https://x/v.mp4', poster: 'https://x/p.jpg' });
        expect(videoOf({ ...ready, state: 'processing', variants: {} }, all)).toBeNull();
        // another module's video: the site makes no copies of it
        expect(videoOf(media({ kind: 'video', url: 'https://x/o.mp4' }), all)).toEqual({ src: 'https://x/o.mp4', poster: undefined });
        // an MP4 copy the page may not load is not swapped for the original
        expect(videoOf(ready, (url) => (url === 'https://x/v.mp4' ? null : (url ?? null)))).toBeNull();
    });

    it('shows a failed video and a photo without a url as a note, never a broken image', () => {
        render(
            <AppContext.Provider value={site}>
                <MediaGrid media={[media({ id: 'v', kind: 'video', state: 'failed', url: '' }), media({ id: 'p', state: 'failed', url: '' })]} />
            </AppContext.Provider>,
        );
        expect(screen.getByText('This video could not be processed')).toBeTruthy();
        expect(screen.getByText('Photo unavailable')).toBeTruthy();
        expect(document.querySelector('img')).toBeNull();
        expect(shownMedia([media({ url: '' })], () => null)).toHaveLength(0);
    });

    it('shows the note for a photo that does not load, after its second try', () => {
        vi.useFakeTimers();
        render(
            <AppContext.Provider value={site}>
                <MediaGrid media={[media({ id: 'p' })]} by="Lily Carter" />
            </AppContext.Provider>,
        );
        const img = screen.getByRole('img', { name: 'Photo by Lily Carter' });
        fireEvent.error(img);
        act(() => void vi.advanceTimersByTime(1600));
        fireEvent.error(screen.getByRole('img', { name: 'Photo by Lily Carter' }));
        expect(screen.queryByRole('img')).toBeNull();
        expect(screen.getByText('Photo unavailable')).toBeTruthy();
    });

    it('says which photo of the post it is and whose', () => {
        expect(photoAlt(1, 3, 'Lily Carter')).toBe('Photo 2 of 3 by Lily Carter');
        expect(photoAlt(0, 1, null)).toBe('Photo');
    });
});

describe('feed row heights', () => {
    it('measures the posts in the DOM again, by their index, and nothing nested in them', () => {
        const list = document.createElement('div');
        const heights = [96, 212];
        heights.forEach((h, i) => {
            const row = document.createElement('article');
            row.dataset.index = String(i + 3);
            row.getBoundingClientRect = () => ({ height: h + 0.4 }) as DOMRect;
            // a nested element with data-index (a photo grid, say) is not a row
            const inner = document.createElement('div');
            inner.dataset.index = '0';
            row.append(inner);
            list.append(row);
        });
        document.body.append(list);
        const sizes: [number, number][] = [];
        remeasureRows(list, (index, size) => sizes.push([index, size]));
        expect(sizes).toEqual([
            [3, 96],
            [4, 212],
        ]);
        list.remove();
    });

    it('keeps no heights for a feed it never measured', () => {
        expect(keptMeasurements('never', 420)).toBeUndefined();
    });
});

describe('list helpers', () => {
    it('names the reaction toggle with the count, not the emoji', () => {
        expect(reactionLabel('Like', 0)).toBe('Like');
        expect(reactionLabel('Like', 1)).toBe('Like, 1 reaction');
        expect(reactionLabel('Like', 12)).toBe('Like, 12 reactions');
    });

    it('places the reaction picker above its toggle, below it near the top', () => {
        const rect = (top: number) => ({ top, bottom: top + 28, left: 100, right: 160, width: 60, height: 28, x: 100, y: top, toJSON: () => ({}) }) as DOMRect;
        expect(placePicker(rect(400), { width: 200, height: 44 }, { width: 800, height: 600 })).toEqual({ left: 100, top: 350 });
        expect(placePicker(rect(60), { width: 200, height: 44 }, { width: 800, height: 600 }, 52)).toEqual({ left: 100, top: 94 });
    });

    it('shows up to three new authors on the new posts pill, each once, nobody for an anonymous post', () => {
        const a = (id: string, author: string | null) =>
            ({ id, actor: null, object: { anonymous: author === null, author: author ? { id: author, display_name: author } : null } }) as unknown as Schema<'Activity'>;
        expect(newAuthorsOf([a('1', 'x'), a('2', 'x'), a('3', null), a('4', 'y'), a('5', 'z'), a('6', 'w')]).map((p) => p.id)).toEqual(['x', 'y', 'z']);
    });

    it('lists conversations with short times and the newest message as the preview', () => {
        const now = new Date(2026, 10, 6, 15);
        expect(inboxTime(new Date(2026, 10, 5, 9).toISOString(), now)).toBe('Yesterday');
        expect(inboxTime(new Date(2026, 9, 3).toISOString(), now)).toMatch(/3/);
        const last = (text: string, media_kind: 'photo' | 'file' | null = null): Pick<Schema<'Conversation'>, 'last_message'> => ({
            last_message: { text, has_media: media_kind !== null, media_kind, created_at: '2026-11-06T10:00:00Z', by: { id: '4' } as Schema<'Profile'> },
        });
        // one's own message too, without "You:"
        expect(previewOf(last('Hello\n  there'))).toEqual({ text: 'Hello there', media: false });
        // without text: what it carries, as a stand-in
        expect(previewOf(last('', 'photo'))).toEqual({ text: 'Photo', media: true });
        expect(previewOf(last(' ', 'file'))).toEqual({ text: 'Attachment', media: true });
        expect(previewOf(last('See this', 'photo'))).toEqual({ text: 'See this', media: false });
        expect(previewOf(last(''))).toEqual({ text: '', media: false });
    });
});

describe('loading and empty states', () => {
    it('shows skeleton rows only after 300ms of loading', () => {
        vi.useFakeTimers();
        const { rerender } = render(<SkeletonRows loading />);
        expect(document.querySelector('[data-skeleton]')).toBeNull();
        act(() => void vi.advanceTimersByTime(SKELETON_DELAY_MS));
        expect(document.querySelectorAll('.skeleton-row')).toHaveLength(3);
        rerender(<SkeletonRows loading={false} />);
        expect(document.querySelector('[data-skeleton]')).toBeNull();
    });

    it('keeps its live region while the list has items, so turning empty is announced', () => {
        const { rerender } = render(<EmptyState shown={false} icon="bell" title="You’re all caught up" />);
        const region = screen.getByRole('status');
        expect(region.textContent).toBe('');
        rerender(<EmptyState shown icon="bell" title="You’re all caught up" hint="Comments show up here." actions={<button type="button">Go</button>} />);
        expect(screen.getByRole('status')).toBe(region);
        expect(region.textContent).toBe('You’re all caught upComments show up here.');
        // the buttons are outside the region, so they are not read as part of it
        expect(within(region).queryByRole('button')).toBeNull();
    });
});
