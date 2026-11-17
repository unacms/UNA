/** Day separators in a chat: messages are grouped by the reader's local day. */
import { dayLabel } from '../../lib/dates';


/** The local day of a moment, as yyyy-mm-dd. */
export function dayKey(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type ChatRow<T> = { kind: 'day'; key: string; label: string } | { kind: 'message'; message: T; continued: boolean };

/**
 * Messages (oldest first) with a separator before each new day. A message is `continued` when
 * the one before it is the same author's on the same day: its bubble then leaves out the name
 * and picture.
 */
export function withDays<T extends { created_at: string; author?: { id: string } | null }>(messages: readonly T[], now: Date = new Date()): ChatRow<T>[] {
    const rows: ChatRow<T>[] = [];
    let day: string | null = null;
    let author: string | null = null;
    for (const m of messages) {
        const key = dayKey(m.created_at);
        const by = m.author?.id ?? null;
        if (key !== day) {
            rows.push({ kind: 'day', key, label: dayLabel(m.created_at, now) });
            day = key;
            author = null;
        }
        rows.push({ kind: 'message', message: m, continued: by !== null && by === author });
        author = by;
    }
    return rows;
}
