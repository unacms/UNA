import { useEffect, useRef, useState } from 'react';
import { Liquid } from 'liquid-gooey';
import { useTranslation } from 'react-i18next';
import { Icon } from 'app/ui/atoms/icon';
import GooeyMenuDropdown from './gooey-menu-dropdown';
import type { GooeyMenuItem, GooeyMenuProps } from './gooey-menu.types';

/**
 * A primary "+" capsule whose actions split off it as liquid droplets (liquid-gooey, the
 * Libraries.dev gooey plus-menu). The actions fan out above the trigger in an arc; the liquid
 * draws behind crisp, real buttons, so focus rings, names and hit areas are untouched.
 *
 * Motion is the hand-tuned Libraries.dev Studio setup: 550 ms, cubic-bezier(0.34, 1.56, 0.64, 1),
 * 40 ms stagger, droplets 64 px out. With two actions they land exactly where that setup puts
 * them; more actions spread over a wider arc. Under reduced motion the library snaps instead.
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
const GAP = 8;
const TRIGGER_WIDTH = 56;
const MAX_DROPLETS = 5;
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

function GooeyDroplets({ items, label, onSelect, icon = 'Plus', secondary = false, onMore, refocus = false }: Readonly<GooeyMenuProps & { onMore: () => void; refocus?: boolean }>) {
    const { t } = useTranslation();
    const ink = secondary ? 'text-foreground' : 'text-primary-foreground';
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const firstItemRef = useRef<HTMLButtonElement>(null);
    const droplets: GooeyMenuItem[] = items.length > MAX_DROPLETS
        ? [...items.slice(0, MAX_DROPLETS - 1), { id: MORE_ID, title: t('More'), icon: 'Ellipsis' }]
        : items;
    const offsets = itemOffsets(droplets.length);

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
            setOpen(false);
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
    }, [open]);

    const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
        const opening = !open;
        setOpen(opening);
        // From the keyboard, focus moves into the opened actions.
        if (opening && event.detail === 0) requestAnimationFrame(() => firstItemRef.current?.focus());
    };

    const pick = (item: GooeyMenuItem, event: React.MouseEvent<HTMLButtonElement>) => {
        setOpen(false);
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
                fill={secondary ? 'var(--color-button-solid)' : 'var(--color-primary)'}
                className="pointer-events-none"
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
                            style={centred(ITEM)}
                        >
                            <button
                                ref={index === 0 ? firstItemRef : undefined}
                                type="button"
                                aria-label={item.title}
                                title={item.title}
                                tabIndex={open ? 0 : -1}
                                aria-hidden={!open}
                                onClick={(event) => pick(item, event)}
                                className={'flex size-11 items-center justify-center rounded-full bg-transparent ' + ink + ' '
                                    + 'outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary '
                                    + 'motion-safe:transition-opacity motion-safe:duration-200 '
                                    // Closed, the droplets sit under the trigger: their icons would show through it.
                                    + (open ? 'opacity-100 pointer-events-auto cursor-pointer' : 'opacity-0 pointer-events-none')}
                            >
                                <Icon icon={item.icon || 'Plus'} size={20} className={ink + ' pointer-events-none'} />
                            </button>
                        </Liquid.Item>
                    );
                })}
                <Liquid.Item style={centred(TRIGGER_WIDTH)}>
                    <button
                        ref={triggerRef}
                        type="button"
                        aria-label={label}
                        title={label}
                        aria-expanded={open}
                        onClick={toggle}
                        className={'pointer-events-auto flex h-11 w-14 cursor-pointer items-center justify-center rounded-full bg-transparent ' + ink + ' outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary'}
                    >
                        <span
                            className="flex motion-safe:transition-transform motion-safe:duration-300"
                            style={{ transform: open ? 'rotate(45deg)' : 'none' }}
                        >
                            <Icon icon={icon} size={22} className={ink + ' pointer-events-none'} />
                        </span>
                    </button>
                </Liquid.Item>
            </Liquid>
        </div>
    );
}
