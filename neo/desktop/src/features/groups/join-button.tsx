import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import type { Schema } from 'una-api';

import type { ContextAction } from '../../components/context-actions';
import type { IconName } from '../../components/icon';
import { isGone } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { confirmAction } from '../../lib/native';
import { eventContext, rsvpEvent, rsvpStatus } from '../events/events';
import { actionAnnouncement, actionLabel, actionMethod, afterMembershipChange, type Context, contextKind, type ContextKind, fetchContext, type Group, groupKey, joinContext, leaveContext, membershipActions, type MembershipAction } from './groups';

/** `box`: the buttons that had focus when the change started (a list row's, a hero's or its toolbar's copy). */
type FocusAfter = { pending: boolean; box: HTMLElement | null; fallback: HTMLElement | null };

/**
 * After a change: if the button that had focus is gone (focus is on the page), the first button
 * left among those it was in, else the pane's heading (`fallback`, found when the change started).
 */
function restoreFocus(f: FocusAfter) {
    if (!f.pending) return;
    f.pending = false;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    const target = (f.box?.isConnected ? f.box.querySelector<HTMLElement>('button') : null) ?? (f.fallback?.isConnected ? f.fallback : null);
    target?.focus();
}

const ICONS: Record<MembershipAction, IconName> = { join: 'user-plus', ask: 'user-plus', accept: 'check', decline: 'x', cancel: 'x', leave: 'log-out' };

/**
 * Join, Ask to join, Accept or Decline an invitation, Cancel a request, Leave: what the API
 * says the viewer can do (`viewer.can_join`, `can_leave`). Leaving asks first. While the site
 * answers the button stays where it is (aria-disabled, so focus stays on it), and what happened
 * is said through `announce`. Once the site took the change, that is what is said and what
 * depends on it loads again, whatever reading the group afterwards gives: a secret group one
 * just left answers 404, and the group view then says it is gone. A button that is gone
 * afterwards (Decline, or Join in a list) hands focus to the one left among the buttons it was
 * in (`[data-actions]`), else to the pane's heading. `onAction`: the change starts (a list
 * keeps the buttons of a group acted on). No group yet: nothing to do.
 */
export function useMembership(group: Group | undefined, { announce, onAction, kind: shownAs }: { announce: (text: string) => void; onAction?: () => void; kind?: ContextKind }) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const [busy, setBusy] = useState<MembershipAction | null>(null);
    const [error, setError] = useState<string | null>(null);
    const running = useRef(false);
    // where focus goes if the pressed button is gone once the site answered
    const focusAfter = useRef<FocusAfter>({ pending: false, box: null, fallback: null });
    const mounted = useRef(true);
    const actions = group ? membershipActions(group) : [];
    // a space's buttons go to its own paths (/spaces/{id}/membership)
    const kind = shownAs ?? (group ? contextKind(group) : 'group');

    useEffect(() => {
        if (!busy) restoreFocus(focusAfter.current);
    });
    useEffect(() => {
        mounted.current = true;
        const f = focusAfter.current;
        return () => {
            mounted.current = false;
            // the view or row that drew the buttons is gone after the change (a group one can no
            // longer see, Join in a list): focus goes to the pane's heading, not to the page
            if (!running.current) {
                f.box = null;
                restoreFocus(f);
            }
        };
    }, []);

    const run = async (action: MembershipAction) => {
        if (running.current || !group) return;
        if (action === 'leave') {
            const ok = await confirmAction(
                kind === 'event'
                    ? {
                          title: t('Not going to {{name}}?', { name: group.display_name }),
                          message: group.visibility === 'public' ? t('You leave its attendees and stop following its posts. You can say you’re going again later.') : t('You leave its attendees and stop seeing its posts. To come back you may have to ask again.'),
                          okLabel: t('Not going'),
                      }
                    : {
                          title: t('Leave {{name}}?', { name: group.display_name }),
                          message: group.visibility === 'public' ? t('You stop following its posts. You can join again later.') : t('You stop seeing its posts and members. To come back you may have to ask again.'),
                          okLabel: t('Leave'),
                      },
            );
            if (!ok) return;
        }
        running.current = true;
        const box = document.activeElement?.closest<HTMLElement>('[data-actions]') ?? null;
        // the same object throughout: the unmount cleanup holds it
        focusAfter.current.pending = !!box;
        focusAfter.current.box = box;
        focusAfter.current.fallback = box?.closest('[data-pane]')?.querySelector<HTMLElement>('.pane-head [tabindex="-1"]') ?? null;
        onAction?.();
        setBusy(action);
        setError(null);
        let status: Schema<'MemberStatus'> | undefined;
        // going answers the event as it is now: no need to read it again
        let answered: Context | undefined;
        try {
            if (actionMethod(action) === 'POST' && kind === 'event') {
                const e = await rsvpEvent(api, group.id);
                status = rsvpStatus(e);
                answered = eventContext(e);
            } else if (actionMethod(action) === 'POST') status = await joinContext(api, kind, group.id);
            else await leaveContext(api, kind, group.id);
        } catch (e) {
            setError(errorMessage(e));
            // the group as the site has it now: another device may have changed it
            void queryClient.invalidateQueries({ queryKey: groupKey(group.id) });
            running.current = false;
            setBusy(null);
            return;
        }

        // the site took it: say so, then the group as it is now (its query, so a view that shows
        // it follows: a secret group just left is an error there, gone) and what depends on it
        announce(actionAnnouncement(action, group.display_name, status, kind));
        let gone = false;
        if (answered) queryClient.setQueryData(groupKey(group.id), answered);
        else
            try {
                await queryClient.fetchQuery({ queryKey: groupKey(group.id), queryFn: () => fetchContext(api, kind, group.id), retry: false });
            } catch (e) {
                gone = isGone(e);
            }
        try {
            await afterMembershipChange(queryClient, group.id, { gone });
        } finally {
            running.current = false;
            if (mounted.current) setBusy(null);
            // the buttons are gone with the row or view that drew them: focus the pane's heading
            else {
                focusAfter.current.box = null;
                restoreFocus(focusAfter.current);
            }
        }
    };

    return { actions, busy, error, run, kind };
}

/** The membership's buttons as a hero's actions (and its toolbar's copy): the first filled when it joins. */
export function membershipItems({ actions, busy, run, kind }: ReturnType<typeof useMembership>): ContextAction[] {
    return actions.map((a, i) => ({
        // the first stays the same element as the action changes, so focus stays on it
        key: i === 0 ? 'membership-primary' : 'membership-secondary',
        label: actionLabel(a, kind),
        icon: ICONS[a],
        primary: i === 0 && (a === 'join' || a === 'ask' || a === 'accept'),
        busy: busy === a,
        blocked: busy !== null,
        run: () => void run(a),
    }));
}

/** A list row's membership buttons (small, none filled); a page's hero uses useMembership and membershipItems. */
export function JoinButtons({ group, announce, small, onAction, kind: shownAs }: { group: Group; announce: (text: string) => void; small?: boolean; onAction?: () => void; kind?: ContextKind }) {
    const { actions, busy, error, run, kind } = useMembership(group, { announce, onAction, kind: shownAs });
    if (!actions.length && !error) return null;
    const size = small ? ' small' : '';
    return (
        <div className="join-buttons" data-actions>
            {actions.map((a, i) => (
                <button
                    // the first stays the same element as the action changes, so focus stays on it
                    key={i === 0 ? 'primary' : 'secondary'}
                    type="button"
                    // in a list (small) every row has its button: none is filled, one filled action per view (3.6)
                    className={`btn${!small && i === 0 && (a === 'join' || a === 'ask' || a === 'accept') ? ' btn-primary' : ''}${size}`}
                    onClick={() => void run(a)}
                    aria-disabled={busy !== null || undefined}
                    aria-busy={busy === a}
                    data-membership={a}
                >
                    {actionLabel(a, kind)}
                </button>
            ))}
            {error ? (
                <p className="error small" role="alert">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
