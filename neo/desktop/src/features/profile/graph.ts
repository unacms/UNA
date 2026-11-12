/**
 * Follows and friends (API v2 `graph`): query keys, what the relation buttons offer, and how a
 * relation and its counts look right after an action, before the site's own answer replaces them.
 */
import type { QueryClient } from '@tanstack/react-query';

import type { Schema } from 'una-api';

import { t, tn } from '../../lib/i18n';
import { FRIEND_REQUESTS_KEY, requestSync } from '../../lib/sync';
import { type FeedData, feedItems } from '../feed/cache';

export type Connections = Schema<'Connections'>;
export type Relation = Schema<'Relation'>;
export type FriendStatus = Schema<'FriendStatus'>;
/** The lists a profile has (besides its posts). */
export type ConnectionList = 'friends' | 'followers' | 'following';

export const profileKey = (id: string) => ['profile', id] as const;
/** A Profile seen elsewhere (a post's author), so a profile or a new message shows the name at once. */
export const profileSummaryKey = (id: string) => ['profile-summary', id] as const;
export const connectionsKey = (id: string) => ['connections', id] as const;
export const connectionListKey = (id: string, list: ConnectionList) => ['connection-list', id, list] as const;
/** Friend requests waiting (lists and counts); the sync refetches them when the count changes. */
export { FRIEND_REQUESTS_KEY };
/** The friend requests the acting profile sent that wait for an answer (GET /me/friend-requests/sent). */
export const SENT_REQUESTS_KEY = ['friend-requests-sent'] as const;

export type GraphAction = 'follow' | 'unfollow' | 'befriend' | 'accept' | 'decline' | 'cancel' | 'unfriend';

/** Follow or Unfollow, or nothing when the site would refuse a follow. */
export function followAction(r: Relation): 'follow' | 'unfollow' | null {
    if (r.following) return 'unfollow';
    return r.can_follow ? 'follow' : null;
}

/** The friend buttons for a relation, in the order they are shown. */
export function friendActions(r: Relation): GraphAction[] {
    if (r.friends) return ['unfriend'];
    if (r.request_received) return ['accept', 'decline'];
    if (r.request_sent) return ['cancel'];
    return r.can_befriend ? ['befriend'] : [];
}

export const ACTION_LABELS: Record<GraphAction, string> = {
    follow: t('Follow'),
    unfollow: t('Unfollow'),
    befriend: t('Add friend'),
    accept: t('Accept'),
    decline: t('Decline'),
    cancel: t('Cancel request'),
    unfriend: t('Remove friend'),
};

/** The request each action makes. */
export function actionRequest(action: GraphAction): { method: 'POST' | 'DELETE'; path: '/profiles/{id}/follow' | '/profiles/{id}/friend' } {
    switch (action) {
        case 'follow':
            return { method: 'POST', path: '/profiles/{id}/follow' };
        case 'unfollow':
            return { method: 'DELETE', path: '/profiles/{id}/follow' };
        case 'befriend':
        case 'accept':
            return { method: 'POST', path: '/profiles/{id}/friend' };
        default:
            return { method: 'DELETE', path: '/profiles/{id}/friend' };
    }
}

/**
 * The relation once an action went through. A friendship comes with follows both ways, and
 * ending one ends them, as UNA does (the API says so for befriend and unfriend).
 */
export function relationAfter(r: Relation, action: GraphAction, status?: FriendStatus): Relation {
    switch (action) {
        case 'follow':
            return { ...r, following: true, can_follow: false };
        case 'unfollow':
            return { ...r, following: false, can_follow: true };
        case 'befriend':
        case 'accept':
            if (status === 'friends')
                return { ...r, friends: true, request_sent: false, request_received: false, following: true, followed_by: true, can_follow: false, can_befriend: false };
            return { ...r, request_sent: true, can_befriend: false };
        case 'decline':
        case 'cancel':
            return { ...r, request_sent: false, request_received: false, can_befriend: true };
        case 'unfriend':
            return { ...r, friends: false, request_sent: false, request_received: false, following: false, followed_by: false, can_follow: true, can_befriend: true };
    }
}

/** The profile's counts once the viewer's relation went from `before` to `after`. */
export function countsAfter(c: Connections, before: Relation, after: Relation): Connections {
    const step = (was: boolean, is: boolean) => (is === was ? 0 : is ? 1 : -1);
    return {
        ...c,
        followers: Math.max(0, c.followers + step(before.following, after.following)),
        following: Math.max(0, c.following + step(before.followed_by, after.followed_by)),
        friends: Math.max(0, c.friends + step(before.friends, after.friends)),
        viewer: after,
    };
}

/** What the live region says once an action went through. */
export function announcement(action: GraphAction, name: string, status?: FriendStatus): string {
    switch (action) {
        case 'follow':
            return t('You follow {{name}} now', { name });
        case 'unfollow':
            return t('You no longer follow {{name}}', { name });
        case 'befriend':
        case 'accept':
            return status === 'friends' ? t('You and {{name}} are friends', { name }) : t('Friend request sent to {{name}}', { name });
        case 'decline':
            return t('Friend request from {{name}} declined', { name });
        case 'cancel':
            return t('Friend request to {{name}} cancelled', { name });
        case 'unfriend':
            return t('{{name}} is no longer your friend', { name });
    }
}

/** How the profile relates to the viewer, in a few words ('' when there is nothing to say). */
export function relationSummary(r: Relation): string {
    const parts: string[] = [];
    if (r.friends) parts.push(t('Friends', { context: 'state' }));
    else if (r.request_received) parts.push(t('Wants to be your friend'));
    else if (r.request_sent) parts.push(t('Friend request sent'));
    if (r.followed_by && !r.friends) parts.push(t('Follows you'));
    return parts.join(' · ');
}

/** Count with its noun: "1 follower", "12 followers", "0 friends". */
export function countText(n: number, list: ConnectionList): string {
    if (list === 'following') return tn(n, '{{count}} following', '{{count}} following');
    return list === 'friends' ? tn(n, '{{count}} friend', '{{count}} friends') : tn(n, '{{count}} follower', '{{count}} followers');
}

/**
 * After a change between the viewer and a profile: what both profiles' counts and lists show is
 * stale, and so are the viewer's friend requests and Following feed. The feed on screen keeps
 * what is being read: its polled first page refetches now, so posts of someone just followed
 * wait behind the new posts pill; its pages refetch when next shown, or now when the feed shows
 * nothing (an empty Home next to the profile would otherwise stay empty).
 */
export function afterGraphChange(queryClient: QueryClient, profileId: string, viewerId: string): void {
    for (const id of [profileId, viewerId]) {
        void queryClient.invalidateQueries(connectionsKey(id));
        void queryClient.invalidateQueries(['connection-list', id]);
    }
    void queryClient.invalidateQueries(FRIEND_REQUESTS_KEY);
    void queryClient.invalidateQueries(SENT_REQUESTS_KEY);
    // the friend requests badge
    requestSync();
    void queryClient.invalidateQueries(['feed', 'following'], { refetchType: 'none' });
    void queryClient.invalidateQueries(['feed-head', 'following']);
    void queryClient.refetchQueries({
        queryKey: ['feed', 'following'],
        type: 'active',
        predicate: (q) => feedItems(q.state.data as FeedData | undefined).length === 0,
    });
}
