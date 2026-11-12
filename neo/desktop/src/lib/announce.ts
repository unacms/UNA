/**
 * The window's own live region (app.tsx Synced, secondary.tsx), for what is said as a pane goes
 * away (leaving a conversation) or from where no pane has one (opening a window): a pane's own
 * role=status unmounts with it, before a screen reader reads it.
 */
import { createContext, useContext } from 'react';

export const AnnounceContext = createContext<((text: string) => void) | null>(null);

/** Say something in the window's live region; nothing outside one (tests without it). */
export function useWindowAnnounce(): (text: string) => void {
    return useContext(AnnounceContext) ?? noop;
}

function noop(): void {}
