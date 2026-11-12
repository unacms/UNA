import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type KeyboardEvent, type PointerEvent, useCallback, useEffect, useId, useRef, useState } from 'react';

import type { Schema } from 'una-api';

import { ensureOk, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { REACTION_SETTLED, type ReactionSettled } from '../../lib/focused-entry';
import { t, tn } from '../../lib/i18n';
import { putActivity, updateItem, viewerOf, withReaction } from './cache';
import { givenKind, ReactionGlyph, reactionLook } from './reaction-glyph';
import { ReactionPicker } from './reaction-picker';

type Details = Schema<'ReactionKinds'>;

type Props = {
    activityId: string;
    item: Schema<'Item'>;
    /** A reaction the site refused, after the change was taken back; null clears it. */
    onError: (message: string | null) => void;
};

/** Hover this long over the toggle and the choices open. */
export const HOVER_OPEN_MS = 400;
/** The choices close this long after the pointer left both the toggle and the capsule. */
export const HOVER_CLOSE_MS = 300;
/** A press held this long opens the choices instead of toggling. */
export const LONG_PRESS_MS = 500;

/** The event the post menu sends a reaction toggle to give one kind (detail: its name). */
export const REACT_WITH = 'una-react-with';

/**
 * The site's reactions with their titles, emoji and icons (GET /reactions/details, the default
 * first), asked once per run and shared by every post. GET /reactions has the names only.
 */
export function useReactionDetails(): Details | undefined {
    const { api } = useApp();
    const reactions = useQuery({
        queryKey: ['reactions', 'details'],
        queryFn: async () => unwrap(await api.GET('/reactions/details')),
        staleTime: Infinity,
    });
    return reactions.data;
}

export function useReactionKinds(): Details['kinds'] | undefined {
    return useReactionDetails()?.kinds;
}

/**
 * The reaction toggle (the site's first reaction, or the viewer's own). The other reactions are
 * a capsule above it: it opens on hover (HOVER_OPEN_MS, and stays while the pointer is in it),
 * on a long press (LONG_PRESS_MS, which then does not toggle), and from the keyboard (Shift+Enter,
 * or the Up or Down arrow); the post's context menu lists them too. A reaction shows at once in
 * every copy of the item (optimistic, cache.ts) and is taken back if the site refuses it; then
 * the site's own counts replace the guess.
 */
export function ReactionButton({ activityId, item, onError }: Props) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const details = useReactionDetails();
    const kinds = details?.kinds ?? [];
    const look = reactionLook(details?.display);
    // how it opened: the keyboard puts focus in it, a pointer leaves focus where it is
    const [open, setOpen] = useState<null | 'hover' | 'press' | 'keyboard'>(null);
    const anchor = useRef<HTMLDivElement>(null);
    const toggle = useRef<HTMLButtonElement>(null);
    const busy = useRef(false);
    // drawn as data-busy, so l knows a press now would be ignored (focused-entry.ts)
    const [pending, setPending] = useState(false);
    const menuId = useId();
    const hintId = useId();
    const timers = useRef<{ open?: ReturnType<typeof setTimeout>; close?: ReturnType<typeof setTimeout>; press?: ReturnType<typeof setTimeout> }>({});
    // a long press opened the choices: the pointer click that ends it gives nothing
    const pressed = useRef(false);

    const clearTimer = (which: 'open' | 'close' | 'press') => {
        clearTimeout(timers.current[which]);
        timers.current[which] = undefined;
    };
    useEffect(() => {
        const kept = timers.current;
        return () => {
            clearTimeout(kept.open);
            clearTimeout(kept.close);
            clearTimeout(kept.press);
        };
    }, []);

    const react = async (kind: string | null) => {
        // one change at a time: a second click while the first is on its way does nothing
        if (busy.current) return;
        busy.current = true;
        setPending(true);
        // the toggle as it was pressed: it may be drawn anew (or scrolled away) by the answer
        const el = toggle.current;
        const settle = (detail: ReactionSettled) => el?.dispatchEvent(new CustomEvent(REACTION_SETTLED, { detail }));
        onError(null);
        const before = item;
        const had = viewerOf(before).reaction ?? null;
        const next = kind === had ? null : kind;
        updateItem(queryClient, before.id, (it) => withReaction(it, next));
        try {
            if (next === null) ensureOk(await api.DELETE('/content/{id}/reaction', { params: { path: { id: before.id } } }));
            else ensureOk(await api.PUT('/content/{id}/reaction', { params: { path: { id: before.id } }, body: { kind: next } }));
        } catch (e) {
            // taken back, unless something newer (a poll) already replaced the guess
            updateItem(queryClient, before.id, (it) =>
                (viewerOf(it).reaction ?? null) === next
                    ? { ...it, viewer: { ...viewerOf(it), reaction: had }, stats: { ...it.stats, reactions: before.stats.reactions } }
                    : it,
            );
            onError(errorMessage(e));
            settle({ error: errorMessage(e) });
            return;
        } finally {
            busy.current = false;
            setPending(false);
        }
        settle({ reacted: next !== null });
        try {
            putActivity(queryClient, unwrap(await api.GET('/activities/{id}', { params: { path: { id: activityId } } })));
        } catch {
            // the guess stays until the next poll
        }
    };
    // the post menu's reactions (activity-card.tsx): one kind, by name
    useEffect(() => {
        const el = toggle.current;
        if (!el) return;
        const onReactWith = (e: Event) => void react((e as CustomEvent<string>).detail);
        el.addEventListener(REACT_WITH, onReactWith);
        return () => el.removeEventListener(REACT_WITH, onReactWith);
    });

    const close = useCallback((restoreFocus: boolean) => {
        clearTimeout(timers.current.close);
        pressed.current = false;
        setOpen(null);
        if (restoreFocus) toggle.current?.focus();
    }, []);

    const choices = kinds.length > 1;

    // hover: open after a pause, close a moment after the pointer left the toggle and the capsule
    const pointerIn = (e: PointerEvent) => {
        if (!choices || e.pointerType === 'touch') return;
        clearTimer('close');
        if (open || timers.current.open) return;
        timers.current.open = setTimeout(() => {
            timers.current.open = undefined;
            setOpen((v) => v ?? 'hover');
        }, HOVER_OPEN_MS);
    };
    const pointerOut = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        clearTimer('open');
        clearTimer('press');
        if (open !== 'hover' && open !== 'press') return;
        clearTimer('close');
        timers.current.close = setTimeout(() => {
            timers.current.close = undefined;
            // focus went into the capsule (Tab from the toggle): it is the keyboard's now and stays
            if (anchor.current?.contains(document.activeElement) && document.activeElement !== toggle.current) {
                setOpen('keyboard');
                return;
            }
            setOpen(null);
        }, HOVER_CLOSE_MS);
    };

    const first = kinds[0];
    // the kinds are on their way (or the site has none): the count still shows
    if (!first) return <ReactionCount count={item.stats.reactions} />;
    // the viewer's reaction: one of the site's, or an emoji they picked (Many mode), drawn as it
    const current = givenKind(kinds, viewerOf(item).reaction);
    const shown = current ?? first;
    const count = item.stats.reactions;

    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
        if (!choices) return;
        const opens = (e.key === 'Enter' && e.shiftKey) || ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey);
        if (!opens) return;
        e.preventDefault();
        e.stopPropagation();
        clearTimer('open');
        setOpen('keyboard');
    };

    return (
        <div className="react" ref={anchor} onPointerEnter={pointerIn} onPointerLeave={pointerOut}>
            <button
                ref={toggle}
                type="button"
                className={`act-btn act-react${current ? ' on' : ''}`}
                aria-pressed={!!current}
                // the visible part is a glyph and a number, so the name says the kind and the count
                aria-label={reactionLabel(shown.title, count)}
                aria-describedby={choices ? hintId : undefined}
                // l on the post presses it (focused-entry.ts)
                data-react-toggle
                data-busy={pending || undefined}
                onPointerDown={(e) => {
                    // any press is not a hover (a right-click opens the post menu instead): the
                    // choices do not come up under it, and an earlier long press is over
                    clearTimer('open');
                    pressed.current = false;
                    if (e.button !== 0 || !choices) return;
                    clearTimer('press');
                    timers.current.press = setTimeout(() => {
                        timers.current.press = undefined;
                        pressed.current = true;
                        setOpen((v) => (v === 'keyboard' ? v : 'press'));
                    }, LONG_PRESS_MS);
                }}
                onPointerUp={() => clearTimer('press')}
                onPointerCancel={() => clearTimer('press')}
                onClick={(e) => {
                    clearTimer('press');
                    const longPress = pressed.current;
                    pressed.current = false;
                    // only a pointer's click ends a long press; l, Enter and Space (detail 0) give
                    if (longPress && e.detail > 0) return;
                    setOpen(null);
                    // a press takes back the reaction the toggle shows (react: the same kind again)
                    void react(current ? current.name : first.name);
                }}
                onKeyDown={onKeyDown}
                onContextMenu={(e) => {
                    // a long press on a touch screen; else the post's menu, which lists the reactions
                    if (pressed.current) {
                        e.preventDefault();
                        return;
                    }
                    clearTimer('open');
                    clearTimer('press');
                    if (!choices) return;
                    if (e.currentTarget.closest('article.activity')) {
                        // the post's menu lists the reactions: no capsule under it, nor its Esc
                        setOpen(null);
                        return;
                    }
                    e.preventDefault();
                    setOpen('keyboard');
                }}
            >
                <ReactionGlyph kind={shown} look={look} />
                {count ? (
                    <span className="act-count" aria-hidden="true">
                        {count}
                    </span>
                ) : null}
            </button>
            {choices ? (
                <span id={hintId} hidden>
                    {t('Shift+Enter or Up Arrow for more reactions')}
                </span>
            ) : null}
            {open ? (
                <ReactionPicker
                    id={menuId}
                    kinds={kinds}
                    look={look}
                    current={viewerOf(item).reaction}
                    anchor={anchor}
                    focusOnOpen={open === 'keyboard'}
                    onPointerEnter={pointerIn}
                    onPointerLeave={pointerOut}
                    // Tab from the toggle into a capsule the pointer opened: the keyboard's now,
                    // so the pointer leaving does not close it under the focus
                    onFocusIn={() => setOpen((v) => (v === null ? v : 'keyboard'))}
                    onClose={close}
                    onPick={(name) => {
                        close(open === 'keyboard');
                        void react(name);
                    }}
                />
            ) : null}
        </div>
    );
}

/** "Like, 12 reactions": the toggle's name, the kind's title then the count (none at 0). */
export function reactionLabel(title: string, count: number): string {
    if (!count) return title;
    return `${title}, ${tn(count, '{{count}} reaction', '{{count}} reactions')}`;
}

/**
 * The count where the viewer can't react: the same look, not a control. The number is said
 * as words ("12 reactions").
 */
export function ReactionCount({ count }: { count: number }) {
    const details = useReactionDetails();
    if (!count) return null;
    const first = details?.kinds[0];
    return (
        <span className="act-btn act-static">
            {first ? <ReactionGlyph kind={first} look={reactionLook(details.display)} /> : null}
            <span className="act-count" aria-hidden="true">
                {count}
            </span>
            <span className="sr-only">{tn(count, '{{count}} reaction', '{{count}} reactions')}</span>
        </span>
    );
}
