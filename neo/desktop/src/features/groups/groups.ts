/**
 * Groups, spaces and events, the contexts the app has pages for (GET /me/groups, /groups,
 * /groups/{id}, and the same under /spaces; /events/{id}): the query keys, what each kind is
 * called, the words for a context's privacy and the viewer's membership, and what Join, Leave
 * and the others do. A space is a group with a place in a tree (`parent_id`, its subspaces); an
 * event is one with a time and a place (`event`, features/events), whose members are going to
 * it. The pages, lists and buttons are the same, through the kind's own paths.
 */
import { type QueryClient, useQuery } from '@tanstack/react-query';

import type { Schema, UnaApi } from 'una-api';

import type { IconName } from '../../components/icon';
import { ApiError, ensureOk, unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { t, tn } from '../../lib/i18n';
import type { ContextPageKind } from '../../lib/router';
import { contextKindOf, siteHasTag, useSiteHasTag } from '../../lib/site-modules';
import { type Event, fetchAttendees, fetchEventContext, rsvpEvent, rsvpStatus, withdrawRsvp } from '../events/events';

export type Group = Schema<'Group'>;
export type GroupViewer = Schema<'GroupViewer'>;
export type Space = Schema<'Space'>;
/** A context as its page shows it: a group, a space with its place in the tree, or an event with the Event itself. */
export type Context = Group & Partial<Pick<Space, 'parent_id' | 'child_count'>> & { event?: Event };
export type ContextKind = ContextPageKind;

/** What a kind of context is called and where its things are. */
export type ContextInfo = {
    kind: ContextKind;
    /** The tag of its module in GET /api/v2 `modules`. */
    tag: string;
    noun: string;
    title: string;
    plural: string;
    /** The sidebar's heading and the list's title. */
    icon: IconName;
};

export const CONTEXTS: Record<ContextKind, ContextInfo> = {
    group: { kind: 'group', tag: 'groups', noun: t('group'), title: t('Group'), plural: t('Groups'), icon: 'users-round' },
    space: { kind: 'space', tag: 'spaces', noun: t('space'), title: t('Space'), plural: t('Spaces'), icon: 'orbit' },
    event: { kind: 'event', tag: 'events', noun: t('event'), title: t('Event'), plural: t('Events'), icon: 'calendar' },
};

/** The kind of page a context opens in (by its module, GET /api/v2 `modules`), group by default. */
export function contextKind(context: Pick<Group, 'module'> | null | undefined): ContextKind {
    return contextKindOf(context?.module) ?? 'group';
}

/**
 * The kind of page a context the API answered with belongs in: by its module once the site's
 * module list is known (null for one with no page here), else by its shape (only an event's has
 * `event`, only a Space has `child_count`).
 */
export function answeredKind(context: Context): ContextKind | null {
    if (siteHasTag(CONTEXTS.group.tag) !== null) return contextKindOf(context.module);
    if (context.event) return 'event';
    return typeof context.child_count === 'number' ? 'space' : 'group';
}

/** The groups the acting profile is in; null on a site without the Groups module. */
export const MY_GROUPS_KEY = ['my-groups'] as const;
/** The spaces the acting profile is in; null on a site without the Spaces module. */
export const MY_SPACES_KEY = ['my-spaces'] as const;
/** Pages of GET /groups. */
export const BROWSE_GROUPS_KEY = ['groups', 'browse'] as const;
/** Pages of GET /spaces?top_level=true. */
export const BROWSE_SPACES_KEY = ['spaces', 'browse'] as const;
export const myContextsKey = (kind: ContextKind) => (kind === 'space' ? MY_SPACES_KEY : MY_GROUPS_KEY);
export const browseContextsKey = (kind: ContextKind) => (kind === 'space' ? BROWSE_SPACES_KEY : BROWSE_GROUPS_KEY);
/** A group or a space: profile ids are the site's, so one key holds either. */
export const groupKey = (id: string) => ['group', id] as const;
export const subspacesKey = (id: string) => ['subspaces', id] as const;
export const groupMembersKey = (id: string) => ['group-members', id] as const;
/** A group's feed is its profile's timeline, the same pages a profile's posts are. */
export const groupFeedKey = (id: string) => ['feed', 'profile', id] as const;

/** GET /groups/{id}: what GroupView shows, and what is read again after joining or leaving. */
export async function fetchGroup(api: UnaApi, id: string): Promise<Group> {
    return unwrap(await api.GET('/groups/{id}', { params: { path: { id } } }));
}

/** GET /groups/{id}, /spaces/{id} or /events/{id}, as the kind says. */
export async function fetchContext(api: UnaApi, kind: ContextKind, id: string): Promise<Context> {
    if (kind === 'space') return unwrap(await api.GET('/spaces/{id}', { params: { path: { id } } }));
    if (kind === 'event') return fetchEventContext(api, id);
    return fetchGroup(api, id);
}

/**
 * A context known only by its id (a post's `context_id`, or a context profile opened before the
 * site's module list says its module): a group, else a space, else an event, each tried unless
 * the site's list says it has no such module. A 404 from all is the group's.
 */
export async function fetchAnyContext(api: UnaApi, id: string): Promise<Context> {
    let first: unknown = null;
    for (const kind of ['group', 'space', 'event'] as const) {
        if (kind !== 'group' && siteHasTag(CONTEXTS[kind].tag) === false) continue;
        try {
            return await fetchContext(api, kind, id);
        } catch (e) {
            if (!(e instanceof ApiError && e.status === 404)) throw e;
            first ??= e;
        }
    }
    throw first;
}

/** Join, ask to join or accept: POST of the kind's membership path. An empty JoinRequest: the body is sent, v2 takes it. */
export async function joinContext(api: UnaApi, kind: ContextKind, id: string): Promise<Schema<'MemberStatus'>> {
    // going to an event is being in it
    if (kind === 'event') return rsvpStatus(await rsvpEvent(api, id));
    const params = { params: { path: { id } }, body: {} };
    return unwrap(kind === 'space' ? await api.POST('/spaces/{id}/membership', params) : await api.POST('/groups/{id}/membership', params)).status;
}

/** Leave, withdraw or decline: DELETE of the kind's membership path. */
export async function leaveContext(api: UnaApi, kind: ContextKind, id: string): Promise<void> {
    if (kind === 'event') return withdrawRsvp(api, id);
    const params = { params: { path: { id } } };
    ensureOk(kind === 'space' ? await api.DELETE('/spaces/{id}/membership', params) : await api.DELETE('/groups/{id}/membership', params));
}

/** A page of a context's members. */
export async function fetchMembers(api: UnaApi, kind: ContextKind, id: string, cursor: string | undefined, limit: number): Promise<Schema<'Page_Member'>> {
    // an event's are who is going, the first to answer first
    if (kind === 'event') return fetchAttendees(api, id, cursor, limit);
    const params = { params: { path: { id }, query: { cursor, limit } } };
    return unwrap(kind === 'space' ? await api.GET('/spaces/{id}/members', params) : await api.GET('/groups/{id}/members', params));
}

/** The spaces the acting profile is in, as the sidebar lists them; null on a site without Spaces. */
export function useMySpaces() {
    const { api } = useApp();
    const has = useSiteHasTag('spaces');
    return useQuery({
        queryKey: MY_SPACES_KEY,
        queryFn: async (): Promise<Space[] | null> => {
            try {
                return unwrap(await api.GET('/me/spaces'));
            } catch (e) {
                if (e instanceof ApiError && e.status === 404) return null;
                throw e;
            }
        },
        // asked only once the site says it has Spaces
        enabled: has === true,
        staleTime: 60_000,
    });
}

/** The contexts of a kind the acting profile is in. */
export function useMyContexts(kind: ContextKind) {
    const groups = useMyGroups();
    const spaces = useMySpaces();
    return kind === 'space' ? spaces : groups;
}

/**
 * The acting profile's groups, most recently joined first. Null (no error) on a site without
 * the Groups module, whose API has no such path, so Refresh does not fail on it.
 */
export function useMyGroups() {
    const { api } = useApp();
    return useQuery({
        queryKey: MY_GROUPS_KEY,
        queryFn: async (): Promise<Group[] | null> => {
            try {
                // a plain array: the site's most recent memberships
                return unwrap(await api.GET('/me/groups'));
            } catch (e) {
                if (e instanceof ApiError && e.status === 404) return null;
                throw e;
            }
        },
        staleTime: 60_000,
    });
}

/** The groups a feed post can go into: those the site says the viewer may post in. */
export function postableGroups(groups: readonly Group[] | null | undefined): Group[] {
    return (groups ?? []).filter((g) => g.viewer?.can_post);
}

const VISIBILITY: Record<Schema<'GroupVisibility'>, string> = {
    public: t('Public group'),
    members: t('Group for members'),
    closed: t('Closed group'),
    secret: t('Secret group'),
    context: t('Group'),
    other: t('Group'),
};

export function visibilityText(v: Schema<'GroupVisibility'>, kind: ContextKind = 'group'): string {
    if (kind === 'space') return SPACE_VISIBILITY[v] ?? t('Space');
    if (kind === 'event') return EVENT_VISIBILITY[v] ?? t('Event');
    return VISIBILITY[v] ?? t('Group');
}

const EVENT_VISIBILITY: Record<Schema<'GroupVisibility'>, string> = {
    public: t('Public event'),
    members: t('Event for members'),
    closed: t('Closed event'),
    secret: t('Secret event'),
    context: t('Event'),
    other: t('Event'),
};

const SPACE_VISIBILITY: Record<Schema<'GroupVisibility'>, string> = {
    public: t('Public space'),
    members: t('Space for members'),
    closed: t('Closed space'),
    secret: t('Secret space'),
    context: t('Space'),
    other: t('Space'),
};

/** "3 subspaces", "1 subspace". */
export function subspacesText(n: number): string {
    return tn(n, '{{count}} subspace', '{{count}} subspaces');
}

export function membersText(n: number): string {
    return tn(n, '{{count}} member', '{{count}} members');
}

const ROLE_TEXT: Record<Schema<'GroupRole'>, string> = { owner: t('Owner'), admin: t('Admin'), moderator: t('Moderator'), member: t('Member') };

/** The viewer's place in the group in a word or two, or '' for none. */
export function membershipText(viewer: GroupViewer | null | undefined): string {
    if (!viewer) return '';
    switch (viewer.status) {
        case 'active':
            return viewer.role ? ROLE_TEXT[viewer.role] : t('Member');
        case 'pending':
            return t('Request sent');
        case 'invited':
            return t('Invited');
        default:
            return '';
    }
}

export type MembershipAction = 'join' | 'ask' | 'accept' | 'decline' | 'cancel' | 'leave';

export const ACTION_LABELS: Record<MembershipAction, string> = {
    join: t('Join'),
    ask: t('Ask to join'),
    accept: t('Accept invitation'),
    decline: t('Decline'),
    cancel: t('Cancel request'),
    leave: t('Leave group'),
};

const EVENT_LABELS: Partial<Record<MembershipAction, string>> = { join: t('Going', { context: 'action' }), ask: t('Ask to go'), leave: t('Not going') };

/** A button's words for a kind of context: Leave group, Leave space; an event's Going, Ask to go, Not going. */
export function actionLabel(action: MembershipAction, kind: ContextKind = 'group'): string {
    if (kind === 'event') return EVENT_LABELS[action] ?? ACTION_LABELS[action];
    return action === 'leave' && kind === 'space' ? t('Leave space') : ACTION_LABELS[action];
}

/**
 * What the viewer can do about the membership, the main action first: as the API says
 * (`can_join`, `can_leave`). Nothing for guests and where joining needs the site.
 */
export function membershipActions(group: Pick<Group, 'join_policy' | 'viewer'>): MembershipAction[] {
    const v = group.viewer;
    if (!v) return [];
    switch (v.status) {
        case 'none':
            return v.can_join ? [group.join_policy === 'approval' ? 'ask' : 'join'] : [];
        case 'invited':
            return [...(v.can_join ? (['accept'] as const) : []), ...(v.can_leave ? (['decline'] as const) : [])];
        case 'pending':
            return v.can_leave ? ['cancel'] : [];
        case 'active':
            return v.can_leave ? ['leave'] : [];
    }
}

/** POST (join, ask, accept) or DELETE (the others) /groups/{id}/membership. */
export function actionMethod(action: MembershipAction): 'POST' | 'DELETE' {
    return action === 'join' || action === 'ask' || action === 'accept' ? 'POST' : 'DELETE';
}

/** What is said once the site took it; `status` is the JoinResult of a POST. */
export function actionAnnouncement(action: MembershipAction, name: string, status?: Schema<'MemberStatus'>, kind: ContextKind = 'group'): string {
    if (kind === 'event' && actionMethod(action) === 'POST') return status === 'pending' ? t('Asked to go to {{name}}. Its organisers decide.', { name }) : t('You’re going to {{name}}', { name });
    if (kind === 'event' && action === 'leave') return t('You’re not going to {{name}}', { name });
    if (actionMethod(action) === 'POST')
        return status === 'pending' ? t('Asked to join {{name}}. Its admins decide.', { name }) : t('You joined {{name}}', { name });
    switch (action) {
        case 'decline':
            return t('Invitation to {{name}} declined', { name });
        case 'cancel':
            return t('Request to join {{name}} withdrawn', { name });
        default:
            return t('You left {{name}}', { name });
    }
}

/**
 * After joining or leaving: everything that shows the group or depends on the membership (one's
 * groups, the browse list, the members, the group's feed, which a closed group shows only to
 * members, and where one can post) loads again. `gone`: the group can no longer be seen (a
 * secret one just left), so its members and feed are forgotten rather than asked for again.
 */
export async function afterMembershipChange(queryClient: QueryClient, id: string, opts: { gone?: boolean } = {}): Promise<void> {
    if (opts.gone) {
        queryClient.removeQueries({ queryKey: groupMembersKey(id) });
        queryClient.removeQueries({ queryKey: groupFeedKey(id) });
    }
    await Promise.all([
        // groups and spaces alike: the lists of the other kind only load again if shown
        queryClient.invalidateQueries({ queryKey: MY_GROUPS_KEY }),
        queryClient.invalidateQueries({ queryKey: BROWSE_GROUPS_KEY }),
        queryClient.invalidateQueries({ queryKey: MY_SPACES_KEY }),
        queryClient.invalidateQueries({ queryKey: BROWSE_SPACES_KEY }),
        queryClient.invalidateQueries({ queryKey: ['subspaces'] }),
        // the Events section's lists and the contexts' Events tabs
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        ...(opts.gone
            ? []
            : [queryClient.invalidateQueries({ queryKey: groupMembersKey(id) }), queryClient.invalidateQueries({ queryKey: groupFeedKey(id) })]),
        // the home feeds follow the groups one is in
        queryClient.invalidateQueries({ queryKey: ['feed', 'following'], refetchType: 'none' }),
    ]);
}
