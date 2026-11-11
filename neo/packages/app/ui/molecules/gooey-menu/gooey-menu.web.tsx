import { useCallback, useEffect, useRef, useState } from 'react';
import { Liquid } from 'liquid-gooey';
import { useTranslation } from 'react-i18next';
import { NeoButtonRef } from 'app/design/controls';
import GooeyMenuDropdown from './gooey-menu-dropdown';
import type { GooeyMenuItem, GooeyMenuProps } from './gooey-menu.types';

/**
 * A round glass "+" whose actions split off it as liquid droplets (liquid-gooey, the
 * Libraries.dev gooey plus-menu). The actions fan out above the trigger in an arc. Trigger and
 * actions are glass NeoButton circles. The liquid (the popover surface) shows only while they
 * move, as the bridge that stretches and snaps between them: the goo filter can only draw an
 * opaque blob, which at rest would fill the glass in. Under reduced motion it never shows.
 *
 * Motion is the hand-tuned Libraries.dev Studio setup: 550 ms, cubic-bezier(0.34, 1.56, 0.64, 1),
 * 40 ms stagger, droplets 64 px out. With two actions they land exactly where that setup puts
 * them; more actions spread over a wider arc, GAP apart so neighbours never bridge once open.
 * Under reduced motion the library snaps instead.
 * At most MAX_DROPLETS droplets: with more actions, the last droplet is "More", which hands over
 * to the whole list as the regular dropdown under the same trigger.
 *
 * A disclosure: the trigger says whether it is open, Escape or a press outside closes it and
 * hands focus back. Closed actions sit under the trigger, hidden from pointer, keyboard and
 * assistive tech.
 */

const TRANSITION = { duration: 550, ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)' };
const STAGGER_MS = 40;
/** Droplet size (44 px: the touch target) and the gap kept between neighbours on the arc. */
const ITEM = 44;
const GAP = 24;
const TRIGGER_WIDTH = ITEM;
const MAX_DROPLETS = 4;
const MORE_ID = '__gooey_more__';

/** Where each action lands, relative to the trigger's centre. */
function itemOffsets(count: number): { x: number; y: number }[] {
    if (count === 1) return [{ x: 0, y: -64 }];
    if (count === 2) return [{ x: -54, y: -34 }, { x: 0, y: -64 }];
    // An arc over the trigger from 160° to 20°, wide enough that neighbours keep GAP between them.
    const from = (160 * Math.PI) / 180;
    const to = (20 * Math.PI) / 180;
    const step = (from - to) / (count - 1);
    const radius = Math.max(64, Math.ceil((ITEM + GAP) / (2 * Math.sin(step / 2))));
    return Array.from({ length: count }, (_, index) => {
        const angle = from - step * index;
        return { x: Math.round(Math.cos(angle) * radius), y: -Math.round(Math.sin(angle) * radius) };
    });
}

export default function GooeyMenu(props: Readonly<GooeyMenuProps>) {
    const [list, setList] = useState(false);
    // The dropdown and its trigger go when the list closes: the droplets' trigger, mounted again,
    // takes the focus back (Escape from the list) unless something else took it (a form dialog).
    const [refocus, setRefocus] = useState(false);
    if (list) {
        return <GooeyMenuDropdown {...props} defaultOpen onOpenChange={(isOpen) => { if (!isOpen) { setList(false); setRefocus(true); } }} />;
    }
    // After the press is done: the list mounting during it would take the same click as a press outside.
    return <GooeyDroplets {...props} refocus={refocus} onMore={() => setTimeout(() => setList(true), 0)} />;
}

function GooeyDroplets({ items, label, onSelect, icon = 'Plus', onMore, refocus = false }: Readonly<GooeyMenuProps & { onMore: () => void; refocus?: boolean }>) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    // The liquid shows while droplets travel (the transition, its stagger and a little settling).
    const [moving, setMoving] = useState(false);
    const movingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLElement>(null);
    const firstItemRef = useRef<HTMLElement>(null);
    const droplets: GooeyMenuItem[] = items.length > MAX_DROPLETS
        ? [...items.slice(0, MAX_DROPLETS - 1), { id: MORE_ID, title: t('More'), icon: 'Ellipsis' }]
        : items;
    const offsets = itemOffsets(droplets.length);
    const travelMs = TRANSITION.duration + STAGGER_MS * Math.max(0, droplets.length - 1) + 80;
    // Open or close, with the liquid shown for the travel.
    const changeOpen = useCallback((next: boolean) => {
        setOpen(next);
        setMoving(true);
        if (movingTimer.current) clearTimeout(movingTimer.current);
        movingTimer.current = setTimeout(() => setMoving(false), travelMs);
    }, [travelMs]);
    useEffect(() => () => {
        if (movingTimer.current) clearTimeout(movingTimer.current);
    }, []);

    // The liquid group spans the whole open footprint (the library needs its items' travel
    // inside it) but takes no room in the page: only the trigger does.
    const reachX = Math.max(TRIGGER_WIDTH / 2, ...offsets.map((o) => Math.abs(o.x) + ITEM / 2));
    const reachY = Math.max(...offsets.map((o) => -o.y + ITEM / 2), ITEM / 2);
    const width = reachX * 2;
    const height = reachY + ITEM / 2;

    useEffect(() => {
        if (!refocus) return undefined;
        const frame = requestAnimationFrame(() => {
            const active = document.activeElement;
            if (!active || active === document.body) triggerRef.current?.focus();
        });
        return () => cancelAnimationFrame(frame);
    }, [refocus]);

    useEffect(() => {
        if (!open) return undefined;
        const close = (focusTrigger: boolean) => {
            changeOpen(false);
            if (focusTrigger) triggerRef.current?.focus();
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close(true);
        };
        const onPointer = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) close(false);
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointer);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onPointer);
        };
    }, [open, changeOpen]);

    const toggle = (event?: any) => {
        const opening = !open;
        changeOpen(opening);
        // From the keyboard (a click with no pointer), focus moves into the opened actions.
        if (opening && !event?.nativeEvent?.detail) requestAnimationFrame(() => firstItemRef.current?.focus());
    };

    const pick = (item: GooeyMenuItem, event?: unknown) => {
        changeOpen(false);
        if (item.id === MORE_ID) onMore();
        else onSelect(item, event);
    };

    const centred = (size: number): React.CSSProperties => ({
        position: 'absolute',
        left: width / 2 - size / 2,
        top: reachY - ITEM / 2,
    });

    return (
        <div ref={rootRef} className="relative" style={{ width: TRIGGER_WIDTH, height: ITEM }}>
            <Liquid
                fill="var(--color-popover)"
                className={'pointer-events-none [&_[data-gooey-svg]]:transition-opacity [&_[data-gooey-svg]]:duration-150 '
                    + 'motion-reduce:[&_[data-gooey-svg]]:opacity-0 '
                    + (moving ? '[&_[data-gooey-svg]]:opacity-100' : '[&_[data-gooey-svg]]:opacity-0')}
                style={{ position: 'absolute', width, height, left: TRIGGER_WIDTH / 2 - width / 2, top: ITEM - height }}
            >
                {droplets.map((item, index) => {
                    const offset = offsets[index] ?? { x: 0, y: 0 };
                    return (
                        <Liquid.Item
                            key={item.id}
                            x={open ? offset.x : 0}
                            y={open ? offset.y : 0}
                            transition={TRANSITION}
                            delay={index * STAGGER_MS}
                            radius={ITEM / 2}
                            style={centred(ITEM)}
                        >
                            {/* Closed, the actions sit under the trigger: inert (no pointer, focus or name) and
                                invisible, or their icons would show through it. */}
                            <div
                                inert={!open}
                                className={'size-11 rounded-full motion-safe:transition-opacity motion-safe:duration-200 '
                                    + (open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}
                            >
                                <NeoButtonRef
                                    ref={index === 0 ? firstItemRef : undefined}
                                    style="glass"
                                    borderShape="circle"
                                    controlSize="regular"
                                    image={item.icon || 'Plus'}
                                    accessibilityLabel={item.title}
                                    tooltip={item.title}
                                    onPress={(event?: unknown) => pick(item, event)}
                                />
                            </div>
                        </Liquid.Item>
                    );
                })}
                <Liquid.Item radius={ITEM / 2} style={centred(TRIGGER_WIDTH)}>
                    <div
                        className="size-11 rounded-full pointer-events-auto motion-safe:transition-transform motion-safe:duration-300"
                        style={{ transform: open ? 'rotate(45deg)' : 'none' }}
                    >
                        <NeoButtonRef
                            ref={triggerRef}
                            style="glass"
                            borderShape="circle"
                            controlSize="regular"
                            image={icon}
                            accessibilityLabel={label}
                            tooltip={label}
                            aria-expanded={open}
                            onPress={toggle}
                        />
                    </div>
                </Liquid.Item>
            </Liquid>
        </div>
    );
}
