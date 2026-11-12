import { useState } from 'react';

import { Avatar } from '../../components/avatar';
import { Icon } from '../../components/icon';
import { t } from '../../lib/i18n';
import { useNavigation, useRoute } from '../../lib/navigation';
import { isWindowGesture, isWindowKey, useOpenInWindow } from '../../lib/open-in-window';
import { CONTEXT_SECTIONS, contextDetailRoute, contextRoute, sectionRoute } from '../../lib/router';
import { useSiteModules } from '../../lib/site-modules';
import { readStored, writeStored } from '../../lib/storage';
import { CONTEXTS, type ContextKind, useMyContexts } from './groups';

const COLLAPSED_KEYS: Record<ContextKind, string> = { group: 'sidebar-groups-collapsed', space: 'sidebar-spaces-collapsed', event: 'sidebar-events-collapsed' };

function savedCollapsed(kind: ContextKind): boolean {
    return readStored(COLLAPSED_KEYS[kind]) === '1';
}

function saveCollapsed(kind: ContextKind, collapsed: boolean): void {
    writeStored(COLLAPSED_KEYS[kind], collapsed ? '1' : null);
}

export const SIDEBAR_GROUPS_LIST = 'sidebar-groups-list';
export const SIDEBAR_SPACES_LIST = 'sidebar-spaces-list';
const LIST_IDS: Record<ContextKind, string> = { group: SIDEBAR_GROUPS_LIST, space: SIDEBAR_SPACES_LIST, event: 'sidebar-events-list' };

/** What the list says of its kind, a whole sentence for each kind. */
const YOURS: Record<ContextKind, string> = { group: t('Your groups'), space: t('Your spaces'), event: t('Your events') };
const NOT_LOADED: Record<ContextKind, string> = { group: t('Could not load your groups.'), space: t('Could not load your spaces.'), event: t('Could not load your events.') };
const BROWSE: Record<ContextKind, string> = { group: t('Browse groups'), space: t('Browse spaces'), event: t('Browse events') };

/**
 * The sidebar's Groups: the groups one is in (each opens its feed and the group), and Browse
 * groups. It folds away (remembered on this computer). Not drawn on a site without groups.
 */
/** `onPicked`: a row was chosen (the overlay sidebar closes). */
export function SidebarGroups({ onPicked }: { onPicked?: () => void } = {}) {
    return <SidebarContexts kind="group" onPicked={onPicked} />;
}

/**
 * The sidebar's Groups or Spaces: the ones one is in (each opens its page; Cmd+click, Cmd+Enter
 * or a double-click: in a window of its own), and Browse. Each folds away (remembered on this
 * computer). Not drawn on a site without the module: when GET /api/v2 lists modules without it
 * (the saved list of one's spaces or groups stays unused then), Groups also when GET /me/groups
 * is 404, Spaces unless the module list names it.
 */
export function SidebarContexts({ kind, onPicked }: { kind: ContextKind; onPicked?: () => void }) {
    const contexts = useMyContexts(kind);
    const modules = useSiteModules().data;
    const route = useRoute();
    const { history } = useNavigation();
    const openInWindow = useOpenInWindow();
    const [collapsed, setCollapsed] = useState(() => savedCollapsed(kind));
    const info = CONTEXTS[kind];
    const listId = LIST_IDS[kind];
    const section = CONTEXT_SECTIONS[kind];

    // a site whose module list has no such module, a site without the module (null), or not known yet
    if (Array.isArray(modules) && !modules.some((m) => m.tag === info.tag)) return null;
    if (contexts.data === null || (contexts.data === undefined && !contexts.isError)) return null;

    const toggle = () => {
        setCollapsed(!collapsed);
        saveCollapsed(kind, !collapsed);
    };
    const inSection = route.list.section === section;

    return (
        <div className={`sidebar-groups sidebar-${section}`}>
            <h2 className="sidebar-heading">
                <button type="button" className="sidebar-disclosure" aria-expanded={!collapsed} aria-controls={listId} onClick={toggle}>
                    <span className="truncate">{info.plural}</span>
                    <span className="disclosure-chevron">
                        <Icon name="chevron-right" size={12} strong />
                    </span>
                </button>
            </h2>
            {!collapsed ? (
                <ul id={listId} className="nav-list" aria-label={YOURS[kind]}>
                    {contexts.isError ? (
                        <li className="sidebar-note">
                            <span className="error small">{NOT_LOADED[kind]}</span>{' '}
                            <button type="button" className="link-button small" onClick={() => void contexts.refetch()} aria-busy={contexts.isFetching}>
                                {t('Try again')}
                            </button>
                        </li>
                    ) : null}
                    {(contexts.data ?? []).map((g) => (
                        <li key={g.id}>
                            <button
                                type="button"
                                className="nav-item nav-group"
                                aria-current={inSection && route.list.group === g.id ? 'page' : undefined}
                                onClick={(e) => {
                                    if (openInWindow && isWindowGesture(e)) {
                                        openInWindow(contextDetailRoute(kind, g.id));
                                        return;
                                    }
                                    history.push(contextRoute(kind, g.id));
                                    onPicked?.();
                                }}
                                onDoubleClick={() => openInWindow?.(contextDetailRoute(kind, g.id))}
                                onKeyDown={(e) => {
                                    if (!openInWindow || !isWindowKey(e)) return;
                                    e.preventDefault();
                                    openInWindow(contextDetailRoute(kind, g.id));
                                }}
                            >
                                <span className="nav-icon">
                                    <Avatar profile={g} size={20} />
                                </span>
                                <span className="nav-label truncate" dir="auto">
                                    {g.display_name}
                                </span>
                            </button>
                        </li>
                    ))}
                    <li>
                        <button
                            type="button"
                            className="nav-item"
                            aria-current={inSection && !route.list.group ? 'page' : undefined}
                            onClick={() => {
                                history.push(sectionRoute(section));
                                onPicked?.();
                            }}
                        >
                            <span className="nav-icon">
                                <Icon name={kind === 'space' ? 'orbit' : 'layout-grid'} size={20} />
                            </span>
                            <span className="nav-label truncate">{BROWSE[kind]}</span>
                        </button>
                    </li>
                </ul>
            ) : null}
        </div>
    );
}
