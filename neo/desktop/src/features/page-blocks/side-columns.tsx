/**
 * A page's side column, shared by every page that has one (a section's page beside its feed,
 * a task beside its properties, the Tasks board beside its lists and counts): the cards in it,
 * as the site's design box draws a page block, the column's one width for every page with its
 * divider (lib/aside-width.ts), and the column kept in view while the page scrolls.
 */
import { type CSSProperties, type HTMLAttributes, type ReactNode, useEffect, useId, useRef, useState } from 'react';

import { ResizeHandle } from '../../components/resize-handle';
import { ASIDE_DEFAULT, ASIDE_MAIN_MIN, ASIDE_MIN, asideMax, setAsideWidth, useAsideWidth } from '../../lib/aside-width';
import { t } from '../../lib/i18n';
import { usePaneBody } from '../../shell/pane';
import { useWidth } from './page-layout';

/**
 * A card of a side column, as BlockCard draws a page block with the site's default design box:
 * the content's background inside a hairline outline with the card's corners (`bg`), the
 * block's padding (`padding`), and its title as its heading (only for screen readers when
 * `titleShown` is false). `as="aside"` makes the card a landmark named by its title.
 */
export function SideCard({
    title,
    titleShown = true,
    bg = true,
    padding = true,
    as: Tag = 'section',
    level = 2,
    className,
    children,
}: {
    title: string | null | undefined;
    titleShown?: boolean;
    bg?: boolean;
    padding?: boolean;
    as?: 'section' | 'aside';
    level?: 2 | 3;
    className?: string;
    children: ReactNode;
}) {
    const id = useId();
    const Heading = level === 3 ? 'h3' : 'h2';
    return (
        <Tag className={`page-block${className ? ` ${className}` : ''}`} data-bg={bg ? '' : undefined} data-padding={padding ? '' : undefined} aria-labelledby={title ? id : undefined}>
            {title ? (
                <Heading id={id} className={titleShown ? 'page-block-title' : 'sr-only'}>
                    {title}
                </Heading>
            ) : null}
            {children}
        </Tag>
    );
}

/**
 * The side column of a page `pageWidth` px wide (the pane's body, null while unmeasured), whose
 * padding and gap between its columns are `chrome` px: the width it is drawn at (the one width
 * of every side column, never so wide the main column has less than ASIDE_MAIN_MIN), the widest
 * its divider may make it, and the style that gives it to the grid (`--aside-width`). `wide` is
 * whether the page has room for it at all: the narrowest side column beside the narrowest main
 * column (or `wideFrom`, a page's own breakpoint).
 */
export function useSideColumn(pageWidth: number | null, chrome: number, wideFrom = ASIDE_MIN + ASIDE_MAIN_MIN + chrome) {
    const aside = useAsideWidth();
    const max = asideMax(pageWidth, chrome);
    const shown = Math.min(aside, max);
    return { wide: pageWidth === null || pageWidth >= wideFrom, shown, max, style: { '--aside-width': `${shown}px` } as CSSProperties };
}

/**
 * The divider between a page's main column and its side column, in the middle of the gap
 * (styles.css .resize-slot-aside, from the page's end padding `--side-end`): it resizes every
 * side column (setAsideWidth), by pointer, keys and its menu (ResizeHandle).
 */
export function SideDivider({ shown, max }: { shown: number; max: number }) {
    return (
        <div className="resize-slot resize-slot-aside">
            <ResizeHandle label={t('Resize side column')} value={shown} min={ASIDE_MIN} max={max} defaultValue={ASIDE_DEFAULT} onChange={setAsideWidth} edge="end" />
        </div>
    );
}

/**
 * The column beside the main one, sticky in the pane: its `top` is `offset` (0) while it fits
 * the pane's height, and the pane's height less its own (negative) when it is taller, so it
 * scrolls with the page until its end is in view and stays there.
 */
export function StickySide({ className, offset = 0, children }: { className?: string; offset?: number; children: ReactNode }) {
    const body = usePaneBody();
    const box = useRef<HTMLDivElement>(null);
    const [top, setTop] = useState(offset);
    useEffect(() => {
        const el = box.current;
        const sc = body.current;
        if (!el || !sc || typeof ResizeObserver === 'undefined') return;
        const place = () => setTop(Math.min(offset, sc.clientHeight - el.offsetHeight));
        place();
        const observer = new ResizeObserver(place);
        observer.observe(el);
        observer.observe(sc);
        return () => observer.disconnect();
    }, [body, offset]);
    return (
        <div ref={box} className={`page-side${className ? ` ${className}` : ''}`} style={{ top }}>
            {children}
        </div>
    );
}

/**
 * A page of a main column and a side column (a task and its properties, the Tasks board and
 * its lists and counts), laid out by the pane's width: with room for both, the side column
 * (`side`) beside the main one at the shared width, the divider between them and the side
 * column sticky; without, the main column alone. `children` draws the main column, told
 * whether the side column is there. `className`'s CSS gives the grid its gap and the divider
 * its place (`--side-end`); `data-columns="side"` marks the two columns.
 */
export function SideColumns({
    className,
    chrome,
    wideFrom,
    side,
    sideClassName,
    sideOffset,
    children,
    ...rest
}: Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className' | 'style'> & {
    className: string;
    chrome: number;
    wideFrom?: number;
    side: ReactNode;
    sideClassName?: string;
    sideOffset?: number;
    children: (wide: boolean) => ReactNode;
}) {
    const width = useWidth(usePaneBody());
    const { wide, shown, max, style } = useSideColumn(width, chrome, wideFrom);
    return (
        <div {...rest} className={className} data-columns={wide ? 'side' : undefined} style={wide ? style : undefined}>
            {wide ? <SideDivider shown={shown} max={max} /> : null}
            {children(wide)}
            {wide ? (
                <StickySide className={sideClassName} offset={sideOffset}>
                    {side}
                </StickySide>
            ) : null}
        </div>
    );
}
