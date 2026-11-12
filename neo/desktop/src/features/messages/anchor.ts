/**
 * Keeping a chat's place. A conversation opens at its last message; older messages load above
 * when the top comes into view, and the message on screen must not move (the scroller's
 * content grows above it, so its scrollTop has to grow by as much). WebKit has no CSS scroll
 * anchoring, so the app does it: before the older page goes in, the first message in view and
 * its distance from the scroller's top are noted; after it is drawn, scrollTop is set so that
 * message is that far from the top again.
 */

/** A message row: its id and box, in the scroller's content coordinates. */
export type RowBox = { id: string; top: number; height: number };

/** The message the reader is looking at, and how far below the scroller's top its top is. */
export type Anchor = { id: string; offset: number };

/** How near the bottom counts as at the bottom: new messages then keep the view at the end. */
export const BOTTOM_SLACK = 48;
/** How near the top the reader must be for the older messages to load. */
export const TOP_THRESHOLD = 240;

/** The first message at least partly in view (rows in order, top to bottom), or null. */
export function captureAnchor(rows: readonly RowBox[], scrollTop: number): Anchor | null {
    for (const row of rows) if (row.top + row.height > scrollTop) return { id: row.id, offset: row.top - scrollTop };
    const last = rows[rows.length - 1];
    return last ? { id: last.id, offset: last.top - scrollTop } : null;
}

/** The scrollTop that puts the anchored message back where it was, or null when it is gone. */
export function restoreScrollTop(anchor: Anchor, rows: readonly RowBox[]): number | null {
    const row = rows.find((r) => r.id === anchor.id);
    return row ? Math.max(0, row.top - anchor.offset) : null;
}

export function isAtBottom(scrollTop: number, clientHeight: number, scrollHeight: number, slack = BOTTOM_SLACK): boolean {
    return scrollHeight - (scrollTop + clientHeight) <= slack;
}

export function nearTop(scrollTop: number, threshold = TOP_THRESHOLD): boolean {
    return scrollTop <= threshold;
}

/** The message rows in a scroller (`[data-message-id]`), measured in its content coordinates. */
export function measureRows(scroller: HTMLElement): RowBox[] {
    const base = scroller.getBoundingClientRect().top - scroller.scrollTop;
    return Array.from(scroller.querySelectorAll<HTMLElement>('[data-message-id]')).map((el) => {
        const box = el.getBoundingClientRect();
        return { id: el.dataset.messageId ?? '', top: box.top - base, height: box.height };
    });
}
