/**
 * Where something the API points to opens in the app: a notification (`object_kind`) or a
 * site link resolved by GET /links/resolve (`kind`). A target with no place here (`other`)
 * opens on the site instead.
 */
import type { Schema } from 'una-api';

import { type DetailRoute, profileRoute } from './router';
import { contextKindOf } from './site-modules';

export type TargetKind = Schema<'Notification'>['object_kind'] | Schema<'LinkTarget'>['kind'];

export type Target = {
    kind: TargetKind;
    id: string | null | undefined;
    /** For a comment: the Item it is on. */
    itemId?: string | null;
    /** For a reply: the top-level comment it is listed under. */
    threadId?: string | null;
    /** For a profile or a context: its module, which says which page shows it (a group, a space). */
    module?: string | null;
};

/** The detail a target opens, or null when the app has no place for it. */
export function targetRoute({ kind, id, itemId, threadId, module }: Target): DetailRoute | null {
    if (!id) return null;
    switch (kind) {
        case 'content':
            return { kind: 'post', id };
        case 'comment':
            if (!itemId) return null;
            return threadId ? { kind: 'post', id: itemId, comment: id, thread: threadId } : { kind: 'post', id: itemId, comment: id };
        case 'profile':
            // a group's profile id too (notifications say profile for both): the profile view
            // passes a group on to the group view once it knows
            return profileRoute(id);
        case 'group': {
            // a space as a space; a context the app has no page for (an event) as a profile
            const context = contextKindOf(module);
            return context ? { kind: context, id } : profileRoute(id);
        }
        case 'conversation':
            return { kind: 'conversation', id };
        case 'other':
            return null;
        default: {
            // a kind a newer site sends: open it on the site
            const unknown: never = kind;
            void unknown;
            return null;
        }
    }
}

/**
 * Where a notification opens. A comment or reply of the kinds (`social.comment`,
 * `social.reply`, `discussions.reply`) is about the Item it is on, with the new comment as
 * `data.comment_id`: it opens that comment in the post, as a comment target does.
 */
export function notificationRoute(n: Pick<Schema<'Notification'>, 'object_kind' | 'object_id' | 'item_id' | 'thread_id'> & { data?: Schema<'Notification'>['data'] }): DetailRoute | null {
    const comment = n.data?.comment_id;
    if (n.object_kind === 'content' && n.object_id && comment) return targetRoute({ kind: 'comment', id: comment, itemId: n.object_id, threadId: n.thread_id });
    return targetRoute({ kind: n.object_kind, id: n.object_id, itemId: n.item_id, threadId: n.thread_id });
}

export function linkRoute(t: Schema<'LinkTarget'>): DetailRoute | null {
    return targetRoute({ kind: t.kind, id: t.id, itemId: t.item_id, threadId: t.thread_id, module: t.module });
}

/** Whether a link is to the signed-in site (scheme aside), so GET /links/resolve may know it. */
export function isSiteLink(href: string, siteUrl: string): boolean {
    let link: URL;
    let site: URL;
    try {
        link = new URL(href);
        site = new URL(siteUrl);
    } catch {
        return false;
    }
    if (!/^https?:$/.test(link.protocol) || link.username || link.password) return false;
    const path = site.pathname.endsWith('/') ? site.pathname : `${site.pathname}/`;
    return link.host.toLowerCase() === site.host.toLowerCase() && (link.pathname === path.slice(0, -1) || link.pathname.startsWith(path));
}
