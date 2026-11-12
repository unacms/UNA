/**
 * The messages of an open conversation, as the cache keeps them. The API pages newest first
 * (GET /conversations/{id}/messages): the first page is the newest replies, `next_cursor` the
 * ones before. A poll asks for the first page only and merges it on top, so pages loaded
 * further back stay, and replies that came meanwhile never open a gap between pages (a
 * refetch of every page would: each page's cursor is where the old one ended).
 */
import type { Schema } from 'una-api';

export type Message = Schema<'Message'>;
export type MessagePage = Schema<'Page_Message'>;

/** Newest first; `older` is the cursor of the page before the oldest one here, null at the start. */
export type Thread = { items: Message[]; older: string | null };

/** The cache key of a conversation's messages. */
export const messagesKey = (conversationId: string) => ['messages', conversationId] as const;

const num = (id: string) => Number(id);

/**
 * The first page on top of what was loaded. Loaded replies older than the page stay; replies in
 * the page's range that it no longer has were deleted and go. A page that does not reach the
 * loaded ones (more new replies than a page holds) starts over from it: there would be a gap.
 */
export function withHead(prev: Thread | undefined, page: MessagePage): Thread {
    const head = page.items;
    if (!prev || !prev.items.length) return { items: head, older: page.next_cursor ?? null };
    // the whole conversation fits in the page
    if (!page.next_cursor) return { items: head, older: null };
    const oldest = head.length ? num(head[head.length - 1]!.id) : Infinity;
    const newestLoaded = num(prev.items[0]!.id);
    if (newestLoaded < oldest) return { items: head, older: page.next_cursor };
    const rest = prev.items.filter((m) => num(m.id) < oldest);
    return { items: [...head, ...rest], older: prev.older };
}

/** A page of older replies at the end (the start of the conversation when it has no cursor). */
export function withOlder(prev: Thread, page: MessagePage): Thread {
    const known = new Set(prev.items.map((m) => m.id));
    return { items: [...prev.items, ...page.items.filter((m) => !known.has(m.id))], older: page.next_cursor ?? null };
}

/**
 * An older page asked for with `cursor`, if the thread still ends there. A poll that started the
 * thread over meanwhile (more new replies than a page) moved its end: gluing the page under the
 * new head would hide the replies between them for good, so it is dropped, and the next scroll
 * asks from the thread's own cursor.
 */
export function withOlderAt(prev: Thread | undefined, cursor: string, page: MessagePage): Thread | undefined {
    return prev && prev.older === cursor ? withOlder(prev, page) : prev;
}

/** A reply just sent, on top until the next poll brings it too. */
export function withSent(prev: Thread | undefined, message: Message): Thread {
    if (!prev) return { items: [message], older: null };
    if (prev.items.some((m) => m.id === message.id)) return prev;
    return { ...prev, items: [message, ...prev.items] };
}

/** A message as it is after an edit, where the thread has it. */
export function withEdited(prev: Thread | undefined, message: Message): Thread | undefined {
    if (!prev || !prev.items.some((m) => m.id === message.id)) return prev;
    return { ...prev, items: prev.items.map((m) => (m.id === message.id ? message : m)) };
}

/** Oldest first, as a chat shows them. */
export function chronological(thread: Thread | undefined): Message[] {
    return thread ? [...thread.items].reverse() : [];
}

/**
 * Where the "New" marker goes: before the oldest unread message. `unread` counts the newest
 * messages the viewer had not read (the first message too); `shown` is oldest first with the
 * first message's id (`first`) at its start once the whole conversation is loaded. Null when
 * nothing is unread, and the oldest shown when more are unread than shown.
 */
export function firstUnreadId(shown: readonly string[], unread: number): string | null {
    if (unread <= 0 || !shown.length) return null;
    return shown[Math.max(0, shown.length - unread)] ?? null;
}

/**
 * The same for a conversation that was open meanwhile: `unread` counts back from `newestAtOpen`,
 * the newest message when it opened, so what is sent or comes later never moves the line.
 * Before that message is known, nothing is marked.
 */
export function firstUnreadAtOpen(shown: readonly string[], newestAtOpen: string | null, unread: number): string | null {
    if (newestAtOpen === null) return null;
    const end = shown.indexOf(newestAtOpen);
    return end < 0 ? null : firstUnreadId(shown.slice(0, end + 1), unread);
}
