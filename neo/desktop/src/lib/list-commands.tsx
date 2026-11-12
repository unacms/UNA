/**
 * Commands that act on the list in the list pane (j, k, o, ., and e and E on notifications). They come in through the
 * window's commands (commands.json) like every other key; the Shell hands them to whichever
 * list registered last. They only act while focus is in the list pane, so typing those letters
 * anywhere else does nothing (WCAG 2.1.4: a single-key shortcut that is active only on focus).
 */
import { createContext, type ReactNode, type RefObject, useContext, useEffect, useRef } from 'react';

import type { CommandId } from './shortcuts';

export const LIST_COMMANDS = ['next-item', 'previous-item', 'open-item', 'show-new', 'mark-read', 'mark-all-read'] as const;
export type ListCommand = (typeof LIST_COMMANDS)[number];

export function isListCommand(id: CommandId): id is ListCommand {
    return (LIST_COMMANDS as readonly string[]).includes(id);
}

/** Runs a list command; false when the list had nothing to do. */
export type ListCommandHandler = (command: ListCommand) => boolean;

type Registry = RefObject<ListCommandHandler | null>;

const ListCommandsContext = createContext<Registry | null>(null);

export function ListCommandsProvider({ registry, children }: { registry: Registry; children: ReactNode }) {
    return <ListCommandsContext.Provider value={registry}>{children}</ListCommandsContext.Provider>;
}

/**
 * Make this list the one the list commands act on while it is mounted. A list in the detail
 * pane passes `enabled` false, so it does not take them from the list pane's list.
 */
export function useListCommands(handler: ListCommandHandler, enabled = true): void {
    const registry = useContext(ListCommandsContext);
    const latest = useRef(handler);
    useEffect(() => {
        latest.current = handler;
    });
    useEffect(() => {
        if (!registry || !enabled) return;
        const ref = registry as { current: ListCommandHandler | null };
        const run: ListCommandHandler = (c) => latest.current(c);
        ref.current = run;
        return () => {
            if (ref.current === run) ref.current = null;
        };
    }, [registry, enabled]);
}

/** Whether focus is in the list pane (its heading, a post, a control in it). */
export function focusInListPane(): boolean {
    const active = document.activeElement;
    return !!active && active !== document.body && !!active.closest('[data-pane="list"]');
}
