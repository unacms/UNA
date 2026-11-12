/**
 * The window's top bar (macOS overlay title bar: under the traffic lights), as Linear and a
 * browser have it: the traffic lights' own room, the sidebar's toggle, History (places visited
 * lately in this network, a menu), Back and Forward, then the tabs (tab-strip.tsx). It stays
 * whatever the sidebar does (names, icons only, hidden), so nothing ever sits under the traffic
 * lights. The bar drags the window; its buttons and tabs don't.
 */
import { useRef, useSyncExternalStore } from 'react';

import { Icon } from '../components/icon';
import { Tooltip } from '../components/tooltip';
import { t } from '../lib/i18n';
import { showMenu, useMenuExpanded } from '../lib/native-menu';
import { useNavigation, useTabs } from '../lib/navigation';
import { dragRegion } from '../lib/platform';
import { parseRoute } from '../lib/router';
import { HistoryButtons, ToolbarButton } from './pane';
import { sidebarToggleLabel } from './sidebar';
import { TabStrip } from './tab-strip';

type Props = {
    /** The sidebar shows icons only. */
    rail: boolean;
    /** The sidebar is hidden (Cmd+Ctrl+S). */
    hidden: boolean;
    /** Names or icons only (Cmd+\), or the sidebar back when it is hidden. */
    onToggle: () => void;
};

/** What the sidebar's toggle does next. */
export function toggleLabel(rail: boolean, hidden: boolean): string {
    return hidden ? t('Show sidebar') : sidebarToggleLabel(rail);
}

/** History: the places visited lately in this network (all tabs), the newest first; one opens in the tab shown. */
function VisitedButton() {
    const tabs = useTabs();
    const { history } = useNavigation();
    const button = useRef<HTMLButtonElement>(null);
    const expanded = useMenuExpanded('visited');
    useSyncExternalStore(
        (l) => tabs?.subscribe(l) ?? (() => {}),
        () => tabs?.snapshot ?? 0,
    );
    const visited = tabs?.visited ?? [];
    const open = () => {
        const el = button.current;
        if (!el || !visited.length) return;
        void showMenu(
            visited.map((v) => ({
                text: v.title,
                run: () => {
                    const route = parseRoute(v.path);
                    if (route) history.push(route);
                },
            })),
            { anchor: el },
            { label: t('Recently visited'), owner: 'visited' },
        ).catch((e: unknown) => console.error('menu', e));
    };
    const none = !visited.length;
    return (
        <Tooltip text={t('Recently visited')} note={none ? t('nothing visited yet') : undefined}>
            <button
                ref={button}
                type="button"
                className="tb-btn"
                aria-label={t('Recently visited')}
                aria-haspopup="menu"
                aria-expanded={expanded}
                aria-disabled={none || undefined}
                onClick={open}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        open();
                    }
                }}
            >
                <Icon name="history" />
            </button>
        </Tooltip>
    );
}

export function TopBar({ rail, hidden, onToggle }: Props) {
    const tabs = useTabs();
    return (
        <header className="chrome-top" {...dragRegion}>
            <div className="chrome-lead" {...dragRegion}>
                <ToolbarButton className="sidebar-toggle" icon={hidden ? 'panel-left' : rail ? 'panel-left' : 'panel-left-close'} label={toggleLabel(rail, hidden)} commandId={hidden ? 'hide-sidebar' : 'toggle-sidebar'} onClick={onToggle} />
                {tabs ? <VisitedButton /> : null}
                <HistoryButtons />
            </div>
            {tabs ? <TabStrip /> : <div className="chrome-fill" {...dragRegion} />}
        </header>
    );
}
