/**
 * A page's complementary blocks (the site's Pages builder, GET /layout/resolve): cards with
 * their title, drawn by kind (people with Follow or Add friend where the block suggests them,
 * posts, groups, events), each item opening as it opens elsewhere in the app. A block reads its
 * own route (`endpoint`); one that is empty, fails or is still loading draws nothing, so a
 * column never shows a card without content.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useRef, useState } from 'react';

import type { Schema } from 'una-api';

import { ProfileBadges } from '../../components/profile-badges';
import { RichText } from '../../components/rich-text';
import { ago } from '../../lib/api';
import { useWindowAnnounce } from '../../lib/announce';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { locale, num, t, tn } from '../../lib/i18n';
import { rich } from '../../lib/i18n-rich';
import { useNavigation, useRoute } from '../../lib/navigation';
import { type CategorySection, categoryPage, contextDetailRoute, isCategorySection } from '../../lib/router';
import { discussionKey, lastActivity } from '../discussions/discussions';
import { eventContext, eventWhen } from '../events/events';
import { groupKey } from '../groups/groups';
import { postKey } from '../posts/posts';
import { announcement, type GraphAction } from '../profile/graph';
import { ProfileAvatar, ProfileName } from '../profile/profile-link';
import { useGraphAction } from '../profile/relation-buttons';
import { usePanesMode } from '../../shell/layout';
import { usePaneBody } from '../../shell/pane';
import { SideCard, SideDivider, StickySide, useSideColumn } from './side-columns';
import { complementary, pageBlockKey, readBlock, type ResolvedBlock, type Screen, screenOf, usePageLayout, useWidth } from './page-layout';

type Profile = Schema<'Profile'>;
type Post = Schema<'Post'>;
type Group = Schema<'Group'>;
type Event = Schema<'Event'>;
type Discussion = Schema<'Discussion'>;
type InfoField = Schema<'InfoField'>;

/** What a block's route answers: a page of items, or a plain list (GET /me/groups). */
type Answer<T> = { items: T[]; next_cursor?: string | null } | T[];

const itemsOf = <T,>(answer: Answer<T> | undefined): T[] => (Array.isArray(answer) ? answer : (answer?.items ?? []));

/** How many items of a plain list (no `limit`) a card shows. */
const CARD_MAX = 5;

/** What a block's route answers, once it has (null while loading, and when it failed). */
function useBlockAnswer<T>(block: ResolvedBlock): T | null {
    const { api } = useApp();
    const endpoint = block.endpoint ?? '';
    const query = useQuery({
        queryKey: pageBlockKey(endpoint),
        queryFn: () => readBlock<T>(api, endpoint),
        enabled: endpoint !== '',
        staleTime: 60_000,
        retry: false,
    });
    return query.isSuccess ? query.data : null;
}

function useBlockData<T>(block: ResolvedBlock): T[] | null {
    const { api } = useApp();
    const endpoint = block.endpoint ?? '';
    const query = useQuery({
        queryKey: pageBlockKey(endpoint),
        queryFn: () => readBlock<Answer<T>>(api, endpoint),
        enabled: endpoint !== '',
        staleTime: 60_000,
        retry: false,
    });
    if (!query.isSuccess) return null;
    const items = itemsOf(query.data);
    return items.length ? items.slice(0, Array.isArray(query.data) ? CARD_MAX : undefined) : null;
}

/**
 * The complementary region: its blocks in the page's order, each a card. `label` names the
 * landmark ("More on Home").
 */
export function ComplementaryBlocks({ blocks, label, screen, className }: { blocks: readonly ResolvedBlock[]; label: string; screen: Screen; className?: string }) {
    if (!blocks.length) return null;
    return (
        <aside className={`page-aside${className ? ` ${className}` : ''}`} aria-label={label}>
            {blocks.map((block) => (
                <PageBlock key={block.id} block={block} screen={screen} />
            ))}
        </aside>
    );
}

/** One block by its kind; null for a kind the app does not draw. */
export function PageBlock({ block, screen }: { block: ResolvedBlock; screen: Screen }) {
    switch (block.kind) {
        case 'graph.friends':
            return <PeopleBlock block={block} screen={screen} pick={(c: Schema<'Connected'>) => c.profile} />;
        case 'graph.friend_suggestions':
            return <PeopleBlock block={block} screen={screen} pick={(s: Schema<'Suggestion'>) => s.profile} action="befriend" />;
        case 'graph.follow_suggestions':
            return <PeopleBlock block={block} screen={screen} pick={(s: Schema<'Suggestion'>) => s.profile} action="follow" />;
        case 'posts.list':
            return <PostsBlock block={block} screen={screen} />;
        case 'groups.list':
        case 'groups.joined':
        case 'spaces.list':
        case 'spaces.joined':
            return <GroupsBlock block={block} screen={screen} />;
        case 'events.list':
        case 'events.joined':
            return <EventsBlock block={block} screen={screen} />;
        case 'profile.info':
            return <InfoBlock block={block} screen={screen} />;
        case 'groups.members':
        case 'spaces.members':
        case 'events.members':
            return <PeopleBlock block={block} screen={screen} pick={(m: Schema<'Member'> | Schema<'EventAttendee'>) => m.profile} />;
        case 'posts.categories':
        case 'discussions.categories':
            return <CategoriesBlock block={block} screen={screen} section={block.kind === 'posts.categories' ? 'posts' : 'discussions'} />;
        case 'discussions.list':
            return <DiscussionsBlock block={block} screen={screen} />;
        case 'text.html':
            return <TextBlock block={block} screen={screen} />;
        default:
            return null;
    }
}

/**
 * Text written in Studio (a language string or HTML: the site's About, Terms, Privacy), from
 * GET /layout/blocks/{id}/text, drawn as post text is (RichText sanitizes it).
 */
function TextBlock({ block, screen }: { block: ResolvedBlock; screen: Screen }) {
    const text = useBlockAnswer<Schema<'BlockText'>>(block);
    if (!text?.html.trim()) return null;
    return (
        <BlockCard block={block} screen={screen}>
            <RichText className="page-block-text" html={text.html} />
        </BlockCard>
    );
}

/**
 * A block's card: its title as the heading (kept for screen readers where the design box has
 * none or hides it on this screen), its surface and padding as its design box has them here.
 */
function BlockCard({ block, screen, children }: { block: ResolvedBlock; screen: Screen; children: ReactNode }) {
    const { frame, title_hidden_on, bg_hidden_on, padding_hidden_on } = block.design;
    const titleShown = !!block.title && (frame?.title ?? true) && !title_hidden_on.includes(screen);
    const bg = (frame?.bg ?? true) && !bg_hidden_on.includes(screen);
    const padding = (frame?.padding ?? true) && !padding_hidden_on.includes(screen);
    return (
        <SideCard title={block.title} titleShown={titleShown} bg={bg} padding={padding}>
            {children}
        </SideCard>
    );
}

/** People: a picture, the name (which opens the profile) with its badges, and the block's action. */
function PeopleBlock<T>({ block, screen, pick, action }: { block: ResolvedBlock; screen: Screen; pick: (item: T) => Profile; action?: 'befriend' | 'follow' }) {
    const items = useBlockData<T>(block);
    if (!items) return null;
    return (
        <BlockCard block={block} screen={screen}>
            <ul className="page-block-list">
                {items.map((item) => {
                    const p = pick(item);
                    return (
                        <li key={p.id} className="page-block-row">
                            <ProfileAvatar profile={p} size={32} />
                            <span className="page-block-text with-badges">
                                <ProfileName profile={p} className="truncate" />
                                <ProfileBadges badges={p.badges} max={1} />
                            </span>
                            {action ? <PersonAction profile={p} action={action} endpoint={block.endpoint ?? ''} /> : null}
                        </li>
                    );
                })}
            </ul>
        </BlockCard>
    );
}

const DONE_LABELS: Record<'befriend' | 'follow', string> = { befriend: t('Requested'), follow: t('Following', { context: 'state' }) };

/**
 * Add friend or Follow for a suggested profile. Once the site took it the button says so
 * (Requested, Following) and stays where it was, so focus stays on it; the suggestion goes from
 * the list the next time the block is read. Why the site refused shows under the row.
 */
function PersonAction({ profile, action, endpoint }: { profile: Profile; action: 'befriend' | 'follow'; endpoint: string }) {
    const run = useGraphAction(profile);
    const announce = useWindowAnnounce();
    const queryClient = useQueryClient();
    const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
    const [error, setError] = useState<string | null>(null);
    const busy = useRef(false);
    const press = async () => {
        if (busy.current || state === 'done') return;
        busy.current = true;
        setState('busy');
        setError(null);
        try {
            const status = await run(action as GraphAction);
            setState('done');
            announce(announcement(action, profile.display_name, status));
            // read again when the block is next shown (now would take the row from under the pointer)
            void queryClient.invalidateQueries({ queryKey: pageBlockKey(endpoint), refetchType: 'none' });
        } catch (e) {
            setState('idle');
            setError(errorMessage(e));
        } finally {
            busy.current = false;
        }
    };
    const label = state === 'done' ? DONE_LABELS[action] : action === 'befriend' ? t('Add friend') : t('Follow');
    return (
        <>
            <button
                type="button"
                className={`btn small${state === 'done' ? '' : ' btn-primary'}`}
                aria-label={`${label}, ${profile.display_name}`}
                aria-disabled={state !== 'idle' || undefined}
                data-busy={state === 'busy' ? '' : undefined}
                onClick={() => void press()}
            >
                <span>{label}</span>
            </button>
            {error ? (
                <p className="error page-block-error" role="alert">
                    {error}
                </p>
            ) : null}
        </>
    );
}

/** Posts: the title (which opens the post beside the page), who wrote it and when. */
function PostsBlock({ block, screen }: { block: ResolvedBlock; screen: Screen }) {
    const items = useBlockData<Post>(block);
    const { openDetail } = useNavigation();
    const queryClient = useQueryClient();
    if (!items) return null;
    return (
        <BlockCard block={block} screen={screen}>
            <ul className="page-block-list">
                {items.map((p) => {
                    const when = p.published_at ?? p.created_at;
                    return (
                        <li key={p.id} className="page-block-row page-block-post">
                            <span className="page-block-text">
                                <button
                                    type="button"
                                    className="profile-link page-block-name"
                                    onClick={() => {
                                        // the post shows at once while it loads its own copy (with its text)
                                        if (!queryClient.getQueryData(postKey(p.id))) queryClient.setQueryData(postKey(p.id), p, { updatedAt: 0 });
                                        openDetail({ kind: 'article', id: p.id });
                                    }}
                                >
                                    <bdi>{p.title}</bdi>
                                </button>
                                <span className="row-sub">
                                    {p.author ? (
                                        <span className={p.author.badges?.length ? 'with-badges' : undefined}>
                                            <bdi className="truncate">{p.author.display_name}</bdi>
                                            <ProfileBadges badges={p.author.badges} max={1} />
                                        </span>
                                    ) : null}
                                    {p.author ? <span aria-hidden="true">·</span> : null}
                                    <time dateTime={when} title={new Date(when).toLocaleString(locale())}>
                                        {ago(when)}
                                    </time>
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </BlockCard>
    );
}

/** Groups and spaces: the picture, the name (which opens it) with its badges, and how many are in it. */
function GroupsBlock({ block, screen }: { block: ResolvedBlock; screen: Screen }) {
    const items = useBlockData<Group>(block);
    if (!items) return null;
    return (
        <BlockCard block={block} screen={screen}>
            <ul className="page-block-list">
                {items.map((g) => (
                    <li key={g.id} className="page-block-row">
                        <ProfileAvatar profile={g} size={32} />
                        <span className="page-block-text">
                            <span className="with-badges">
                                <ProfileName profile={g} className="truncate" />
                                <ProfileBadges badges={g.badges} max={1} />
                            </span>
                            <span className="row-sub">{tn(g.member_count, '{{count}} member', '{{count}} members')}</span>
                        </span>
                    </li>
                ))}
            </ul>
        </BlockCard>
    );
}

/** Events: the title (which opens the event) and when it is. */
function EventsBlock({ block, screen }: { block: ResolvedBlock; screen: Screen }) {
    const items = useBlockData<Event>(block);
    const { openDetail } = useNavigation();
    const queryClient = useQueryClient();
    if (!items) return null;
    return (
        <BlockCard block={block} screen={screen}>
            <ul className="page-block-list">
                {items.map((e) => (
                    <li key={e.id} className="page-block-row page-block-post">
                        <span className="page-block-text">
                            <button
                                type="button"
                                className="profile-link page-block-name"
                                onClick={() => {
                                    // the page shows it at once while it loads its own copy
                                    if (!queryClient.getQueryData(groupKey(e.id))) queryClient.setQueryData(groupKey(e.id), eventContext(e), { updatedAt: 0 });
                                    openDetail(contextDetailRoute('event', e.id));
                                }}
                            >
                                <bdi>{e.title}</bdi>
                            </button>
                            <span className="row-sub">{eventWhen(e)}</span>
                        </span>
                    </li>
                ))}
            </ul>
        </BlockCard>
    );
}

/**
 * A date field's moment as the viewer's locale writes it: the day, and the time where it has
 * one (not midnight); the site's own text when it can't be read.
 */
export function infoWhen(field: Pick<InfoField, 'value' | 'datetime'>): string {
    const d = field.datetime ? new Date(field.datetime) : null;
    if (!d || Number.isNaN(d.getTime())) return field.value;
    const timed = /T(?!00:00(:00)?)\d/.test(field.datetime ?? '');
    return new Intl.DateTimeFormat(locale(), timed ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(d);
}

/** What the hero already says (its facts line): not repeated in Info. */
const SHOWN_IN_HERO = new Set(['friends_count', 'followers_count', 'following_count', 'members_count']);

/**
 * A profile's Info: its fields as a list of terms and values, dates in the viewer's locale. The
 * counts the hero shows are left out; an Info with nothing else draws nothing.
 */
function InfoBlock({ block, screen }: { block: ResolvedBlock; screen: Screen }) {
    const info = useBlockAnswer<Schema<'ProfileInfo'>>(block);
    const fields = (info?.fields ?? []).filter((f) => !SHOWN_IN_HERO.has(f.name));
    if (!fields.length) return null;
    return (
        <BlockCard block={block} screen={screen}>
            <dl className="page-block-info">
                {fields.map((f) => (
                    <div key={f.name} className="page-block-field">
                        <dt>{f.label}</dt>
                        <dd dir="auto">{f.datetime ? <time dateTime={f.datetime}>{infoWhen(f)}</time> : f.value}</dd>
                    </div>
                ))}
            </dl>
        </BlockCard>
    );
}

type CategoryRow = { id: string; name: string; count: number };

/** A categories route's answer as rows: Posts' list, or Discussions' `categories`; those without items left out, as the site's block. */
export function categoryRows(answer: Schema<'PostCategoryList'> | Schema<'DiscussionCategories'> | null): CategoryRow[] {
    if (!answer) return [];
    const rows = Array.isArray(answer) ? answer.map((c) => ({ id: c.id, name: c.name, count: c.count ?? 0 })) : answer.categories.map((c) => ({ id: c.id, name: c.title, count: c.count ?? 0 }));
    return rows.filter((r) => r.count > 0);
}

/** How many items a category has, for its button's name: "2 posts", "1 discussion". */
function categoryCount(section: CategorySection, count: number): string {
    return section === 'posts' ? tn(count, '{{count}} post', '{{count}} posts') : tn(count, '{{count}} discussion', '{{count}} discussions');
}

/**
 * A module's categories with how many items each has. Each opens the section's list of that
 * category, in the app; the one shown is marked (aria-current), and choosing it again shows
 * them all.
 */
function CategoriesBlock({ block, screen, section }: { block: ResolvedBlock; screen: Screen; section: CategorySection }) {
    const rows = categoryRows(useBlockAnswer<Schema<'PostCategoryList'> | Schema<'DiscussionCategories'>>(block));
    const route = useRoute();
    const { history } = useNavigation();
    if (!rows.length) return null;
    const here = route.list.section === section;
    const current = here ? (route.list.category ?? null) : null;
    return (
        <BlockCard block={block} screen={screen}>
            <ul className="page-block-list">
                {rows.map((c) => (
                    <li key={c.id}>
                        <button
                            type="button"
                            className="page-block-category"
                            aria-current={current === c.id ? 'true' : undefined}
                            onClick={() => {
                                const list = categoryPage(section, current === c.id ? null : c.id, here && isCategorySection(route.list.section) ? route.list.feed : undefined);
                                history.push({ list, detail: here ? route.detail : null });
                            }}
                        >
                            <bdi className="truncate">{c.name}</bdi>
                            <span className="page-block-count" aria-hidden="true">
                                {num(c.count)}
                            </span>
                            <span className="sr-only">{`, ${categoryCount(section, c.count)}`}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </BlockCard>
    );
}

/**
 * Above a list of one category (a Categories block opened it): which one, and a button back to
 * all of them. The name waits for the categories (an id the site no longer has says so).
 */
export function CategoryFilter({ name, all, onAll }: { name: string | null | undefined; all: string; onAll: () => void }) {
    return (
        <p className="category-filter">
            <span className="truncate">
                {name === undefined ? t('One category') : name === null ? t('A category this network no longer has') : rich(t('In <name></name>'), { name: () => <bdi className="strong">{name}</bdi> })}
            </span>
            <button type="button" className="link-button" onClick={onAll}>
                {all}
            </button>
        </p>
    );
}

/** Discussions: the title (which opens the discussion beside the page), who started it and its last activity. */
function DiscussionsBlock({ block, screen }: { block: ResolvedBlock; screen: Screen }) {
    const items = useBlockData<Discussion>(block);
    const { openDetail } = useNavigation();
    const queryClient = useQueryClient();
    if (!items) return null;
    return (
        <BlockCard block={block} screen={screen}>
            <ul className="page-block-list">
                {items.map((d) => {
                    const when = lastActivity(d);
                    const by = d.anonymous ? t('Anonymous') : (d.author?.display_name ?? null);
                    return (
                        <li key={d.id} className="page-block-row page-block-post">
                            <span className="page-block-text">
                                <button
                                    type="button"
                                    className="profile-link page-block-name"
                                    onClick={() => {
                                        // a list's discussion is a whole one: its pane shows it at once
                                        if (!queryClient.getQueryData(discussionKey(d.id))) queryClient.setQueryData(discussionKey(d.id), d, { updatedAt: 0 });
                                        openDetail({ kind: 'discussion', id: d.id });
                                    }}
                                >
                                    <bdi>{d.title}</bdi>
                                </button>
                                <span className="row-sub">
                                    {by ? <bdi className="truncate">{by}</bdi> : null}
                                    {by ? <span aria-hidden="true">·</span> : null}
                                    <time dateTime={when} title={new Date(when).toLocaleString(locale())}>
                                        {ago(when)}
                                    </time>
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </BlockCard>
    );
}

/**
 * A section's page around its main content (Home's feed): the page's complementary blocks for
 * the screen the content pane is (screenOf: its width, and a phone while a detail is open beside
 * it). On a desktop the side cells' blocks are a column on the right of the main one, which
 * stays in view as the feed scrolls (pinned at its top, or at its bottom when it is taller than
 * the pane). On a tablet or a phone they go below the main content, as the site stacks them, so
 * under an endless feed they show once it has no more pages (`ended`). The top cell's blocks are
 * above the main content on every screen, the bottom cell's below it.
 *
 * `about`: a profile's or context's page (its first tab, under the hero and the tabs), whose
 * blocks about it (Info, Friends, Members) go beside its timeline from any cell (complementary).
 * No path (a profile without a page on the site): its content alone.
 */
/** The page's padding and the gap between its columns (styles.css .page-columns[data-columns='side']): 24 + 16 + 24. */
const ASIDE_CHROME = 64;

export function PageColumns({ path, title, ended, about = false, children }: { path: string | null; title: string; ended: boolean; about?: boolean; children: ReactNode }) {
    const body = usePaneBody();
    const width = useWidth(body);
    const route = useRoute();
    const mode = usePanesMode();
    // a detail beside the list unless it covers it (not measured yet: beside, as panesMode says)
    const screen = screenOf(width, !!route.detail && mode !== 'cover');
    const layout = usePageLayout(path);
    const { top, side, bottom } = complementary(layout.data, screen, about);
    const columns = screen === 'desktop' && side.length > 0;
    const below = columns ? bottom : [...side, ...bottom];
    // the side column's width, which its divider changes: never so wide the main column is cramped
    const { shown, max, style } = useSideColumn(width, ASIDE_CHROME);
    return (
        <div
            className="page-columns"
            data-columns={columns ? 'side' : undefined}
            data-screen={screen}
            data-about={about ? '' : undefined}
            style={columns ? style : undefined}
        >
            {columns ? <SideDivider shown={shown} max={max} /> : null}
            <div className="column page-main">
                <ComplementaryBlocks blocks={top} label={t('Highlights on {{title}}', { title })} screen={screen} className="page-aside-top" />
                {children}
                {ended ? <ComplementaryBlocks blocks={below} label={columns ? t('Also on {{title}}', { title }) : t('More on {{title}}', { title })} screen={screen} className="page-aside-below" /> : null}
            </div>
            {columns ? (
                <StickySide>
                    <ComplementaryBlocks blocks={side} label={t('More on {{title}}', { title })} screen={screen} className="page-aside-side" />
                </StickySide>
            ) : null}
        </div>
    );
}

