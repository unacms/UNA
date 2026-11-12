/**
 * Unsaved changes are asked about before anything takes their form away, not only by the form's
 * own Cancel and Esc: a form names whether it has any and the question to ask (useLeaveGuard),
 * and the places that leave it consult that. The history the form is shown in asks before
 * another detail, or none, is shown (RouteHistory.guard in router.ts: the pane's Close, another
 * row, the sidebar, Back and Forward, Esc on the toolbar, a link); the tabs ask it before
 * another tab is shown or the shown one closes (lib/tabs.ts); a window of its own asks before
 * it closes, and a browser tab warns before it unloads (guardWindowClose in native.ts).
 *
 * Not asked: quitting the app or closing its main window, signing out, and switching the
 * profile or the network, which start everything over.
 */
import { useEffect, useRef } from 'react';

import { guardWindowClose } from './native';
import { useOptionalNavigation } from './navigation';

/**
 * While `dirty`, leaving the form asks `confirm` first (true: discard the changes and leave).
 * The form's own Cancel asks the same question itself.
 */
export function useLeaveGuard(dirty: boolean, confirm: () => Promise<boolean>): void {
    const history = useOptionalNavigation()?.history ?? null;
    const state = useRef({ dirty, confirm });
    useEffect(() => {
        state.current = { dirty, confirm };
    });
    useEffect(() => history?.guard({ dirty: () => state.current.dirty, confirm: () => state.current.confirm() }), [history]);
    useEffect(() => (dirty ? guardWindowClose(() => state.current.confirm()) : undefined), [dirty]);
}
