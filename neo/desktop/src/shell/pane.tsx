import { createContext, type ReactNode, type RefObject, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { ContextActionButtons, type ContextAction, HeroActionsDockedContext, HeroErrorSlotContext } from '../components/context-actions';
import { Icon } from '../components/icon';
import { TabsLookContext } from '../components/segmented-tabs';
import { SiteIcon } from '../components/site-icon';
import { Tooltip } from '../components/tooltip';
import { ownWindowTitle, showDetailTitle } from '../lib/chrome';
import { t } from '../lib/i18n';
import { isSecondaryWindow } from '../lib/native';
import { useNavigation, useRoute, useScrollMemory } from '../lib/navigation';
import { dragRegion, platform } from '../lib/platform';
import { listPath, routeToPath } from '../lib/router';
import type { ShownIcon } from '../lib/section-icons';
import { ariaKeyShortcuts, command } from '../lib/shortcuts';
import './pane-hero.css';

export type PaneName = 'list' | 'detail';

const PaneBodyContext = createContext<RefObject<HTMLDivElement | null> | null>(null);
const PaneNameContext = createContext<PaneName>('list');

/** The scrolling body of the pane around this component (a virtualized list scrolls it). */
export function usePaneBody(): RefObject<HTMLDivElement | null> {
    const body = useContext(PaneBodyContext);
    if (!body) throw new Error('usePaneBody outside a Pane');
    return body;
}

/** Which pane the component is in (a feed in the detail pane sends focus to that pane's heading). */
export function usePaneName(): PaneName {
    return useContext(PaneNameContext);
}

/**
 * The icon of the section the list pane shows (its tab's and its sidebar row's), drawn before the
 * list pane's title. The shell provides it; null draws none.
 */
/** The section's icon for a list pane's title: the sidebar's current row's (shell.tsx). */
export const SectionIconContext = createContext<ShownIcon | null>(null);

/** The id of a pane's heading: the pane's name, and where focus goes when the pane opens. */
export const paneHeadingId = (pane: PaneName) => `${pane}-title`;

type Props = {
    pane: PaneName;
    title: ReactNode;
    /**
     * The heading stays for screen readers (it names the region) but is not drawn. With
     * 'until-scrolled' (a pane with a hero: profile, group) it is drawn once the hero's name
     * (`.profile-name`) has scrolled under the toolbar, and is invisible until then; it keeps
     * its box and still takes focus.
     */
    hideTitle?: boolean | 'until-scrolled';
    /** A fact under the title the toolbar shows nowhere else ("3 unread", "128 members"). */
    subtitle?: ReactNode;
    /** Before the title; a window of its own has Back and Forward there by default. */
    leading?: ReactNode;
    /**
     * The section's tabs (Videos | Photos | Albums | Files, Following | For you | Hot): on a row
     * of their own under the title and the actions, as pills, as a page's tabs (profile, group).
     */
    scope?: ReactNode;
    actions?: ReactNode;
    /**
     * A hero pane's own commands (Join, Follow, New post ...), the same list its hero draws in
     * `.hero-actions`: once those have scrolled under the toolbar, the toolbar shows them before
     * `actions` (and the hero's copy goes inert, HeroActionsDockedContext). With labels while
     * the toolbar has room for them and the start of the title, icons with tooltips otherwise.
     */
    heroActions?: readonly ContextAction[];
    /**
     * A hero pane's picture (24px, the profile's or the context's), drawn before the title in its
     * toolbar. With it a pane that has no buttons of its own (no lead, no `actions`: a page in
     * the main window) has no toolbar while its hero is in view: the cover starts at the top, and
     * the toolbar is a bar over the content that is there only once the hero's name or its
     * actions have scrolled under it (the heading stays, for screen readers and focus). A pane
     * with its own buttons (Back and Forward in a window of its own, Close in the detail pane)
     * keeps its toolbar, with the picture before the title once that shows.
     */
    hero?: { picture: ReactNode };
    /** A page in the list pane (a profile, a group): its title names the window, as an open detail's does. */
    names?: boolean;
    /** The body does not scroll: the content has its own scroller (a conversation). */
    fixed?: boolean;
    /** Restore the remembered scroll position once this is true (the content is there). */
    ready?: boolean;
    busy?: boolean;
    children: ReactNode;
};

/**
 * One region of the window: a named section with a toolbar (which drags the window on macOS:
 * its text lets clicks through, its buttons don't drag) and a scrolling body whose position is
 * remembered per route. The toolbar gets a hairline once the body scrolls under it.
 */
/** How much of the title the toolbar keeps beside a hero's actions with labels, before they go icons only. */
export const TITLE_ROOM = 160;

/**
 * Whether a hero's actions with labels (`need` px wide) fit the toolbar: its width less its
 * padding, the two gaps between its columns, the lead, its own actions (More,
 * Close) with the gap before them, and the start of the title (up to TITLE_ROOM).
 */
export function heroActionsFit(head: HTMLElement, need: number): boolean {
    const style = getComputedStyle(head);
    const px = (v: string) => parseFloat(v) || 0;
    const width = (el: Element | null | undefined) => el?.getBoundingClientRect().width ?? 0;
    const inner = head.clientWidth - px(style.paddingLeft) - px(style.paddingRight);
    // not laid out (a test, a hidden pane): labels
    if (inner <= 0) return true;
    const actions = head.querySelector('.pane-actions');
    const copy = head.querySelector('.pane-hero-actions');
    const gap = actions ? px(getComputedStyle(actions).columnGap) : 0;
    const own = Math.max(0, width(actions) - width(copy) - (copy && copy.nextElementSibling ? gap : 0));
    const title = head.querySelector('.pane-title');
    const room = inner - 2 * px(style.columnGap) - width(head.querySelector('.pane-lead')) - own - (own ? gap : 0) - Math.min(title?.scrollWidth ?? 0, TITLE_ROOM);
    return need <= room;
}

/** A section's tabs in the pane's tab row: pills, the ones that don't fit in More. */
const SCOPE_LOOK = { look: 'pills', fit: true } as const;

/** The height of the bar over a hero pane's content (--toolbar-height), read once per pane. */
function barHeight(el: Element): number {
    return parseFloat(getComputedStyle(el).getPropertyValue('--toolbar-height')) || 52;
}

/** Whether an element's bottom is above a line; one not laid out (a hidden pane, a test) never is. */
function above(el: Element | null, line: number): boolean {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.bottom > r.top && r.bottom < line;
}

export function Pane({ pane, title, hideTitle, subtitle, leading, scope, actions, heroActions, hero, names, fixed, ready = true, busy, children }: Props) {
    const route = useRoute();
    const body = useRef<HTMLDivElement>(null);
    // The body's element as state, for what is inside it: a pane mounted with its content in
    // one commit attaches its ref after the content's layout effects ran, so a virtualized
    // list that read the ref then found no scroller, and with its data cached nothing drew it
    // again (the Notifications list stayed empty). The new value once it is there renders the
    // content again.
    const [bodyElement, setBodyElement] = useState<HTMLDivElement | null>(null);
    const setBody = useCallback((el: HTMLDivElement | null) => {
        body.current = el;
        setBodyElement(el);
    }, []);
    const bodyRef = useMemo<RefObject<HTMLDivElement | null>>(() => ({ current: bodyElement }), [bodyElement]);
    const scrollKey = fixed ? null : pane === 'list' ? listPath(route.list) : routeToPath(route);
    useScrollMemory(body, scrollKey, ready);
    const Heading = pane === 'list' ? 'h1' : 'h2';
    // a section's title has its icon in front (a page's, with a hero, has its picture)
    const sectionIcon = useContext(SectionIconContext);
    const titleIcon = pane === 'list' && !hideTitle ? sectionIcon : null;
    const id = paneHeadingId(pane);

    // The window is named after the open detail or the page shown: a window of its own by Rust,
    // which copies document.title to its title bar, its tab and the Window menu (windows.rs); the
    // main window by the shell ("Lily Carter – UNA Makers", shell.tsx).
    const name = (pane === 'detail' || names) && hideTitle !== true && typeof title === 'string' ? title : null;
    useEffect(() => {
        if (!name) return;
        if (isSecondaryWindow) {
            document.title = ownWindowTitle(name);
            return;
        }
        return showDetailTitle(name);
    }, [name]);

    // Back and Forward are the main window's top bar's (top-bar.tsx); a window of its own has them here
    const lead = leading ?? (isSecondaryWindow ? <HistoryButtons /> : null);
    // a hero page with no buttons of its own: its toolbar is a bar over the content, there only
    // once the hero's name or actions are under it
    const floating = !!hero && !fixed && !lead && !actions;

    // the scroll edge: a hairline under the toolbar only while content is under it; a hero
    // pane's title once the hero's name is under the toolbar
    const heroTitle = hideTitle === 'until-scrolled';
    const [scrolled, setScrolled] = useState(false);
    const [titleShown, setTitleShown] = useState(false);
    // a hero's actions in the toolbar once the hero's own (.hero-actions) are under it
    const head = useRef<HTMLElement>(null);
    const dockable = !fixed && !!heroActions?.length;
    const [dockedState, setDocked] = useState(false);
    // under the toolbar: a hero's errors while its actions are in the toolbar (HeroErrorSlotContext)
    const [errorSlot, setErrorSlot] = useState<HTMLDivElement | null>(null);
    const docked = dockable && dockedState;
    const dockedRef = useRef(false);
    // the place of the focused button in the copy going away, for the same one in the copy coming
    const moveFocus = useRef<number | null>(null);
    useEffect(() => {
        const el = body.current;
        if (!el || fixed) return;
        // over the content, the bar covers the body's top: what is under it is out of view
        const covered = floating ? barHeight(el) : 0;
        const onScroll = () => {
            setScrolled(el.scrollTop > 0);
            if (!heroTitle && !dockable && !dockedRef.current) return;
            const top = el.getBoundingClientRect().top + covered;
            if (heroTitle) setTitleShown(above(el.querySelector('.profile-name'), top));
            const own = dockable ? el.querySelector<HTMLElement>('.hero-actions') : null;
            const next = above(own, top);
            if (next === dockedRef.current) return;
            const from = next ? own : head.current?.querySelector('.pane-hero-actions');
            const i = from ? Array.from(from.querySelectorAll('button')).findIndex((b) => b === document.activeElement) : -1;
            moveFocus.current = i >= 0 ? i : null;
            dockedRef.current = next;
            setDocked(next);
        };
        onScroll();
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, [fixed, heroTitle, dockable, floating]);
    // focus on a copy that goes (inert, or out of the toolbar) moves to the same button in the other
    useLayoutEffect(() => {
        const i = moveFocus.current;
        if (i === null) return;
        moveFocus.current = null;
        const to = docked ? head.current?.querySelector('.pane-hero-actions') : body.current?.querySelector('.hero-actions');
        to?.querySelectorAll<HTMLElement>('button')[i]?.focus({ preventScroll: true });
    }, [docked]);

    // labels while they fit the toolbar beside the start of the title, icons otherwise; measured
    // from a copy with labels drawn off screen, again when the toolbar's width or the labels change
    const measure = useRef<HTMLDivElement>(null);
    const [iconsOnly, setIconsOnly] = useState(false);
    const labelsKey = heroActions?.map((a) => `${a.key}:${a.label}:${a.count?.text ?? ''}`).join('|') ?? '';
    useLayoutEffect(() => {
        const h = head.current;
        if (!docked || !h) return;
        const refit = () => {
            const m = measure.current;
            if (m) setIconsOnly(!heroActionsFit(h, m.getBoundingClientRect().width));
        };
        refit();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(refit);
        observer.observe(h);
        return () => observer.disconnect();
    }, [docked, labelsKey]);

    // The bar over the content is drawn while the hero's name or its actions are under it. Until
    // then it holds only the heading, out of sight (the same element throughout, so focus on it
    // stays when the bar comes, or when the pane has a toolbar of its own again: a group gone).
    const barShown = !floating || titleShown || docked;

    return (
        <section className={`pane pane-${pane}`} aria-labelledby={id} data-pane={pane} data-hero-bar={floating || undefined} aria-busy={busy || undefined}>
            <header
                ref={head}
                className={floating ? 'pane-head pane-head-floating' : 'pane-head'}
                data-bar-hidden={!barShown || undefined}
                data-scrolled={(floating && barShown) || scrolled || undefined}
                data-title-shown={(floating ? barShown : heroTitle && titleShown) || undefined}
                {...dragRegion}
            >
                {lead ? <div className="pane-lead">{lead}</div> : null}
                <div className="pane-titles">
                    <Heading id={id} className={hideTitle === true ? 'sr-only' : heroTitle ? 'pane-title pane-title-hero truncate' : 'pane-title truncate'} tabIndex={-1}>
                        {titleIcon ? (
                            <span className="pane-title-icon" aria-hidden="true">
                                <SiteIcon name={titleIcon.name} fallback={titleIcon.fallback} size={20} />
                            </span>
                        ) : null}
                        {hero ? (
                            <span className="pane-title-picture" aria-hidden="true">
                                {hero.picture}
                            </span>
                        ) : null}
                        {title}
                    </Heading>
                    {subtitle && !hideTitle ? <p className="pane-subtitle truncate">{subtitle}</p> : null}
                </div>
                {scope ? (
                    <div className="pane-scope">
                        <TabsLookContext.Provider value={SCOPE_LOOK}>{scope}</TabsLookContext.Provider>
                    </div>
                ) : null}
                {actions || docked ? (
                    <div className="pane-actions">
                        {docked && heroActions ? (
                            <div className="pane-hero-actions" data-actions data-icons={iconsOnly || undefined}>
                                <ContextActionButtons actions={heroActions} look={iconsOnly ? 'icons' : 'toolbar'} />
                            </div>
                        ) : null}
                        {actions}
                    </div>
                ) : null}
                {docked && heroActions ? (
                    <div ref={measure} className="pane-hero-measure" aria-hidden="true" inert>
                        <ContextActionButtons actions={heroActions} look="toolbar" />
                    </div>
                ) : null}
            </header>
            {docked ? <div ref={setErrorSlot} className="pane-hero-errors" /> : null}
            <div ref={setBody} className={fixed ? 'pane-body pane-body-fixed' : 'pane-body'}>
                <PaneNameContext.Provider value={pane}>
                    <HeroActionsDockedContext.Provider value={docked}>
                        <HeroErrorSlotContext.Provider value={docked ? errorSlot : null}>
                            <PaneBodyContext.Provider value={bodyRef}>{children}</PaneBodyContext.Provider>
                        </HeroErrorSlotContext.Provider>
                    </HeroActionsDockedContext.Provider>
                </PaneNameContext.Provider>
            </div>
        </section>
    );
}

/** An icon-only toolbar button with its tooltip: the label is its name, the command its keys. */
export function ToolbarButton({
    icon,
    label,
    commandId,
    note,
    disabled,
    onClick,
    className,
    large,
}: {
    icon: Parameters<typeof Icon>[0]['name'];
    label: string;
    commandId?: Parameters<typeof command>[0];
    /** Why it does nothing now: said in the tooltip and to screen readers. */
    note?: string;
    /** aria-disabled: it stays focusable and says why (note). */
    disabled?: boolean;
    onClick: () => void;
    className?: string;
    /** The window's bars' and the sidebar's size: 36px with a 20px icon (a pane's toolbar keeps 28px and 16px). */
    large?: boolean;
}) {
    const c = commandId ? command(commandId) : undefined;
    const noteId = useId();
    const why = disabled && note ? note : undefined;
    return (
        <Tooltip text={label} command={c} note={why}>
            {/* the name stays the label; why it does nothing now is its description */}
            <button
                type="button"
                className={`tb-btn${large ? ' tb-btn-lg' : ''}${className ? ` ${className}` : ''}`}
                aria-label={label}
                aria-describedby={why ? noteId : undefined}
                aria-keyshortcuts={c ? ariaKeyShortcuts(c, platform.mac) : undefined}
                aria-disabled={disabled || undefined}
                onClick={() => {
                    if (!disabled) onClick();
                }}
            >
                <Icon name={icon} size={large ? 20 : 16} />
            </button>
            {why ? (
                <span id={noteId} hidden>
                    {why}
                </span>
            ) : null}
        </Tooltip>
    );
}

/** Back and Forward through this window's history; off (but focusable, saying why) at either end. */
export function HistoryButtons({ large = false }: { large?: boolean } = {}) {
    const { history } = useNavigation();
    const back = useSyncExternalStore(
        (l) => history.subscribe(l),
        () => history.canGoBack,
    );
    const forward = useSyncExternalStore(
        (l) => history.subscribe(l),
        () => history.canGoForward,
    );
    return (
        <div className="history-buttons">
            <ToolbarButton icon="chevron-left" label={t('Back')} commandId="back" disabled={!back} note={t('nothing to go back to')} large={large} onClick={() => history.back()} />
            <ToolbarButton icon="chevron-right" label={t('Forward')} commandId="forward" disabled={!forward} note={t('nothing to go forward to')} large={large} onClick={() => history.forward()} />
        </div>
    );
}

/** Closes the detail pane (in a window of its own, the window); Esc does the same. */
export function CloseDetailButton() {
    const { closeDetail } = useNavigation();
    return <ToolbarButton icon="x" label={isSecondaryWindow ? t('Close window') : t('Close details')} commandId="close-detail" onClick={closeDetail} />;
}
