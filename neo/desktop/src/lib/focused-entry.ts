/**
 * The keys that act on what has focus (l, c, r, p): the post or comment that has focus, or
 * holds the focused control, and the controls they press. They press the same buttons a click
 * would, so a shortcut and a click can't do different things.
 */

/** The focused post (an ActivityCard article), in either pane. */
export function focusedPost(): HTMLElement | null {
    const active = document.activeElement;
    return active instanceof HTMLElement ? active.closest<HTMLElement>('article.activity') : null;
}

/** The focused comment, or else the focused post. */
export function focusedEntry(): HTMLElement | null {
    const active = document.activeElement;
    return active instanceof HTMLElement ? active.closest<HTMLElement>('article.comment, article.activity') : null;
}

/** p: open the author of the focused post or comment (its name button). */
export function openFocusedAuthor(): boolean {
    const link = focusedEntry()?.querySelector<HTMLElement>('[data-profile-link]');
    link?.click();
    return !!link;
}

/** The event a reaction toggle (ReactionButton) sends once the site answered a press. */
export const REACTION_SETTLED = 'una-reaction-settled';
/** What a press came to: the reaction is on or off now, or the site refused the change. */
export type ReactionSettled = { reacted: boolean } | { error: string };

/**
 * l: press the focused post's reaction toggle. Resolves with what the press came to once the
 * site answered; null when there is no toggle, or it is still busy with the last press (which
 * would ignore this one).
 */
export function toggleFocusedReaction(): Promise<ReactionSettled> | null {
    const button = focusedPost()?.querySelector<HTMLButtonElement>('[data-react-toggle]');
    if (!button || button.hasAttribute('data-busy')) return null;
    const settled = new Promise<ReactionSettled>((resolve) => {
        button.addEventListener(REACTION_SETTLED, (e) => resolve((e as CustomEvent<ReactionSettled>).detail), { once: true });
    });
    button.click();
    return settled;
}

/** Whether a post (an ActivityCard article) takes comments from the viewer. */
export function canCommentOn(post: HTMLElement): boolean {
    return post.dataset.canComment === 'true';
}

/** r on a focused comment: its Reply button (it opens the reply box). */
export function replyToFocusedComment(): boolean {
    const active = document.activeElement;
    const comment = active instanceof HTMLElement ? active.closest<HTMLElement>('article.comment') : null;
    const button = comment ? document.getElementById(`${comment.id}-reply`) : null;
    button?.click();
    return !!button;
}

/**
 * Focus an element by id now, or as soon as it is in the document (a detail pane still
 * rendering), for a few seconds at most. Gives up when focus moved elsewhere meanwhile. When
 * the element never came and focus is still where it was, `fallbackId` (a pane's heading) gets
 * it, so the person learns where they are.
 */
export function focusWhenPresent(id: string, timeoutMs = 3000, fallbackId?: string): void {
    const now = document.getElementById(id);
    if (now) {
        now.focus();
        return;
    }
    const startedOn = document.activeElement;
    const untouched = () => document.activeElement === startedOn || document.activeElement === document.body;
    const observer = new MutationObserver(() => {
        const el = document.getElementById(id);
        if (!el) return;
        stop();
        if (untouched()) el.focus();
    });
    const timer = setTimeout(() => {
        stop();
        const fallback = fallbackId ? document.getElementById(fallbackId) : null;
        if (fallback && untouched() && !fallback.closest('[inert], [hidden]')) fallback.focus();
    }, timeoutMs);
    const stop = () => {
        observer.disconnect();
        clearTimeout(timer);
    };
    observer.observe(document.body, { childList: true, subtree: true });
}
