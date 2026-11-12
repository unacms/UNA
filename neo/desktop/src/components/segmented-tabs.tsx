import { createContext, type KeyboardEvent, useContext, useLayoutEffect, useRef, useState } from 'react';

import { t } from '../lib/i18n';
import { type MenuEntry, showMenu, useMenuExpanded } from '../lib/native-menu';
import { Icon } from './icon';

type Props<T extends string> = {
    /** The tab list's accessible name, e.g. "Feeds". */
    label: string;
    values: readonly T[];
    labels: Record<T, string>;
    current: T;
    onChange: (value: T) => void;
    /** The panel the tabs control (the list under them). */
    panelId: string;
    tabId: (value: T) => string;
    /**
     * A count after a tab's name (Connections' Requests waiting): shown as a quiet pill, said as
     * part of the tab's name ("Requests, 3 waiting"); none or 0 shows nothing.
     */
    counts?: Partial<Record<T, { value: number; spoken: string }>>;
    /** An extra class on the track (a page's tabs: profile-tabs). */
    className?: string;
    /**
     * Tabs that don't fit the width of the element around them go into a More menu. Only for a
     * row whose container is as wide as the pane (a page's tabs), not one sized by its content.
     */
    fit?: boolean;
    /**
     * 'pills' (a page's tabs: profile, group, space, event): separate rounded pills in a
     * left-aligned bar with a hairline under it, as in the iOS app. The default is AppKit's
     * segmented control (a feed's tabs, a toolbar's).
     */
    look?: 'segmented' | 'pills';
};

/**
 * The look (and whether they fit the row) of the tabs inside an element that sets it: a pane's
 * tab row (shell/pane.tsx `scope`) draws a section's tabs as a page's, as pills. A tab list's own
 * `look` and `fit` win.
 */
export const TabsLookContext = createContext<{ look: 'segmented' | 'pills'; fit: boolean } | null>(null);

/** The track's padding on each side (.segmented: 2px). */
const TRACK_PAD = 4;

/**
 * Which tabs fit in `room` px, in their own order: the selected one always, then the others from
 * the start while they and the More button fit. All of them when they fit without More. `pad`
 * is the row's own padding (both sides), `gap` the room between two tabs (pills have one).
 */
export function fittingTabs<T extends string>(
    values: readonly T[],
    current: T,
    widths: ReadonlyMap<T, number>,
    moreWidth: number,
    room: number,
    { pad = TRACK_PAD, gap = 0 }: { pad?: number; gap?: number } = {},
): T[] {
    const width = (v: T) => widths.get(v) ?? 0;
    const all = values.reduce((sum, v) => sum + width(v), pad) + gap * Math.max(0, values.length - 1);
    if (all <= room) return [...values];
    // the selected tab and More, with a gap between them; each tab more brings its own gap
    let left = room - pad - moreWidth - gap - (values.includes(current) ? width(current) : 0);
    const shown = new Set<T>([current]);
    for (const v of values) {
        if (v === current) continue;
        if (width(v) + gap > left) break;
        shown.add(v);
        left -= width(v) + gap;
    }
    return values.filter((v) => shown.has(v));
}

/**
 * A segmented control as tabs: arrow keys, Home and End move between them and show that tab at
 * once (automatic activation: each list is cached, so it is quick). Tab goes from the selected
 * tab into the panel, past a More button when they don't all fit: More lists the tabs left out
 * as a menu, and the chosen one takes a place in the row (the selected tab is always shown).
 * The arrows still go through every tab, shown or not.
 */
export function SegmentedTabs<T extends string>({ label, values, labels, current, onChange, panelId, tabId, counts, className, fit: ownFit, look: ownLook }: Props<T>) {
    const around = useContext(TabsLookContext);
    const look = ownLook ?? around?.look ?? 'segmented';
    const fit = ownFit ?? around?.fit ?? false;
    const wrap = useRef<HTMLDivElement>(null);
    const measure = useRef<HTMLDivElement>(null);
    const [shown, setShown] = useState<readonly T[]>(values);
    const moreOwner = `tabs-more-${panelId}`;
    const moreOpen = useMenuExpanded(moreOwner);

    // a change of tabs, labels or counts is measured again; so is a change of the room around them
    const key = values.map((v) => `${v}:${labels[v]}:${counts?.[v]?.value ?? 0}`).join('|');
    useLayoutEffect(() => {
        const el = wrap.current;
        const host = el?.parentElement;
        if (!fit || !el || !host) return;
        const refit = () => {
            const m = measure.current;
            if (!m) return;
            const widths = new Map<T, number>();
            const cells = Array.from(m.children) as HTMLElement[];
            values.forEach((v, i) => widths.set(v, cells[i]?.getBoundingClientRect().width ?? 0));
            const more = cells[values.length]?.getBoundingClientRect().width ?? 0;
            const style = getComputedStyle(host);
            const own = getComputedStyle(el);
            const cap = own.maxWidth;
            const px = (v: string) => parseFloat(v) || 0;
            const hostRoom = host.clientWidth - px(style.paddingLeft) - px(style.paddingRight);
            const room = cap.endsWith('px') ? Math.min(hostRoom, parseFloat(cap)) : hostRoom;
            // pills: the bar's own inset and the gap between two pills (the track's 2px otherwise)
            const spacing = look === 'pills' ? { pad: px(own.paddingLeft) + px(own.paddingRight), gap: px(own.columnGap) } : undefined;
            // not laid out (a test, a hidden pane): every tab
            const next = room > 0 ? fittingTabs(values, current, widths, more, room, spacing) : [...values];
            setShown((was) => (was.length === next.length && was.every((v, i) => v === next[i]) ? was : next));
        };
        refit();
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(refit);
        observer.observe(host);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, current, fit, look]);

    const visible = fit && shown.includes(current) ? shown : values;
    const hidden = values.filter((v) => !visible.includes(v));

    const select = (v: T) => {
        onChange(v);
        const find = () => wrap.current?.querySelector<HTMLElement>(`#${CSS.escape(tabId(v))}`);
        // a tab in the row takes focus at once; one from More is drawn next frame
        const tab = find();
        if (tab) tab.focus();
        else requestAnimationFrame(() => find()?.focus());
    };

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const i = values.indexOf(current);
        let next: number;
        switch (e.key) {
            case 'ArrowRight':
                next = (i + 1) % values.length;
                break;
            case 'ArrowLeft':
                next = (i - 1 + values.length) % values.length;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = values.length - 1;
                break;
            default:
                return;
        }
        const value = values[next];
        if (value === undefined) return;
        e.preventDefault();
        select(value);
    };

    const name = (v: T) => (
        <>
            {labels[v]}
            {counts?.[v]?.value ? (
                <>
                    <span className="badge segment-count" aria-hidden="true">
                        {counts[v].value > 99 ? '99+' : counts[v].value}
                    </span>
                    <span className="sr-only">{`, ${counts[v].spoken}`}</span>
                </>
            ) : null}
        </>
    );

    const moreEntries = (): MenuEntry[] =>
        hidden.map((v) => ({
            text: counts?.[v]?.value ? `${labels[v]} (${counts[v].value > 99 ? '99+' : counts[v].value})` : labels[v],
            run: () => select(v),
        }));

    return (
        <div ref={wrap} className={`${look === 'pills' ? 'tab-pills' : 'segmented'} segmented-fit${className ? ` ${className}` : ''}`}>
            <div className="segmented-tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
                {visible.map((v) => (
                    <button
                        key={v}
                        id={tabId(v)}
                        type="button"
                        role="tab"
                        className="segment"
                        aria-selected={v === current}
                        aria-controls={panelId}
                        tabIndex={v === current ? 0 : -1}
                        onClick={() => onChange(v)}
                    >
                        {name(v)}
                    </button>
                ))}
            </div>
            {hidden.length ? (
                <button
                    type="button"
                    className="segment segment-more"
                    aria-haspopup="menu"
                    aria-expanded={moreOpen}
                    aria-label={t('More {{label}}: {{tabs}}', { label, tabs: hidden.map((v) => labels[v]).join(', ') })}
                    onClick={(e) => void showMenu(moreEntries(), { anchor: e.currentTarget }, { label: t('More {{label}}', { label }), owner: moreOwner })}
                >
                    {t('More')}
                    <Icon name="chevron-down" size={12} />
                </button>
            ) : null}
            {/* every tab's width, and More's, measured off screen */}
            {fit ? (
            <div ref={measure} className="segmented-measure" aria-hidden="true" inert>
                {values.map((v) => (
                    <span key={v} className="segment">
                        {name(v)}
                    </span>
                ))}
                <span className="segment segment-more">
                    {t('More')}
                    <Icon name="chevron-down" size={12} />
                </span>
            </div>
            ) : null}
        </div>
    );
}
