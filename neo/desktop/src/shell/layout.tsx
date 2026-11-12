import { createContext, type CSSProperties, type ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { ResizeHandle } from '../components/resize-handle';
import { t } from '../lib/i18n';
import { isWindows } from '../lib/platform';
import { readStoredJson, writeStoredJson } from '../lib/storage';

/** Narrower than this, the sidebar is an icon rail unless Cmd+\ opens it (over the panes). */
export const FULL_SIDEBAR = '(min-width: 820px)';

/**
 * Whether a detail opening now fades in: only in a window that is shown and has focus. WebKit
 * holds a CSS animation at its first frame while the page is hidden or its window is in the
 * background (a una:// link opened with the app behind others, a locked screen), and the fade's
 * first frame is opacity 0: the detail stayed invisible, laid out and working, until the window
 * was brought forward. Without the fade it shows at once.
 */
export function detailFadesIn(doc: Pick<Document, 'visibilityState' | 'hasFocus'>): boolean {
    return doc.visibilityState === 'visible' && doc.hasFocus();
}

/** The list's and the detail's smallest widths: an open detail beside the list needs both. */
export const LIST_MIN = 340;
export const DETAIL_MIN = 420;
export const LIST_MAX = 600;
export const LIST_DEFAULT = 420;
export const SIDEBAR_MIN = isWindows ? 200 : 180;
export const SIDEBAR_MAX = 320;
export const SIDEBAR_DEFAULT = isWindows ? 240 : 220;
/**
 * Where an open detail goes, from the panes' own width: beside the content (three panes) or
 * over it (cover). With nothing open the content takes the whole width either way.
 */
export type PanesMode = 'three' | 'cover';

export function panesMode(width: number | null): PanesMode {
    // not measured (tests, the first frame): three, as a wide window has
    return width === null || width >= LIST_MIN + DETAIL_MIN ? 'three' : 'cover';
}

const PanesModeContext = createContext<PanesMode | null>(null);

/**
 * Where a detail opened now would go in this window's panes: null outside them (a screen drawn
 * on its own) and before they are measured, so the first frame of a narrow window, still
 * unmeasured, does not count as three panes.
 */
export function usePanesMode(): PanesMode | null {
    return useContext(PanesModeContext);
}

/** The list's widest beside an open detail: never so wide the detail goes under its smallest. */
export function listMax(panesWidth: number | null): number {
    return panesWidth === null ? LIST_MAX : Math.max(LIST_MIN, Math.min(LIST_MAX, panesWidth - DETAIL_MIN));
}

/**
 * The sidebar's widest: never so wide the panes (the window less the sidebar) go under the
 * three panes' 760px and switch to the cover. A window with no room for three panes even beside
 * the narrowest sidebar is in the cover whatever the width, so the limit is the usual one.
 */
export function sidebarMax(windowWidth: number): number {
    const room = windowWidth - (LIST_MIN + DETAIL_MIN);
    return room < SIDEBAR_MIN ? SIDEBAR_MAX : Math.min(SIDEBAR_MAX, room);
}

const LAYOUT_KEY = 'una-desktop-layout';
type Widths = { sidebar: number; list: number };

function savedWidths(): Widths {
    const widths = { sidebar: SIDEBAR_DEFAULT, list: LIST_DEFAULT };
    // nothing kept, or something else than widths, leaves the defaults
    const saved = (readStoredJson(LAYOUT_KEY) ?? {}) as Partial<Widths>;
    if (typeof saved.sidebar === 'number' && Number.isFinite(saved.sidebar)) widths.sidebar = Math.min(Math.max(saved.sidebar, SIDEBAR_MIN), SIDEBAR_MAX);
    if (typeof saved.list === 'number' && Number.isFinite(saved.list)) widths.list = Math.min(Math.max(saved.list, LIST_MIN), LIST_MAX);
    return widths;
}

function saveWidths(widths: Widths): void {
    writeStoredJson(LAYOUT_KEY, widths);
}

/** The sidebar: names (full), icons only (rail), names over the panes in a narrow window (overlay), or none (hidden, Cmd+Ctrl+S). */
export type SidebarMode = 'full' | 'rail' | 'overlay' | 'hidden';

type Props = {
    sidebar: ReactNode;
    list: ReactNode;
    detail: ReactNode;
    detailOpen: boolean;
    sidebarMode?: SidebarMode;
    /** The overlay sidebar closes (Esc, a click beside it). */
    onCloseOverlay?: () => void;
    /** Above the panes (the status banner: offline, or the network's API turned off). */
    banner?: ReactNode;
    /** The window's top bar (shell/top-bar.tsx): above the sidebar and the content. */
    top?: ReactNode;
    /** The window's bottom bar (shell/bottom-bar.tsx): under them. */
    bottom?: ReactNode;
    /** The tab the content belongs to: the content is that tab's panel (tab-strip.tsx). */
    tabId?: string;
    /** Over the content (the agent chat's floating panel). */
    overlay?: ReactNode;
};

/**
 * The window: the sidebar, the content pane (a list or a page) and, only while something is open
 * in it, the detail aside. With nothing open the content takes all the width beside the sidebar
 * and the detail pane is not drawn. An open detail goes beside the content, which narrows to the
 * list width its handle keeps, when the panes' own width has room for both (the sidebar can be
 * wide, narrow or an icon rail), and over it otherwise: then the content stays mounted (and keeps
 * its scroll) but is inert, so keyboard and screen reader users don't land behind the cover. The
 * sidebar and the list are resized by their handles (remembered on this computer).
 */
export function Layout({ sidebar, list, detail, detailOpen, sidebarMode = 'full', onCloseOverlay, banner, top, bottom, tabId, overlay }: Props) {
    const panes = useRef<HTMLDivElement>(null);
    const [panesWidth, setPanesWidth] = useState<number | null>(null);
    const [windowWidth, setWindowWidth] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));
    const [widths, setWidths] = useState(savedWidths);
    const mode = panesMode(panesWidth);
    // where nothing measures (tests) the panes count as three, as panesMode says
    const knownMode = panesWidth !== null || typeof ResizeObserver === 'undefined' ? mode : null;

    useLayoutEffect(() => {
        const el = panes.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const measure = () => {
            setPanesWidth(el.getBoundingClientRect().width || null);
            setWindowWidth(window.innerWidth);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const change = useCallback((which: keyof Widths, value: number) => {
        setWidths((w) => {
            const next = { ...w, [which]: value };
            saveWidths(next);
            return next;
        });
    }, []);

    // Esc closes the overlay sidebar before anything else takes it
    useEffect(() => {
        if (sidebarMode !== 'overlay' || !onCloseOverlay) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape' || document.querySelector('dialog[open]')) return;
            e.preventDefault();
            e.stopPropagation();
            onCloseOverlay();
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [sidebarMode, onCloseOverlay]);

    // whether the detail opened now fades in (decided when it opens, not while it shows)
    const [entry, setEntry] = useState({ open: detailOpen, enter: false });
    if (entry.open !== detailOpen) setEntry({ open: detailOpen, enter: detailOpen && detailFadesIn(document) });

    const resizable = sidebarMode === 'full';
    const sMax = sidebarMax(windowWidth);
    const lMax = listMax(panesWidth);
    const beside = detailOpen && mode === 'three';
    // the rail's 56px and the overlay's columns are the stylesheet's, and so is the content's
    // single column while nothing is open: an inline width would win over them
    const style = {
        ...(resizable ? { '--sidebar-width': `${Math.min(widths.sidebar, sMax)}px` } : {}),
        ...(beside ? { '--list-width': `${Math.min(widths.list, lMax)}px` } : {}),
    } as CSSProperties;

    return (
        <div className="shell" data-sidebar={sidebarMode} data-chrome={top ? '' : undefined} style={style}>
            {top}
            {sidebarMode === 'hidden' ? null : sidebar}
            {resizable ? (
                <div className="resize-slot resize-slot-sidebar">
                    <ResizeHandle label={t('Resize sidebar')} value={Math.min(widths.sidebar, sMax)} min={SIDEBAR_MIN} max={sMax} defaultValue={SIDEBAR_DEFAULT} onChange={(v) => change('sidebar', v)} />
                </div>
            ) : null}
            {sidebarMode === 'overlay' ? <div className="sidebar-scrim" aria-hidden="true" onClick={onCloseOverlay} /> : null}
            <PanesModeContext.Provider value={knownMode}>
                {/* the content: an inset, rounded container with its own scroll (each pane's body);
                    with tabs it is the shown tab's panel */}
                <main className="content" inert={sidebarMode === 'overlay'}>
                    <div
                        ref={panes}
                        className="panes"
                        data-panes={mode}
                        data-detail={detailOpen ? 'open' : 'closed'}
                        {...(tabId ? { role: 'tabpanel', id: 'tab-panel', 'aria-labelledby': `tab-${tabId}` } : {})}
                    >
                        {banner}
                        <div className="pane-slot pane-slot-list" inert={detailOpen && mode === 'cover'}>
                            {list}
                        </div>
                        {beside ? (
                            <div className="resize-slot resize-slot-list">
                                <ResizeHandle label={t('Resize list')} value={Math.min(widths.list, lMax)} min={LIST_MIN} max={lMax} defaultValue={LIST_DEFAULT} onChange={(v) => change('list', v)} />
                            </div>
                        ) : null}
                        <div className="pane-slot pane-slot-detail" hidden={!detailOpen} data-enter={entry.enter || undefined}>
                            {detailOpen ? detail : null}
                        </div>
                    </div>
                    {overlay}
                </main>
            </PanesModeContext.Provider>
            {bottom}
        </div>
    );
}
