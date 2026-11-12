/**
 * What the command palette offers and how it orders it, kept apart from the dialog so it can be
 * tested: places to go (sections, feeds), commands (from commands.json, plus switching profile),
 * people, groups and posts from the search API, things chosen before (this session), and the
 * full search. Matching ignores case and accents; the best match comes first.
 */
import type { Schema } from 'una-api';

import { t, tCommand, tn } from '../../lib/i18n';
import { type ListRoute, type SearchTab, searchRoute } from '../../lib/router';
import { type CommandId, COMMANDS } from '../../lib/shortcuts';

type Profile = Schema<'Profile'>;
type Activity = Schema<'Activity'>;

export const PALETTE_GROUPS = ['recent', 'go', 'commands', 'people', 'groups', 'posts', 'search'] as const;
export type PaletteGroup = (typeof PALETTE_GROUPS)[number];

export const GROUP_LABELS: Record<PaletteGroup, string> = {
    recent: t('Recent'),
    go: t('Go to'),
    commands: t('Commands'),
    people: t('People'),
    groups: t('Groups'),
    posts: t('Posts'),
    search: t('Search'),
};

export type PaletteAction =
    | { kind: 'list'; list: ListRoute }
    | { kind: 'command'; id: CommandId }
    | { kind: 'switch-profile'; profileId: string }
    | { kind: 'profile'; profile: Profile }
    | { kind: 'post'; activity: Activity }
    | { kind: 'search'; q: string; tab?: SearchTab };

export type PaletteEntry = {
    /** Unique in the palette, and an element id once made safe (optionId). */
    key: string;
    group: PaletteGroup;
    label: string;
    /** Secondary text: the author of a post, what a command does. */
    detail?: string;
    /** Other words that find it ("theme" finds the appearance commands). */
    keywords?: readonly string[];
    /** The command's shortcut as text, e.g. "⌘N". */
    shortcut?: string;
    /** The picture of a person or group. */
    profile?: Profile;
    action: PaletteAction;
};

/** How many of each group show while there is a query (the rest are in the Search view). */
export const GROUP_LIMITS: Record<PaletteGroup, number> = { recent: 6, go: 5, commands: 6, people: 5, groups: 3, posts: 5, search: 1 };

/** Lower case without accents, so "Elo" finds "Éloïse". */
export function fold(text: string): string {
    return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

/** Whether every character of the query appears in the text in order ("nwpst" in "new post"). */
function inOrder(text: string, query: string): boolean {
    let i = 0;
    for (const ch of text) {
        if (ch === query[i]) i++;
        if (i === query.length) return true;
    }
    return query.length === 0;
}

/**
 * How well an entry matches, lower is better, or null when it does not: 0 the whole label,
 * 1 the label starts with the query, 2 a word of it does, 3 a keyword starts with it, 4 the
 * label holds it, 5 its letters in order (typos aside, an abbreviation).
 */
export function matchScore(entry: Pick<PaletteEntry, 'label' | 'keywords'>, query: string): number | null {
    const q = fold(query);
    if (!q) return 0;
    const label = fold(entry.label);
    if (label === q) return 0;
    if (label.startsWith(q)) return 1;
    const labelWords = label.split(/[\s\-–:,.()/]+/);
    if (labelWords.some((w) => w.startsWith(q))) return 2;
    const keywords = (entry.keywords ?? []).map(fold);
    if (keywords.some((k) => k.startsWith(q) || k.split(/\s+/).some((w) => w.startsWith(q)))) return 3;
    // several words: each starts a word of the label or of a keyword ("dark mode")
    const words = q.split(/\s+/);
    const tokens = [...labelWords, ...keywords.flatMap((k) => k.split(/\s+/))];
    if (words.length > 1 && words.every((w) => tokens.some((token) => token.startsWith(w)))) return 3;
    if (label.includes(q)) return 4;
    if (q.length >= 2 && inOrder(label.replace(/\s+/g, ''), q.replace(/\s+/g, ''))) return 5;
    return null;
}

/** The entries that match, best first; equals keep their order. */
export function filterEntries(entries: readonly PaletteEntry[], query: string): PaletteEntry[] {
    return entries
        .map((entry, index) => ({ entry, index, score: matchScore(entry, query) }))
        .filter((x): x is { entry: PaletteEntry; index: number; score: number } => x.score !== null)
        .sort((a, b) => a.score - b.score || a.index - b.index)
        .map((x) => x.entry);
}

/**
 * Places to go: every section (Groups: the groups to browse), and each feed of Home and Explore.
 * Discussions only where the site has them (`discussions`: GET /discussions/categories answered),
 * Posts where GET /api/v2 lists the Posts module (`posts`),
 * as the sidebar shows its row; Spaces, Events and Media's tabs (Videos, Photos, Albums, Files) only where
 * GET /api/v2 lists the module (`spaces`, `events`, `videos`, `photos`, `albums`, `files`).
 */
export function navigationEntries(
    shortcut: (id: CommandId) => string | undefined,
    { discussions = false, spaces = false, events = false, videos = false, photos = false, albums = false, files = false, tasks = false, posts = false, people = false }: { discussions?: boolean; spaces?: boolean; events?: boolean; videos?: boolean; photos?: boolean; albums?: boolean; files?: boolean; tasks?: boolean; posts?: boolean; people?: boolean } = {},
): PaletteEntry[] {
    const go = (key: string, label: string, list: ListRoute, keywords: string[] = [], command?: CommandId): PaletteEntry => ({
        key: `go:${key}`,
        group: 'go',
        label,
        keywords,
        shortcut: command ? shortcut(command) : undefined,
        action: { kind: 'list', list },
    });
    return [
        go('home', t('Home'), { section: 'home' }, ['following', 'feed'], 'go-home'),
        go('for-you', t('Home: For you'), { section: 'home', feed: 'for-you' }, ['feed', 'recommended']),
        go('home-hot', t('Home: Hot'), { section: 'home', feed: 'hot' }, ['feed', 'popular', 'trending']),
        go('explore', t('Explore'), { section: 'explore' }, ['latest', 'public', 'feed'], 'go-explore'),
        go('explore-hot', t('Explore: Hot'), { section: 'explore', feed: 'hot' }, ['popular', 'trending']),
        go('notifications', t('Notifications'), { section: 'notifications' }, ['inbox', 'activity'], 'go-notifications'),
        go('unread', t('Notifications: Unread'), { section: 'notifications', filter: 'unread' }, ['inbox', 'new']),
        go('messages', t('Messages'), { section: 'messages' }, ['conversations', 'chat', 'inbox'], 'go-messages'),
        go('connections', t('Connections'), { section: 'connections' }, ['friends', 'people', 'contacts']),
        go('connections-requests', t('Connections: Requests'), { section: 'connections', connections: 'requests' }, ['friend requests', 'accept', 'decline']),
        go('connections-sent', t('Connections: Sent'), { section: 'connections', connections: 'sent' }, ['sent requests', 'pending', 'cancel']),
        go('connections-following', t('Connections: Following'), { section: 'connections', connections: 'following' }, ['follows', 'subscriptions']),
        go('connections-followers', t('Connections: Followers'), { section: 'connections', connections: 'followers' }, ['subscribers', 'fans']),
        ...(people
            ? [
                  go('people', t('People'), { section: 'people' }, ['members', 'directory', 'recent', 'new people']),
                  go('people-active', t('People: Active'), { section: 'people', feed: 'active' }, ['members', 'directory', 'recently active']),
                  go('people-online', t('People: Online'), { section: 'people', feed: 'online' }, ['members', 'online now']),
                  go('people-friends', t('People: Friends'), { section: 'people', feed: 'friends' }, ['my friends', 'contacts']),
              ]
            : []),
        ...(posts
            ? [
                  go('posts', t('Posts'), { section: 'posts' }, ['articles', 'blog', 'long reads', 'stories']),
                  go('posts-popular', t('Posts: Popular'), { section: 'posts', feed: 'popular' }, ['articles', 'blog', 'most viewed']),
                  go('posts-mine', t('Posts: Mine'), { section: 'posts', feed: 'mine' }, ['articles', 'blog', 'my posts', 'scheduled']),
              ]
            : []),
        ...(discussions ? [go('discussions', t('Discussions'), { section: 'discussions' }, ['forum', 'topics', 'questions', 'threads'])] : []),
        ...(events
            ? [
                  go('events', t('Events'), { section: 'events' }, ['upcoming', 'calendar', 'meetups', 'rsvp']),
                  go('events-going', t('Events: Going'), { section: 'events', feed: 'going' }, ['my events', 'rsvp', 'attending']),
                  go('events-past', t('Events: Past'), { section: 'events', feed: 'past' }, ['ended', 'calendar']),
              ]
            : []),
        // the first tab the site has is Media's default
        ...(videos ? [go('videos', t('Media: Videos'), { section: 'media' }, ['videos', 'media', 'clips', 'watch'])] : []),
        ...(photos ? [go('photos', t('Media: Photos'), videos ? { section: 'media', feed: 'photos' } : { section: 'media' }, ['photos', 'pictures', 'images', 'media'])] : []),
        ...(albums ? [go('albums', t('Media: Albums'), videos || photos ? { section: 'media', feed: 'albums' } : { section: 'media' }, ['albums', 'galleries', 'photos', 'media'])] : []),
        ...(files ? [go('files', t('Media: Files'), videos || photos || albums ? { section: 'media', feed: 'files' } : { section: 'media' }, ['files', 'documents', 'downloads', 'attachments', 'pdf', 'media'])] : []),
        ...(tasks
            ? [
                  go('tasks', t('My tasks'), { section: 'tasks' }, ['tasks', 'to do', 'todo', 'assigned', 'due']),
                  go('tasks-completed', t('My tasks: Completed'), { section: 'tasks', feed: 'completed' }, ['tasks', 'done', 'finished']),
                  go('tasks-created', t('My tasks: Created'), { section: 'tasks', taskRole: 'created' }, ['tasks', 'added', 'mine', 'authored']),
                  go('tasks-timers', t('My timers'), { section: 'tasks', taskView: 'timers' }, ['tasks', 'time', 'timer', 'tracking', 'stopwatch', 'log time']),
              ]
            : []),
        go('search', t('Search'), searchRoute(''), ['find', 'people', 'posts', 'groups'], 'go-search'),
        go('profile', t('Profile'), { section: 'profile' }, ['me', 'my profile', 'timeline'], 'go-profile'),
        go('groups', t('Groups'), { section: 'groups' }, ['browse groups', 'communities', 'join']),
        ...(spaces ? [go('spaces', t('Spaces'), { section: 'spaces' }, ['browse spaces', 'subspaces', 'communities', 'join'])] : []),
    ];
}

/**
 * Commands that act from anywhere. The palette leaves out those that act on what has focus (j,
 * k, l, c, ...: focus is in the palette), the panes and the sections (they are under Go to).
 */
const PALETTE_COMMANDS: readonly CommandId[] = [
    'new-post',
    'new-message',
    'refresh',
    'back',
    'forward',
    'theme-system',
    'theme-light',
    'theme-dark',
    'show-shortcuts',
    'open-settings',
    'check-updates',
    'toggle-sidebar',
    'add-network',
    'open-site',
    'report-issue',
    'sign-out',
];

const COMMAND_KEYWORDS: Partial<Record<CommandId, string[]>> = {
    'new-post': ['compose', 'write', 'create', 'publish'],
    'new-message': ['conversation', 'chat', 'write to', 'dm', 'send'],
    refresh: ['reload', 'update'],
    'theme-system': ['appearance', 'automatic', 'mode'],
    'theme-light': ['appearance', 'mode', 'day'],
    'theme-dark': ['appearance', 'mode', 'night'],
    'show-shortcuts': ['keyboard', 'keys', 'help', 'hotkeys'],
    'open-settings': ['preferences', 'options', 'account', 'profile', 'notifications', 'start at login'],
    'check-updates': ['update', 'upgrade', 'new version', 'release'],
    'toggle-sidebar': ['collapse', 'expand', 'icons', 'hide'],
    'add-network': ['sign in', 'another site', 'account', 'workspace'],
    'open-site': ['browser', 'website', 'web'],
    'report-issue': ['bug', 'feedback', 'help'],
    'sign-out': ['log out', 'logout', 'leave', 'account'],
};

/**
 * The palette's commands, and one to act as each other profile of the account. `newTask`: Cmd+N
 * adds a task to the list shown (a context's Tasks tab), so New Post is New Task, as in the menu.
 */
export function commandEntries(
    shortcut: (id: CommandId) => string | undefined,
    profiles: readonly Profile[] = [],
    activeProfileId?: string,
    { newTask = false }: { newTask?: boolean } = {},
): PaletteEntry[] {
    const entries: PaletteEntry[] = [];
    for (const id of PALETTE_COMMANDS) {
        const c = COMMANDS.find((x) => x.id === id);
        if (!c) continue;
        if (id === 'new-post' && newTask) {
            entries.push({ key: `cmd:${id}`, group: 'commands', label: t('New Task'), detail: t('Add a task to the list shown'), keywords: ['task', 'add', 'to do', ...(COMMAND_KEYWORDS[id] ?? [])], shortcut: shortcut(id), action: { kind: 'command', id } });
            continue;
        }
        // "Command Palette…" style labels lose their ellipsis here
        const english = c.label.replace(/…$/, '');
        const label = tCommand(c.label).replace(/…$/, '');
        // in another language the English name finds it too, as a keyword
        const keywords = label === english ? COMMAND_KEYWORDS[id] : [...(COMMAND_KEYWORDS[id] ?? []), english];
        entries.push({ key: `cmd:${id}`, group: 'commands', label, detail: tCommand(c.help), keywords, shortcut: shortcut(id), action: { kind: 'command', id } });
        if (id === 'theme-dark') {
            for (const p of profiles) {
                if (p.id === activeProfileId) continue;
                entries.push({
                    key: `switch:${p.id}`,
                    group: 'commands',
                    label: t('Switch to {{name}}', { name: p.display_name }),
                    detail: t('Act as this profile of your account'),
                    keywords: ['switch profile', 'act as', 'account'],
                    profile: p,
                    action: { kind: 'switch-profile', profileId: p.id },
                });
            }
        }
    }
    return entries;
}

export function profileEntry(profile: Profile, group: 'people' | 'groups'): PaletteEntry {
    return {
        key: `${group === 'groups' ? 'group' : 'profile'}:${profile.id}`,
        group,
        label: profile.display_name,
        detail: group === 'groups' ? t('Group') : profile.kind === 'organization' ? t('Organization') : t('Person'),
        profile,
        action: { kind: 'profile', profile },
    };
}

/** A post's line in the palette: its title or the start of its text, and who wrote it. */
export function postEntry(activity: Activity): PaletteEntry {
    const item = activity.object;
    const text = (item.card.title ?? item.card.text ?? '').replace(/\s+/g, ' ').trim();
    const label = text ? (text.length > 80 ? `${text.slice(0, 79).trimEnd()}…` : text) : item.media.length ? t('Photo post') : t('Post');
    const author = item.author?.display_name ?? (item.anonymous ? t('Anonymous') : undefined);
    return { key: `post:${activity.id}`, group: 'posts', label, detail: author ? t('Post by {{author}}', { author }) : t('Post'), action: { kind: 'post', activity } };
}

export function searchEntry(q: string): PaletteEntry {
    const words = q.trim();
    return { key: 'search:all', group: 'search', label: t('Search for “{{words}}”', { words }), detail: t('People, posts and groups'), action: { kind: 'search', q: words } };
}

export type PaletteSection = { group: PaletteGroup; label: string; entries: PaletteEntry[] };

export type PaletteSources = {
    /** Places and commands, all of them; filtered here. */
    local: readonly PaletteEntry[];
    /** What was chosen before, newest first; shown while the query is empty. */
    recent: readonly PaletteEntry[];
    /** Search results for the query, already ranked by the site. */
    people?: readonly PaletteEntry[];
    groups?: readonly PaletteEntry[];
    posts?: readonly PaletteEntry[];
};

/**
 * The palette's groups for a query, in a fixed order so a group stays where it was while
 * results arrive: with no query, what was chosen before, then places and commands; with one,
 * the places and commands that match, then people, groups and posts, then the full search.
 */
export function paletteSections(query: string, sources: PaletteSources): PaletteSection[] {
    const q = query.trim();
    const sections: PaletteSection[] = [];
    const add = (group: PaletteGroup, entries: readonly PaletteEntry[], limit?: number) => {
        const shown = limit === undefined ? [...entries] : entries.slice(0, limit);
        if (shown.length) sections.push({ group, label: GROUP_LABELS[group], entries: shown });
    };

    if (!q) {
        add('recent', sources.recent, GROUP_LIMITS.recent);
        add('go', sources.local.filter((e) => e.group === 'go'));
        add('commands', sources.local.filter((e) => e.group === 'commands'));
        return sections;
    }

    const matched = filterEntries(sources.local, q);
    add('go', matched.filter((e) => e.group === 'go'), GROUP_LIMITS.go);
    add('commands', matched.filter((e) => e.group === 'commands'), GROUP_LIMITS.commands);
    add('people', sources.people ?? [], GROUP_LIMITS.people);
    add('groups', sources.groups ?? [], GROUP_LIMITS.groups);
    add('posts', sources.posts ?? [], GROUP_LIMITS.posts);
    add('search', [searchEntry(q)]);
    return sections;
}

/** The sections' entries in the order the arrow keys go through them. */
export function flatten(sections: readonly PaletteSection[]): PaletteEntry[] {
    return sections.flatMap((s) => s.entries);
}

/**
 * An element id for an entry, one per key: letters, digits and '-' stay, every other character
 * (':', a space, '_', Cyrillic ...) becomes _<hex code point>_, so "search:анна" and
 * "search:иван", or "lily carter" and "lily-carter", get different ids.
 */
export function optionId(key: string): string {
    return `palette-option-${key.replace(/[^A-Za-z0-9-]/gu, (ch) => `_${(ch.codePointAt(0) ?? 0).toString(16)}_`)}`;
}

/** Where the active option goes for a key press in the palette's field, or null when the key is not the palette's. */
export function moveActive(key: string, active: number, count: number): number | null {
    if (count === 0) return key === 'ArrowDown' || key === 'ArrowUp' || key === 'PageDown' || key === 'PageUp' ? -1 : null;
    switch (key) {
        case 'ArrowDown':
            return active < 0 ? 0 : (active + 1) % count;
        case 'ArrowUp':
            return active < 0 ? count - 1 : (active - 1 + count) % count;
        case 'PageDown':
            return Math.min(count - 1, Math.max(0, active) + 5);
        case 'PageUp':
            return Math.max(0, active - 5);
        default:
            return null;
    }
}

/**
 * The active option after the entries changed: the same entry if it is still there, else the
 * first that is not stale (a result still shown from older words, which Enter must not run
 * while the new ones are on their way), else the first.
 */
export function keepActive(previousKey: string | null, entries: readonly PaletteEntry[], stale: ReadonlySet<string> = new Set()): number {
    if (!entries.length) return -1;
    const i = previousKey === null ? -1 : entries.findIndex((e) => e.key === previousKey);
    if (i >= 0) return i;
    const fresh = entries.findIndex((e) => !stale.has(e.key));
    return fresh < 0 ? 0 : fresh;
}

/** How many results there are, for the live region. */
export function resultsText(count: number, searching: boolean): string {
    if (searching && count <= 1) return t('Searching…');
    if (count === 0) return t('No results');
    return tn(count, '{{count}} result', '{{count}} results');
}

/**
 * What was chosen in the palette this session, newest first, without repeats: people, groups,
 * posts and searches (places and commands are always listed anyway).
 */
export class RecentEntries {
    private entries: PaletteEntry[] = [];

    constructor(private readonly limit = 8) {}

    list(): readonly PaletteEntry[] {
        return this.entries;
    }

    remember(entry: PaletteEntry): void {
        if (!['people', 'groups', 'posts', 'search'].includes(entry.group)) return;
        // a search is remembered as its words, and found again under Recent
        const stored: PaletteEntry =
            entry.action.kind === 'search' ? { ...entry, key: `search:${fold(entry.action.q)}`, label: entry.action.q, detail: t('Search') } : entry;
        this.entries = [{ ...stored, group: 'recent' as const }, ...this.entries.filter((e) => e.key !== stored.key)].slice(0, this.limit);
    }

    /** A post that is gone, or another profile acts now. */
    forget(key?: string): void {
        this.entries = key === undefined ? [] : this.entries.filter((e) => e.key !== key);
    }
}
