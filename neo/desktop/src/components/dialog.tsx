import { type ReactNode, type Ref, useEffect, useImperativeHandle, useRef } from 'react';

/** Show a <dialog> as a modal one. jsdom has no modal dialogs: there the `open` attribute stands in. */
export function openModal(d: HTMLDialogElement): void {
    if (typeof d.showModal === 'function') d.showModal();
    else d.setAttribute('open', '');
}

/** Close a <dialog> shown with `openModal`. */
export function closeModal(d: HTMLDialogElement): void {
    if (typeof d.close === 'function') d.close();
    else d.removeAttribute('open');
}

export type DialogHandle = {
    /**
     * Close now, without sending focus back: what runs next moves focus itself, and the page
     * under the dialog must not be inert any more when it does.
     */
    dismiss: () => void;
};

type Props = {
    open: boolean;
    /** Asked to close: Esc, or the dialog closed without `open` saying so. The owner then sets `open` to false. */
    onClose: () => void;
    className?: string;
    /** The id of the heading inside that names the dialog. */
    labelledBy: string;
    handle?: Ref<DialogHandle>;
    children: ReactNode;
};

/**
 * A modal <dialog> that follows `open`: it keeps focus inside while it is open, Esc asks to
 * close it, and when it closes focus goes back to what had it when it opened. The dialog stays
 * in the page while closed, so what it holds decides what is drawn then.
 */
export function Dialog({ open, onClose, className, labelledBy, handle, children }: Props) {
    const dialog = useRef<HTMLDialogElement>(null);
    const returnTo = useRef<Element | null>(null);

    useImperativeHandle(
        handle,
        () => ({
            dismiss: () => {
                const d = dialog.current;
                if (!d?.open) return;
                returnTo.current = null;
                closeModal(d);
            },
        }),
        [],
    );

    useEffect(() => {
        const d = dialog.current;
        if (!d) return;
        if (open && !d.open) {
            returnTo.current = document.activeElement;
            openModal(d);
        } else if (!open && d.open) {
            closeModal(d);
            const el = returnTo.current;
            if (el instanceof HTMLElement && el.isConnected) el.focus();
        }
    }, [open]);

    return (
        <dialog
            ref={dialog}
            className={className}
            aria-labelledby={labelledBy}
            // Esc goes through the owner, so the dialog never closes while `open` still says it is open
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
            // closed some other way (dismiss): the owner's state follows
            onClose={() => {
                if (open) onClose();
            }}
        >
            {children}
        </dialog>
    );
}
