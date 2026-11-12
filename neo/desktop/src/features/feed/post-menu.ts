/**
 * A post's More menu and context menu (spec 4.1): which items it has, in order. Which ones show
 * follows what the viewer may do (the item's `viewer`), never "own post": a missing permission
 * removes the item instead of greying it, and a separator with nothing on one side goes.
 */
import type { Schema } from 'una-api';

import { t } from '../../lib/i18n';
import type { MenuEntry, MenuItemEntry } from '../../lib/native-menu';

export type PostMenuItem =
    | 'open'
    | 'comment'
    | 'react'
    | 'message'
    | 'author'
    | 'copy-link'
    | 'open-in-window'
    | 'edit'
    | 'delete';

export type PostMenuFacts = {
    item: Pick<Schema<'Item'>, 'kind' | 'anonymous' | 'viewer' | 'card'>;
    /** Who is shown as its author; null for an anonymous post. */
    author: Pick<Schema<'Profile'>, 'id' | 'kind'> | null;
    /** The author is one of the viewer's own profiles. */
    mine: boolean;
    /** In the detail pane: the post is open already. */
    detail: boolean;
    /** This window can open a window of its own (the main window only). */
    canOpenWindow: boolean;
    /** The site has a reaction to give (GET /reactions has kinds). */
    canReactHere?: boolean;
};

/** The groups of items in order; separators go between the groups that are not empty. */
export function postMenuItems(f: PostMenuFacts): (PostMenuItem | 'separator')[] {
    const { item, author } = f;
    const groups: PostMenuItem[][] = [
        [
            ...(f.detail ? [] : (['open'] as const)),
            ...(item.viewer?.can_comment ? (['comment'] as const) : []),
            ...(item.viewer?.can_react && f.canReactHere !== false ? (['react'] as const) : []),
        ],
        [
            ...(author && !f.mine && author.kind === 'person' ? (['message'] as const) : []),
            ...(author && !item.anonymous ? (['author'] as const) : []),
        ],
        [
            ...(item.card.url ? (['copy-link'] as const) : []),
            ...(f.canOpenWindow && !f.detail ? (['open-in-window'] as const) : []),
        ],
        [...(item.viewer?.can_edit && item.kind === 'feed_post' ? (['edit'] as const) : []), ...(item.viewer?.can_delete ? (['delete'] as const) : [])],
    ];
    const out: (PostMenuItem | 'separator')[] = [];
    for (const g of groups) {
        if (!g.length) continue;
        if (out.length) out.push('separator');
        out.push(...g);
    }
    return out;
}

/** The menu text of each item (native menu words: title case, an ellipsis where it asks first). */
export function postMenuText(id: PostMenuItem, ctx: { authorName: string; reacted: boolean }): string {
    switch (id) {
        case 'open':
            return t('Open Post');
        case 'comment':
            return t('Comment');
        case 'react':
            return ctx.reacted ? t('Remove Reaction') : t('React');
        case 'message':
            return t('Message {{name}}', { name: ctx.authorName });
        case 'author':
            return t('Open Author');
        case 'copy-link':
            return t('Copy Link');
        case 'open-in-window':
            return t('Open in New Window');
        case 'edit':
            return t('Edit Post');
        case 'delete':
            return t('Delete Post…');
    }
}

/** The keys shown beside the items that have one (single keys work on a focused post). */
export const POST_MENU_KEYS: Partial<Record<PostMenuItem, { accelerator?: string; keyshortcuts: string }>> = {
    open: { keyshortcuts: 'Enter' },
    comment: { keyshortcuts: 'c' },
    react: { keyshortcuts: 'l' },
    author: { keyshortcuts: 'p' },
    'open-in-window': { accelerator: 'CmdOrCtrl+Enter', keyshortcuts: 'Meta+Enter' },
};

/** A reaction the menu offers: its name and its title (the item's text). */
export type PostMenuReaction = { name: string; title: string };

/**
 * The entries showMenu takes, from the items and what each one runs. With more than one kind
 * of reaction, React is the reactions themselves, a section of their own under a greyed "React"
 * heading (so a screen reader hears what "Haha" is for): each a check item named by its title,
 * the viewer's checked (choosing it takes it back), the default first. l is beside the one it
 * would do: the viewer's reaction, which l takes back, or else the default, which l gives.
 * Native menus first: popup.rs has check items and no submenus.
 */
export function postMenuEntries(
    items: (PostMenuItem | 'separator')[],
    ctx: { authorName: string; reacted: boolean; mac: boolean; reactions?: readonly PostMenuReaction[]; reaction?: string | null },
    run: (id: PostMenuItem, kind?: string) => void,
): MenuEntry[] {
    const out: MenuEntry[] = [];
    for (const id of items) {
        if (id === 'separator') {
            out.push('separator');
            continue;
        }
        const reactions = ctx.reactions ?? [];
        if (id === 'react' && reactions.length > 1) {
            out.push('separator');
            out.push({ text: postMenuText('react', { ...ctx, reacted: false }), enabled: false, run: () => {} });
            const withL = reactions.find((r) => r.name === ctx.reaction) ?? reactions[0];
            for (const r of reactions) {
                const entry: MenuItemEntry = { text: r.title, checked: r.name === ctx.reaction, run: () => run('react', r.name) };
                if (r === withL) entry.keyshortcuts = POST_MENU_KEYS.react?.keyshortcuts;
                out.push(entry);
            }
            out.push('separator');
            continue;
        }
        const keys = POST_MENU_KEYS[id];
        const entry: MenuItemEntry = { text: postMenuText(id, ctx), run: () => run(id) };
        if (keys?.accelerator) entry.accelerator = keys.accelerator;
        if (keys) entry.keyshortcuts = id === 'open-in-window' && !ctx.mac ? 'Control+Enter' : keys.keyshortcuts;
        out.push(entry);
    }
    // one separator between sections, none at the ends
    return out.filter((e, i, all) => e !== 'separator' || (i > 0 && i < all.length - 1 && all[i + 1] !== 'separator'));
}
