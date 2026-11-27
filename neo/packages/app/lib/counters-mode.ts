/**
 * A menu of actions' Counters (UNA: Studio > Navigation > a menu > Counters; the menu's API carries it as `counters`)
 * and what each action and the stats row show for it. No app imports, so
 * `node --test packages/app/lib/counters-mode.test.ts` runs it from the NEO root.
 *
 * - `label`: each action is its icon and its label; the stats row shows every count.
 * - `count`: each action shows its count as its label (its icon alone at 0) and pressing it acts; the stats row shows
 *   only the reactions summary (who reacted), the other counts being on their actions.
 * - `group`: each action is a group of two buttons, the action and its count (who did it); no stats row.
 */
export type CountersMode = 'label' | 'count' | 'group';

const MODES: CountersMode[] = ['label', 'count', 'group'];

/** The menu's Counters, or null when UNA sends none (an older UNA): the call site's own settings then apply. */
export function menuCountersMode(menu: { counters?: unknown } | null | undefined): CountersMode | null {
    const value = menu?.counters;
    return typeof value === 'string' && (MODES as string[]).includes(value) ? (value as CountersMode) : null;
}

/** The display flags an action molecule reads (`show_action`, `show_counter`, `show_combined`, `show_action_count`). */
export function countersModeParams(mode: CountersMode): {
    show_action: boolean;
    show_counter: boolean;
    show_combined: boolean;
    show_action_count: boolean;
} {
    return {
        show_action: true,
        show_counter: mode === 'group',
        show_combined: mode === 'group',
        show_action_count: mode === 'count',
    };
}

type StatItem = { name?: string; data?: { type?: string } | null };

/** Stats that summarise who reacted: they stay beside actions that show counts. */
const REACTION_STATS = ['reactions', 'likes', 'vote', 'votes', 'score', 'scores'];

/** Whether the stats row shows this item next to actions in `mode` (no mode: every item, as before). */
export function isStatShown(item: StatItem, mode: CountersMode | null): boolean {
    if (!mode || mode === 'label') return true;
    if (mode === 'group') return false;
    const type = item?.data?.type ?? '';
    const name = item?.name ?? '';
    return REACTION_STATS.includes(type) || ['item-vote', 'item-reaction', 'item-score'].includes(name);
}

/** What an action in `count` mode shows as its label: its count, or nothing (the icon alone) while it is 0. */
export function countLabel(count: unknown): string | false {
    const n = Number(count);
    return Number.isFinite(n) && n > 0 ? String(n) : false;
}

/** Items whose count a stats row shows: reactions, votes, scores, comments and views (not favorites, features ...). */
const COUNT_STATS = [...REACTION_STATS, 'comments', 'views'];

/** Whether a menu of actions' item is one whose count belongs in the stats row. */
export function isCountStat(item: StatItem): boolean {
    return COUNT_STATS.includes(item?.data?.type ?? '');
}
