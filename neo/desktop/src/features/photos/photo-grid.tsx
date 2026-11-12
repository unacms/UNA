import { type KeyboardEvent, type MouseEvent, useRef, useState } from 'react';

import { Icon } from '../../components/icon';
import { useMediaSrc, usePicture } from '../../lib/media';
import { isWindowGesture, isWindowKey } from '../../lib/open-in-window';
import { gridMove, type Photo, tileName, tileSrc } from './photos';

type Modifiers = { metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean };

/** How many columns the grid draws now (its CSS decides by its width); 1 where it can't be read. */
function columnsOf(el: HTMLElement | null): number {
    if (!el) return 1;
    const tracks = getComputedStyle(el).gridTemplateColumns;
    const n = tracks && tracks !== 'none' ? tracks.trim().split(/\s+/).length : 1;
    return Math.max(1, n);
}

/** One square tile: the small copy (drawn into its box before it loads), a mark for a video. */
function Tile({ photo: p, name, index, current, selected, onOpen, onFocus, onDoubleClick }: { photo: Photo; name: string; index: number; current: boolean; selected: boolean; onOpen: (m: Modifiers) => void; onFocus: () => void; onDoubleClick?: () => void }) {
    const allowed = useMediaSrc();
    const picture = usePicture(tileSrc(p.media, allowed));
    return (
        <li className="photo-tile-cell">
            <button
                type="button"
                className="photo-tile"
                data-index={index}
                tabIndex={current ? 0 : -1}
                aria-label={name}
                aria-current={selected ? 'true' : undefined}
                onClick={(e) => onOpen(e)}
                onFocus={onFocus}
                onDoubleClick={
                    onDoubleClick
                        ? (e: MouseEvent) => {
                              e.preventDefault();
                              window.getSelection()?.removeAllRanges();
                              onDoubleClick();
                          }
                        : undefined
                }
            >
                {picture.src ? <img src={picture.src} alt="" loading="lazy" decoding="async" onError={picture.onError} onLoad={picture.onLoad} /> : <Icon name={p.kind === 'video' ? 'film' : 'image'} size={20} />}
                {p.kind === 'video' ? (
                    <span className="photo-tile-mark" aria-hidden="true">
                        <Icon name="play" size={12} strong />
                    </span>
                ) : null}
                {selected ? (
                    <span className="photo-tile-check" aria-hidden="true">
                        <Icon name="check" size={12} strong />
                    </span>
                ) : null}
            </button>
        </li>
    );
}

/**
 * Photos as a grid of square tiles, one tab stop: the arrow keys move between tiles (row by row,
 * by the columns the grid draws), Home and End to a row's ends, Cmd+Home and Cmd+End (Ctrl
 * elsewhere) to the first and last; Enter, Space or a click opens one (`onOpen`), Cmd+Enter,
 * Cmd+click or a double-click in a window of its own where `onOpenWindow` is given. The tiles'
 * names are their titles, else their place in the grid; `total` is how many there are in all.
 */
export function PhotoGrid({
    items,
    label,
    total,
    ownerId,
    selectedId,
    onOpen,
    onOpenWindow,
}: {
    items: readonly Photo[];
    label: string;
    total?: number | null;
    ownerId?: string;
    selectedId?: string | null;
    onOpen: (index: number) => void;
    onOpenWindow?: (index: number) => void;
}) {
    const list = useRef<HTMLUListElement>(null);
    // the one tab stop: the tile last focused, else the open one (Tab back in lands where the reader was), else the first
    const [focused, setFocused] = useState<number | null>(null);
    const selected = selectedId ? items.findIndex((p) => p.id === selectedId) : -1;
    const current = Math.min(focused ?? (selected >= 0 ? selected : 0), Math.max(0, items.length - 1));

    const focusTile = (i: number) => {
        setFocused(i);
        list.current?.querySelector<HTMLElement>(`[data-index="${i}"]`)?.focus();
    };

    const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
        const target = e.target as HTMLElement;
        const index = Number(target.dataset.index ?? NaN);
        if (Number.isNaN(index)) return;
        if (onOpenWindow && isWindowKey(e)) {
            e.preventDefault();
            onOpenWindow(index);
            return;
        }
        const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
        const next = gridMove(e.key, index, items.length, columnsOf(list.current), { rtl, toEnds: e.metaKey || e.ctrlKey });
        if (next === null) return;
        e.preventDefault();
        focusTile(next);
    };

    return (
        <ul ref={list} className="photo-grid" aria-label={label} aria-describedby={undefined} onKeyDown={onKeyDown}>
            {items.map((p, i) => (
                <Tile
                    key={p.id}
                    photo={p}
                    index={i}
                    name={tileName(p, i, total ?? null, ownerId)}
                    current={i === current}
                    selected={selectedId === p.id}
                    onFocus={() => setFocused(i)}
                    onOpen={(m) => {
                        // WebKit focuses no button on a click: the tab stop follows what was opened
                        setFocused(i);
                        if (onOpenWindow && isWindowGesture(m)) onOpenWindow(i);
                        else onOpen(i);
                    }}
                    onDoubleClick={onOpenWindow ? () => onOpenWindow(i) : undefined}
                />
            ))}
        </ul>
    );
}
