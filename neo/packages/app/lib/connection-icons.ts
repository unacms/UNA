/**
 * Icons of a connection toggle (friends, follow, membership: `connections_ext`), the same ones UNA's site draws
 * (BxBaseConnectionFriend / BxBaseConnectionSubscription / BxBaseModGroupsConnectionFans `_getActionIconAsIcon`; here
 * `social_actions.connection_ext`).
 * The button shows its state: `add` before the connection (Add friend, Follow) and `default` once it is made or asked
 * for (Request sent, Friends, Following). Each row of the button's menu shows its action: `remove` for Cancel request,
 * Unfriend, Reject and Unfollow, `add` for Confirm.
 */
export type ConnectionIcons = Record<string, string | undefined>;

export type ConnectionAction = { name?: string; title?: string; icon?: string; [key: string]: unknown };

/**
 * The button's icon. An older UNA names the following state `remove`, its menu's action: a button that opens a menu
 * is in a made state, so it takes `default` there when the set has one.
 */
export function connectionButtonIcon(icons: ConnectionIcons | null | undefined, name: unknown, hasMenu = false): string | undefined {
    if (!icons) return undefined;
    const state = typeof name === 'string' ? name : '';
    if (hasMenu && (state === 'remove' || state === '') && icons.default) return icons.default;
    return icons[state] || undefined;
}

/** The menu's rows with their actions' icons; a row that brings its own keeps it. */
export function withConnectionRowIcons<T extends ConnectionAction>(
    actions: readonly T[] | null | undefined,
    icons: ConnectionIcons | null | undefined,
): Array<T & { icon?: string }> {
    if (!Array.isArray(actions)) return [];
    return actions.map((action) => {
        const icon = action.icon || (action.name ? icons?.[action.name] : undefined);
        return icon ? { ...action, icon } : action;
    });
}

export type ConnectionIconSettings = Record<string, unknown> | null | undefined;

function iconsOf(entry: unknown): ConnectionIcons | undefined {
    const icons = (entry as { icons?: unknown } | null | undefined)?.icons;
    return icons && typeof icons === 'object' ? (icons as ConnectionIcons) : undefined;
}

/**
 * The icon set of a connection object out of `social_actions.connection_ext`: its own entry, else `fans` for a
 * membership (`bx_groups_fans`, `bx_spaces_fans`, a module NEO has no entry for), else `fallback`.
 */
export function connectionIconSet(
    settings: ConnectionIconSettings,
    object: unknown,
    fallback: ConnectionIcons = {},
): ConnectionIcons {
    const name = typeof object === 'string' ? object : '';
    if (!name || !settings) return fallback;
    return iconsOf(settings[name]) ?? (name.endsWith('_fans') ? iconsOf(settings.fans) : undefined) ?? fallback;
}
