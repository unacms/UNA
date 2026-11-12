import { useQueryClient } from '@tanstack/react-query';
import { useLayoutEffect, useRef, useState } from 'react';

import type { Schema } from 'una-api';

import type { ContextAction } from '../../components/context-actions';
import type { IconName } from '../../components/icon';
import { ensureOk, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { confirmAction } from '../../lib/native';
import {
    ACTION_LABELS,
    actionRequest,
    afterGraphChange,
    announcement,
    type Connections,
    connectionsKey,
    countsAfter,
    followAction,
    friendActions,
    type FriendStatus,
    type GraphAction,
    relationAfter,
} from './graph';

type Summary = Schema<'Profile'>;

/**
 * Asks the site to change the viewer's relation to a profile, then shows the new relation in
 * every copy of the profile's connections at once (the counts are refetched after). Returns the
 * friend status a befriend answered with.
 */
export function useGraphAction(profile: Summary | undefined) {
    const { api, me } = useApp();
    const queryClient = useQueryClient();

    return async (action: GraphAction): Promise<FriendStatus | undefined> => {
        if (!profile) return undefined;
        const { method, path } = actionRequest(action);
        const params = { params: { path: { id: profile.id } } };
        let status: FriendStatus | undefined;
        if (path === '/profiles/{id}/friend') {
            if (method === 'POST') status = unwrap(await api.POST('/profiles/{id}/friend', params)).status;
            else ensureOk(await api.DELETE('/profiles/{id}/friend', params));
        } else if (method === 'POST') ensureOk(await api.POST('/profiles/{id}/follow', params));
        else ensureOk(await api.DELETE('/profiles/{id}/follow', params));

        queryClient.setQueryData<Connections>(connectionsKey(profile.id), (c) => {
            if (!c?.viewer) return c;
            return countsAfter(c, c.viewer, relationAfter(c.viewer, action, status));
        });
        afterGraphChange(queryClient, profile.id, me.active_profile_id);
        return status;
    };
}

/**
 * Follow or Unfollow, the friend buttons the relation allows (Add friend, Cancel request,
 * Accept and Decline, Remove friend) and Message, as a hero's actions (and its toolbar's copy).
 * Each slot keeps its button while its label changes, so focus stays on it; a button busy with
 * its request keeps its size and ignores presses (aria-disabled rather than disabled, which
 * would drop focus). Decline leaves one button where there were two: when the pressed one went,
 * focus goes to the first button left among those it was in (`[data-actions]`). No profile or
 * relation yet: no buttons (relationItems builds them). `error`: why the site refused the last one.
 */
export function useRelation(profile: Summary | undefined, connections: Connections | undefined, announce: (text: string) => void) {
    const { messageTo } = useApp();
    const run = useGraphAction(profile);
    const [busy, setBusy] = useState<GraphAction | null>(null);
    const [error, setError] = useState<string | null>(null);
    const busyRef = useRef(false);
    // the buttons the pressed one was among, for focus once it is gone
    const box = useRef<HTMLElement | null>(null);
    const [done, setDone] = useState(0);
    useLayoutEffect(() => {
        if (!done) return;
        const active = document.activeElement;
        if (!active || active === document.body || !active.isConnected) (box.current?.isConnected ? box.current : null)?.querySelector<HTMLElement>('button')?.focus();
    }, [done]);
    const press = async (action: GraphAction) => {
        if (busyRef.current || !profile) return;
        const name = profile.display_name;
        if (action === 'unfriend') {
            const ok = await confirmAction({
                title: t('Remove {{name}} from your friends?', { name }),
                message: t('You also stop following each other.'),
                okLabel: t('Remove friend'),
            });
            if (!ok) return;
        }
        busyRef.current = true;
        box.current = document.activeElement?.closest<HTMLElement>('[data-actions]') ?? null;
        setBusy(action);
        setError(null);
        try {
            const status = await run(action);
            announce(announcement(action, name, status));
            setDone((n) => n + 1);
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            busyRef.current = false;
            setBusy(null);
        }
    };

    return { profile, relation: connections?.viewer, busy, error, press, messageTo };
}

/** A button's accessible name: its word, then who, one sentence for each action. */
function actionName(action: GraphAction, name: string): string {
    switch (action) {
        case 'follow':
            return t('Follow {{name}}', { name });
        case 'unfollow':
            return t('Unfollow {{name}}', { name });
        case 'befriend':
            return t('Add friend {{name}}', { name });
        case 'accept':
            return t('Accept {{name}}', { name });
        case 'decline':
            return t('Decline {{name}}', { name });
        case 'cancel':
            return t('Cancel request {{name}}', { name });
        case 'unfriend':
            return t('Remove friend {{name}}', { name });
    }
}

/** The relation's buttons as a hero's actions (and its toolbar's copy): Accept, Add friend or Follow filled. */
export function relationItems({ profile, relation, busy, press, messageTo }: ReturnType<typeof useRelation>): ContextAction[] {
    if (!profile || !relation) return [];
    const follow = followAction(relation);
    const friends = friendActions(relation);
    const name = profile.display_name;
    // one filled button (spec 6.2): the relation's main step, Accept before Add friend before Follow
    const primary: GraphAction | null = friends.includes('accept') ? 'accept' : friends.includes('befriend') ? 'befriend' : follow === 'follow' ? 'follow' : null;

    const item = (slot: string, action: GraphAction): ContextAction => ({
        key: slot,
        label: ACTION_LABELS[action],
        // the visible word starts the name (WCAG 2.5.3); the rest says who
        name: actionName(action, name),
        icon: ICONS[action],
        primary: action === primary,
        busy: busy === action,
        blocked: busy !== null,
        run: () => void press(action),
    });

    const actions: ContextAction[] = [...(follow ? [item('follow', follow)] : []), ...friends.map((a, i) => item(`friend-${i}`, a))];
    if (profile.kind === 'person') actions.push({ key: 'message', label: t('Message'), name: t('Message {{name}}', { name }), icon: 'message-circle-plus', iconWithLabel: true, run: () => messageTo(profile) });
    return actions;
}

const ICONS: Record<GraphAction, IconName> = { follow: 'user-plus', unfollow: 'user-round-check', befriend: 'user-plus', accept: 'check', decline: 'x', cancel: 'x', unfriend: 'users' };
