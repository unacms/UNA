/**
 * The command palette (Cmd+K): one field to go anywhere, find a person, group or post, or run a
 * command. It is a modal <dialog> with the ARIA combobox pattern: the field is the combobox,
 * the results a listbox of groups, and the arrow keys move the active option
 * (aria-activedescendant) while focus stays in the field. Enter runs it; Esc closes the
 * palette and focus goes back to where it was. How many results there are is said politely.
 */
import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { type KeyboardEvent, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Avatar } from '../../components/avatar';
import { closeModal, openModal } from '../../components/dialog';
import { ApiError, isGone, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { t } from '../../lib/i18n';
import { useClick } from '../../lib/use-click';
import { useHasDiscussions } from '../discussions/discussions';
import { useTaskAddShown } from '../tasks/tasks';
import { useSiteHasTag } from '../../lib/site-modules';
import { platform } from '../../lib/platform';
import { command, type CommandId, shortcutText } from '../../lib/shortcuts';
import {
    commandEntries,
    flatten,
    keepActive,
    moveActive,
    navigationEntries,
    optionId,
    type PaletteEntry,
    paletteSections,
    postEntry,
    profileEntry,
    type RecentEntries,
    resultsText,
} from './commands';

/** Wait this long after the last key before asking the site. */
export const SEARCH_DEBOUNCE_MS = 200;

type Props = {
    open: boolean;
    /** The palette closed (Esc, or a choice): focus is already back where it was. */
    onClose: () => void;
    /** Run what was chosen. Focus is back where it was when the palette opened. */
    onChoose: (entry: PaletteEntry) => void;
    recent: RecentEntries;
};

/** A post entry whose thread found the post deleted or no longer visible (GET /activities/{id}). */
export function postGone(queryClient: QueryClient, entry: PaletteEntry): boolean {
    if (entry.action.kind !== 'post') return false;
    const state = queryClient.getQueryState(['activity', entry.action.activity.id]);
    return state?.status === 'error' && isGone(state.error);
}

function useDebounced<T>(value: T, ms: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), ms);
        return () => clearTimeout(timer);
    }, [value, ms]);
    return debounced;
}

const shortcut = (id: CommandId) => {
    const c = command(id);
    return c.accelerator || c.keys ? shortcutText(c, platform.mac) : undefined;
};

export function CommandPalette({ open, onClose, onChoose, recent }: Props) {
    const { api, me } = useApp();
    const queryClient = useQueryClient();
    const dialog = useRef<HTMLDialogElement>(null);
    const field = useRef<HTMLInputElement>(null);
    const listbox = useRef<HTMLDivElement>(null);
    // what had focus when the palette opened; null once focus went back
    const returnTo = useRef<HTMLElement | null>(null);
    const [query, setQuery] = useState('');
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const ids = useId();
    const listId = `${ids}-list`;
    const statusId = `${ids}-status`;

    const words = query.trim();
    const searched = useDebounced(words, SEARCH_DEBOUNCE_MS);
    // only for the words in the field: a reopened palette (empty field, the last words still in
    // the debounce) asks nothing
    const enabled = open && searched.length > 0 && searched === words;

    const people = useQuery({
        queryKey: ['palette', 'people', searched],
        queryFn: async () => unwrap(await api.GET('/search/profiles', { params: { query: { q: searched, limit: 5 } } })),
        enabled,
        staleTime: 30_000,
        keepPreviousData: true,
    });
    const groups = useQuery({
        queryKey: ['palette', 'groups', searched],
        queryFn: async () => {
            try {
                return unwrap(await api.GET('/search/groups', { params: { query: { q: searched, limit: 3 } } }));
            } catch (e) {
                // a site without groups has no such endpoint
                if (e instanceof ApiError && e.status === 404) return [];
                throw e;
            }
        },
        enabled,
        staleTime: 30_000,
        keepPreviousData: true,
    });
    const posts = useQuery({
        queryKey: ['palette', 'posts', searched],
        queryFn: async () => unwrap(await api.GET('/search/content', { params: { query: { q: searched, limit: 5 } } })),
        enabled,
        staleTime: 30_000,
        keepPreviousData: true,
    });

    const discussions = useHasDiscussions() === true;
    const spaces = useSiteHasTag('spaces') === true;
    const events = useSiteHasTag('events') === true;
    const videos = useSiteHasTag('videos') === true;
    const photos = useSiteHasTag('photos') === true;
    const albums = useSiteHasTag('albums') === true;
    const files = useSiteHasTag('files') === true;
    const tasks = useSiteHasTag('tasks') === true;
    const postsModule = useSiteHasTag('posts') === true;
    const peopleSection = useSiteHasTag('persons') === true;
    const newTask = useTaskAddShown();
    const local = useMemo(
        () => [...navigationEntries(shortcut, { discussions, spaces, events, videos, photos, albums, files, tasks, posts: postsModule, people: peopleSection }), ...commandEntries(shortcut, me.profiles, me.active_profile_id ?? undefined, { newTask })],
        [me.profiles, me.active_profile_id, discussions, spaces, events, videos, photos, albums, files, tasks, postsModule, peopleSection, newTask],
    );
    // While the next answer is on its way the last one stays (keepPreviousData), so the groups
    // don't jump about with each key; the spinner says it is still searching. Those results are
    // for older words, so none of them is the option Enter runs until the new ones are in.
    const old = (q: { isPreviousData: boolean }) => searched !== words || q.isPreviousData;
    const staleKeys = new Set<string>();
    if (old(people)) for (const p of people.data ?? []) staleKeys.add(profileEntry(p, 'people').key);
    if (old(groups)) for (const p of groups.data ?? []) staleKeys.add(profileEntry(p, 'groups').key);
    if (old(posts)) for (const h of posts.data?.items ?? []) staleKeys.add(postEntry(h.activity).key);
    // a post found before that is gone now (its thread said so) is not offered, and leaves Recent
    const recentAll = open ? recent.list() : null;
    const recentList = useMemo(() => recentAll?.filter((e) => !postGone(queryClient, e)) ?? null, [recentAll, queryClient]);
    useEffect(() => {
        if (!open) return;
        for (const e of recent.list()) if (postGone(queryClient, e)) recent.forget(e.key);
    }, [open, recent, queryClient]);
    const sections = useMemo(
        () =>
            paletteSections(query, {
                local,
                recent: recentList ?? [],
                people: people.data?.map((p) => profileEntry(p, 'people')),
                groups: groups.data?.map((p) => profileEntry(p, 'groups')),
                posts: posts.data?.items.map((h) => postEntry(h.activity)),
            }),
        [query, local, recentList, people.data, groups.data, posts.data],
    );
    const entries = useMemo(() => flatten(sections), [sections]);
    const activeIndex = keepActive(activeKey, entries, staleKeys);
    const active = activeIndex >= 0 ? entries[activeIndex] : undefined;
    const searching = !!words && (searched !== words || people.isFetching || groups.isFetching || posts.isFetching);

    // open: remember where focus was, start empty; closed from outside (a menu command): focus goes back
    useLayoutEffect(() => {
        const d = dialog.current;
        if (!d) return;
        if (open) {
            if (d.open) return;
            returnTo.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
            setQuery('');
            setActiveKey(null);
            openModal(d);
            field.current?.focus();
            return;
        }
        if (d.open) closeModal(d);
        const back = returnTo.current;
        returnTo.current = null;
        if (back?.isConnected && !back.closest('[inert], [hidden]')) back.focus();
    }, [open]);

    /** Close, give focus back, then run the choice (which may move focus itself). */
    const finish = useCallback(
        (entry?: PaletteEntry) => {
            const d = dialog.current;
            const back = returnTo.current;
            returnTo.current = null;
            if (d?.open) closeModal(d);
            if (back?.isConnected && !back.closest('[inert], [hidden]')) back.focus();
            onClose();
            if (entry) {
                recent.remember(entry);
                onChoose(entry);
            }
        },
        [onClose, onChoose, recent],
    );

    // Esc: the dialog's cancel; closing goes through finish so focus goes back first
    useEffect(() => {
        const d = dialog.current;
        if (!d) return;
        const onCancel = (e: Event) => {
            e.preventDefault();
            finish();
        };
        d.addEventListener('cancel', onCancel);
        return () => d.removeEventListener('cancel', onCancel);
    }, [finish]);

    // the active option stays in view
    useLayoutEffect(() => {
        if (!active) return;
        const el = document.getElementById(optionId(active.key));
        if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
    }, [active]);

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            if (active) finish(active);
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            finish();
            return;
        }
        if (e.key === 'Tab') {
            // the field is the palette's only stop: Tab stays in it, as in a native picker
            e.preventDefault();
            return;
        }
        const next = moveActive(e.key, activeIndex, entries.length);
        if (next === null) return;
        e.preventDefault();
        setActiveKey(entries[next]?.key ?? null);
    };

    const status = open ? resultsText(entries.length, searching) : '';

    // a click beside the palette, on its backdrop, closes it as Esc does
    useClick(dialog, (e, el) => {
        if (e.target === el) finish();
    });

    return (
        <dialog ref={dialog} className="palette" aria-label={t('Command palette')}>
            <div className="palette-field">
                <span className="palette-icon" aria-hidden="true">⌕</span>
                <input
                    ref={field}
                    type="text"
                    role="combobox"
                    aria-label={t('Go to, search or run a command')}
                    aria-expanded={entries.length > 0}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={active ? optionId(active.key) : undefined}
                    placeholder={t('Go to, find people and posts, or type a command')}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setActiveKey(null);
                    }}
                    onKeyDown={onKeyDown}
                />
                {searching ? <span className="spinner palette-spinner" aria-hidden="true" /> : null}
            </div>
            <div ref={listbox} id={listId} role="listbox" aria-label={t('Results')} className="palette-list">
                {sections.map((s) => (
                    <div key={s.group} role="group" aria-labelledby={`${ids}-${s.group}`} className="palette-group">
                        <div id={`${ids}-${s.group}`} className="palette-group-label">
                            {s.label}
                        </div>
                        {s.entries.map((entry) => {
                            const selected = entry.key === active?.key;
                            return (
                                <div
                                    key={entry.key}
                                    id={optionId(entry.key)}
                                    role="option"
                                    aria-selected={selected}
                                    className="palette-option"
                                    // a press would take focus from the field
                                    onMouseDown={(e) => e.preventDefault()}
                                    onMouseMove={() => !selected && setActiveKey(entry.key)}
                                    onClick={() => finish(entry)}
                                    // focus stays in the field, whose keys move through the list and
                                    // run; this is for assistive technology that sends the key to
                                    // the option itself
                                    onKeyDown={(e) => {
                                        if (e.key !== 'Enter' && e.key !== ' ') return;
                                        e.preventDefault();
                                        finish(entry);
                                    }}
                                >
                                    {entry.profile ? <Avatar profile={entry.profile} size={24} /> : <span className="palette-glyph" aria-hidden="true" />}
                                    <span className="palette-text">
                                        <span className="palette-label truncate">{entry.label}</span>
                                        {entry.detail ? <span className="palette-detail truncate">{entry.detail}</span> : null}
                                    </span>
                                    {entry.shortcut ? (
                                        <kbd className="palette-shortcut" aria-hidden="true">
                                            {entry.shortcut}
                                        </kbd>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                ))}
                {!entries.length && words && !searching ? <p className="palette-empty">{t('Nothing matches “{{words}}”.', { words })}</p> : null}
            </div>
            <p id={statusId} className="sr-only" role="status" aria-live="polite">
                {status}
            </p>
            <p className="palette-hint" aria-hidden="true">
                {t('↑↓ to move · Enter to open · Esc to close')}
            </p>
        </dialog>
    );
}
