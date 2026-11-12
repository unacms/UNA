import { type KeyboardEvent, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';

import { fallbackMenus, type MenuEntry } from '../lib/native-menu';
import { Icon } from './icon';

const popovers = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

/** Where the next type-ahead match is: the first item after `from` whose text starts with what was typed. */
export function typeAhead(texts: string[], typed: string, from: number): number {
    const t = typed.toLowerCase();
    const n = texts.length;
    for (let i = 1; i <= n; i++) {
        const at = (from + i) % n;
        if (texts[at]?.toLowerCase().startsWith(t)) return at;
    }
    return -1;
}

type Props = {
    entries: MenuEntry[];
    point: { x: number; y: number };
    /** The menu's name ("Networks"). */
    label?: string;
    /** Closed: the index of the chosen item, or null. */
    onClose: (index: number | null) => void;
};

/**
 * The menu outside the app (tests, a browser tab), an ARIA menu: arrows, Home and End move,
 * typing a letter goes to the next item starting with it, Enter or Space chooses, Esc closes and
 * focus goes back to what opened it, Tab closes. In the top layer (a manual popover), so a modal
 * dialog or a scroller never covers it.
 */
export function MenuPopover({ entries, point, label, onClose }: Props) {
    const menu = useRef<HTMLDivElement>(null);
    const typed = useRef({ text: '', at: 0 });
    const items = () => Array.from(menu.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? []);

    useLayoutEffect(() => {
        const el = menu.current;
        if (!el) return;
        if (popovers) {
            try {
                el.showPopover();
            } catch {
                // shown already
            }
        }
        const left = Math.max(8, Math.min(point.x, window.innerWidth - el.offsetWidth - 8));
        const top = point.y + el.offsetHeight > window.innerHeight - 8 ? Math.max(8, point.y - el.offsetHeight - 8) : point.y;
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        const list = items();
        (list.find((i) => i.getAttribute('aria-checked') === 'true') ?? list[0])?.focus();
    }, [point]);

    useEffect(() => {
        const onPointer = (e: PointerEvent) => {
            if (!menu.current?.contains(e.target as Node)) onClose(null);
        };
        document.addEventListener('pointerdown', onPointer, true);
        return () => document.removeEventListener('pointerdown', onPointer, true);
    }, [onClose]);

    const onKeyDown = (e: KeyboardEvent) => {
        const list = items();
        const at = list.indexOf(document.activeElement as HTMLElement);
        const move = (i: number) => list[(i + list.length) % list.length]?.focus();
        switch (e.key) {
            case 'ArrowDown':
                move(at + 1);
                break;
            case 'ArrowUp':
                move(at - 1);
                break;
            case 'Home':
                move(0);
                break;
            case 'End':
                move(list.length - 1);
                break;
            case 'Escape':
                onClose(null);
                break;
            case 'Tab':
                // Tab goes on from the button that opened the menu
                onClose(null);
                return;
            default: {
                if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey || e.key === ' ') return;
                const now = Date.now();
                typed.current.text = now - typed.current.at < 700 ? typed.current.text + e.key : e.key;
                typed.current.at = now;
                const texts = list.map((el) => el.textContent?.trim() ?? '');
                // a repeated letter cycles through the items starting with it
                const query = /^(.)\1*$/.test(typed.current.text) ? e.key : typed.current.text;
                const next = typeAhead(texts, query, query.length > 1 ? at - 1 : at);
                if (next >= 0) move(next);
                break;
            }
        }
        e.preventDefault();
        e.stopPropagation();
    };

    let index = -1;
    return (
        <div ref={menu} className="menu-popover" role="menu" aria-label={label} popover={popovers ? 'manual' : undefined} onKeyDown={onKeyDown}>
            {entries.map((entry, i) => {
                if (entry === 'separator') return <div key={i} role="separator" className="menu-separator" />;
                index++;
                const disabled = entry.enabled === false;
                return (
                    <button
                        key={i}
                        type="button"
                        role={entry.checked === undefined ? 'menuitem' : 'menuitemradio'}
                        aria-checked={entry.checked}
                        aria-disabled={disabled || undefined}
                        aria-keyshortcuts={entry.keyshortcuts}
                        className="menu-item"
                        tabIndex={-1}
                        data-index={index}
                        onClick={() => {
                            if (!disabled) onClose(i);
                        }}
                        onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                                e.preventDefault();
                                e.stopPropagation();
                                onClose(i);
                            }
                        }}
                    >
                        <span className="menu-check" aria-hidden="true">
                            {entry.checked ? <Icon name="check" size={14} /> : null}
                        </span>
                        <span className="menu-text truncate">{entry.text}</span>
                    </button>
                );
            })}
        </div>
    );
}

/** Draws the fallback menus showMenu opens outside the app. Mounted once per window. */
export function MenuHost() {
    const shown = useSyncExternalStore(
        (l) => fallbackMenus.subscribe(l),
        () => fallbackMenus.current,
    );
    if (!shown) return null;
    // a new menu is a new popover (focus, position)
    return <MenuPopover key={shown.id} entries={shown.entries} point={shown.point} label={shown.label} onClose={(i) => fallbackMenus.close(i)} />;
}
