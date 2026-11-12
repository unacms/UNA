/**
 * The tabs in the top bar (lib/tabs.ts), with the ARIA tab pattern: a tablist named "Tabs", one
 * tab in the tab order (the one shown), arrow keys, Home and End move between them and show the
 * one reached; Delete closes the focused one; Option+Shift+Left and Right move it; Shift+F10 or a
 * right click opens its menu (Duplicate, Move to New Window, Close Tab, Close Other Tabs). The
 * shown tab's close button follows it in the tab order, and so does New Tab. A middle click
 * closes a tab, a drag puts it elsewhere. With many tabs they narrow to a smallest width, then
 * the strip scrolls (the shown one kept in view). The content below is the tab panel.
 */
import { type CSSProperties, type DragEvent, type KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Icon } from '../components/icon';
import { SiteIcon } from '../components/site-icon';
import { SECTION_ICONS } from '../lib/section-icons';
import { Tooltip } from '../components/tooltip';
import { useWindowAnnounce } from '../lib/announce';
import { errorMessage } from '../lib/errors';
import { t } from '../lib/i18n';
import { isContextMenuKey, showMenu } from '../lib/native-menu';
import { openWindow } from '../lib/native';
import { useActiveTab } from '../lib/navigation';
import { opensInWindow } from '../lib/open-in-window';
import { pageDetail, routeToPath, sectionRoute } from '../lib/router';
import type { Tab, TabsModel } from '../lib/tabs';
import { ToolbarButton } from './pane';

/** The id of the content the tabs control (layout.tsx draws it). */
export const TAB_PANEL_ID = 'tab-panel';

export const tabElementId = (id: string) => `tab-${id}`;

/** What a detail is called before it has loaded (a tab opened behind, with Cmd+click). */
const DETAIL_NAMES: Record<string, string> = { post: t('Post'), conversation: t('Conversation'), profile: t('Profile'), discussion: t('Discussion'), video: t('Video'), photo: t('Photo'), album: t('Album'), file: t('File'), task: t('Task'), poll: t('Poll'), article: t('Post') };

/** A section's name, for a tab the shell has not named yet. */
const SECTION_NAMES: Record<string, string> = {
    home: t('Home'),
    explore: t('Explore'),
    notifications: t('Notifications'),
    messages: t('Messages'),
    connections: t('Connections'),
    people: t('People'),
    posts: t('Posts'),
    discussions: t('Discussions'),
    events: t('Events'),
    media: t('Media'),
    tasks: t('Tasks'),
    search: t('Search'),
    profile: t('Profile'),
    groups: t('Groups'),
    spaces: t('Spaces'),
    settings: t('Settings'),
    page: t('Page'),
};

/** A tab's name: what the shell called it, else what it shows by its route. */
export function tabTitle(tab: Tab): string {
    if (tab.title) return tab.title;
    const { list, detail } = tab.history.current;
    if (detail && DETAIL_NAMES[detail.kind]) return DETAIL_NAMES[detail.kind]!;
    return SECTION_NAMES[list.section] ?? list.section.charAt(0).toUpperCase() + list.section.slice(1);
}

/** A tab's icon: the one the shell named it with (maybe a site's), else its section's. */
function TabIcon({ tab }: { tab: Tab }) {
    const fallback = SECTION_ICONS[tab.history.current.list.section] ?? 'file';
    return <SiteIcon name={tab.icon || fallback} fallback={fallback} size={16} />;
}

/** Where a tab goes in a window of its own: its detail, or the page it shows; null for a list. */
function windowRoute(tab: Tab): string | null {
    const route = tab.history.current;
    const detail = route.detail ?? pageDetail(route.list);
    return detail && opensInWindow(detail) ? routeToPath({ list: route.list, detail }) : null;
}

/** Focus a tab's element once it is drawn (after a close, a move or a new one). */
function focusTab(id: string): void {
    requestAnimationFrame(() => document.getElementById(tabElementId(id))?.focus());
}

export function tabMenu(tabs: TabsModel, tab: Tab, announce: (text: string) => void) {
    const route = windowRoute(tab);
    const many = tabs.tabs.length > 1;
    return [
        { text: t('Duplicate Tab'), run: () => void (tabs.duplicate(tab.id) ? announce(t('Duplicated {{title}}', { title: tabTitle(tab) })) : announce(t('Too many tabs open: close one first'))) },
        {
            text: t('Move Tab to New Window'),
            enabled: !!route,
            run: () => {
                if (!route) return;
                void openWindow(route).then(
                    () => {
                        if (many) tabs.close(tab.id);
                    },
                    (e: unknown) => announce(t('Could not open a window: {{reason}}', { reason: errorMessage(e) })),
                );
            },
        },
        'separator' as const,
        { text: t('Close Tab'), enabled: many, run: () => tabs.close(tab.id) },
        { text: t('Close Other Tabs'), enabled: many, run: () => tabs.closeOthers(tab.id) },
    ];
}

export function TabStrip() {
    const state = useActiveTab();
    const announce = useWindowAnnounce();
    const strip = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dropAt, setDropAt] = useState<number | null>(null);
    const activeId = state?.active.id;

    // the shown tab stays in view when the strip scrolls
    useLayoutEffect(() => {
        if (!activeId) return;
        const el = document.getElementById(tabElementId(activeId));
        el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }, [activeId]);

    // a vertical wheel scrolls the strip sideways, as browsers' tab strips do
    useEffect(() => {
        const el = strip.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return;
            el.scrollLeft += e.deltaY;
            e.preventDefault();
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    if (!state) return null;
    const { tabs, active, list } = state;
    const many = list.length > 1;

    const close = (tab: Tab) => {
        const inStrip = !!document.activeElement?.closest('.tab-strip');
        if (!tabs.close(tab.id)) return;
        announce(t('Closed {{title}}', { title: tabTitle(tab) }));
        if (inStrip) focusTab(tabs.active.id);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, tab: Tab, i: number) => {
        const move = (to: number) => {
            const next = list[(to + list.length) % list.length];
            if (!next) return;
            tabs.select(next.id);
            focusTab(next.id);
        };
        if (e.altKey && e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            e.preventDefault();
            const to = i + (e.key === 'ArrowLeft' ? -1 : 1);
            if (to < 0 || to >= list.length) return;
            tabs.move(tab.id, to);
            announce(t('{{title}}, tab {{position}} of {{total}}', { title: tabTitle(tab), position: to + 1, total: list.length }));
            focusTab(tab.id);
            return;
        }
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (isContextMenuKey(e)) {
            e.preventDefault();
            void showMenu(tabMenu(tabs, tab, announce), { anchor: e.currentTarget }, { label: tabTitle(tab) }).catch((err: unknown) => console.error('menu', err));
            return;
        }
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                move(i - 1);
                return;
            case 'ArrowRight':
                e.preventDefault();
                move(i + 1);
                return;
            case 'Home':
                e.preventDefault();
                move(0);
                return;
            case 'End':
                e.preventDefault();
                move(list.length - 1);
                return;
            case 'Delete':
            case 'Backspace':
                if (!many) return;
                e.preventDefault();
                close(tab);
                return;
        }
    };

    const dropIndex = (e: DragEvent<HTMLElement>, i: number) => {
        const r = e.currentTarget.getBoundingClientRect();
        return e.clientX < r.left + r.width / 2 ? i : i + 1;
    };

    return (
        <div className="tab-strip-wrap">
            <div ref={strip} className="tab-strip" data-many={many || undefined}>
                <div role="tablist" aria-label={t('Tabs')} className="tab-list" style={{ '--tabs': list.length } as CSSProperties}>
                    {list.map((tab, i) => {
                        const selected = tab.id === active.id;
                        const title = tabTitle(tab);
                        return (
                            // the wrapper holds the tab and its close button side by side
                            <div
                                key={tab.id}
                                role="presentation"
                                className="tab-item"
                                data-selected={selected || undefined}
                                data-dragging={dragging === tab.id || undefined}
                                data-drop={dropAt === i ? 'before' : dropAt === i + 1 && i === list.length - 1 ? 'after' : undefined}
                                onDragOver={(e) => {
                                    if (!dragging) return;
                                    e.preventDefault();
                                    setDropAt(dropIndex(e, i));
                                }}
                                onDrop={(e) => {
                                    if (!dragging) return;
                                    e.preventDefault();
                                    const at = dropIndex(e, i);
                                    const from = tabs.indexOf(dragging);
                                    tabs.move(dragging, at > from ? at - 1 : at);
                                    setDragging(null);
                                    setDropAt(null);
                                }}
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    id={tabElementId(tab.id)}
                                    className="tab"
                                    aria-selected={selected}
                                    aria-controls={selected ? TAB_PANEL_ID : undefined}
                                    tabIndex={selected ? 0 : -1}
                                    title={title}
                                    draggable
                                    onClick={() => tabs.select(tab.id)}
                                    onMouseDown={(e) => {
                                        // the middle button: no autoscroll, it closes on release
                                        if (e.button === 1) e.preventDefault();
                                    }}
                                    onAuxClick={(e) => {
                                        if (e.button !== 1 || !many) return;
                                        e.preventDefault();
                                        close(tab);
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        void showMenu(tabMenu(tabs, tab, announce), { x: e.clientX, y: e.clientY, returnFocus: e.currentTarget }, { label: title }).catch((err: unknown) => console.error('menu', err));
                                    }}
                                    onKeyDown={(e) => onKeyDown(e, tab, i)}
                                    onDragStart={(e) => {
                                        e.dataTransfer.effectAllowed = 'move';
                                        e.dataTransfer.setData('text/plain', title);
                                        setDragging(tab.id);
                                    }}
                                    onDragEnd={() => {
                                        setDragging(null);
                                        setDropAt(null);
                                    }}
                                >
                                    <TabIcon tab={tab} />
                                    <span className="tab-title truncate">{title}</span>
                                </button>
                                {many ? (
                                    <Tooltip text={t('Close {{title}}', { title })}>
                                        <button type="button" className="tab-close" aria-label={t('Close {{title}}', { title })} tabIndex={selected ? 0 : -1} onClick={() => close(tab)}>
                                            <Icon name="x" size={14} />
                                        </button>
                                    </Tooltip>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>
            <ToolbarButton
                className="tab-new"
                icon="plus"
                label={t('New tab')}
                commandId="new-tab"
                onClick={() => {
                    if (!tabs.open(sectionRoute('home'), { title: t('Home'), icon: 'house' })) announce(t('Too many tabs open: close one first'));
                }}
            />
        </div>
    );
}
