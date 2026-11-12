import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, type Ref, useState } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { closeModal, Dialog, type DialogHandle, openModal } from './dialog';

afterEach(cleanup);

/** An opener and a dialog as the app's small forms are: drawn only while open, a heading, a field, Cancel. */
function Harness({ handle, onClose }: { handle?: Ref<DialogHandle>; onClose?: () => void }) {
    const [open, setOpen] = useState(false);
    const close = () => {
        onClose?.();
        setOpen(false);
    };
    return (
        <>
            <button type="button" onClick={() => setOpen(true)}>
                Rename
            </button>
            <button type="button">Other</button>
            <Dialog open={open} onClose={close} className="dialog name-dialog" labelledBy="name-title" handle={handle}>
                {open ? (
                    <>
                        <h2 id="name-title">Rename list</h2>
                        <input type="text" aria-label="Name" />
                        <button type="button" onClick={close}>
                            Cancel
                        </button>
                    </>
                ) : null}
            </Dialog>
        </>
    );
}

const dialogEl = () => document.querySelector('dialog') as HTMLDialogElement;

/** Open it as a person does: focus is on the button pressed. */
function openFrom(name = 'Rename') {
    const opener = screen.getByRole('button', { name });
    act(() => opener.focus());
    fireEvent.click(opener);
    return opener;
}

/** Esc as the web view reports it to a modal dialog. */
function pressEsc() {
    const esc = new Event('cancel', { cancelable: true });
    act(() => void dialogEl().dispatchEvent(esc));
    return esc;
}

describe('Dialog', () => {
    // jsdom has no modal dialogs. These stand in for a web view's: showModal() moves focus to the
    // first control inside, close() tells the page with a close event. Neither sends focus back,
    // so what the tests see return is the component's doing.
    const proto = HTMLDialogElement.prototype;
    const showModal = vi.fn(function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
        this.querySelector<HTMLElement>('input, button, select, textarea, [tabindex]')?.focus();
    });
    const close = vi.fn(function (this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
    });
    beforeAll(() => {
        Object.defineProperty(proto, 'showModal', { configurable: true, writable: true, value: showModal });
        Object.defineProperty(proto, 'close', { configurable: true, writable: true, value: close });
    });
    afterAll(() => {
        Reflect.deleteProperty(proto, 'showModal');
        Reflect.deleteProperty(proto, 'close');
    });
    afterEach(() => {
        showModal.mockClear();
        close.mockClear();
    });

    it('stays in the page closed, and opens as a modal dialog named by its heading, with focus inside', () => {
        render(<Harness />);
        expect(dialogEl().open).toBe(false);
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(dialogEl().className).toBe('dialog name-dialog');
        openFrom();
        const dialog = screen.getByRole('dialog', { name: 'Rename list' });
        expect(dialog).toBe(dialogEl());
        expect(showModal).toHaveBeenCalledTimes(1);
        expect(showModal.mock.instances[0]).toBe(dialog);
        // what it holds is drawn by the time it opens, so the web view has a control to focus
        expect(dialog.contains(document.activeElement)).toBe(true);
        expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Name' }));
    });

    it('closes on Esc through the owner, and focus goes back to what opened it', () => {
        const onClose = vi.fn();
        render(<Harness onClose={onClose} />);
        const opener = openFrom();
        const esc = pressEsc();
        // the dialog does not close itself: `open` says when
        expect(esc.defaultPrevented).toBe(true);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(dialogEl().open).toBe(false);
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(document.activeElement).toBe(opener);
    });

    it('closes when its owner says so, and focus goes back to what opened it', () => {
        const onClose = vi.fn();
        render(<Harness onClose={onClose} />);
        const opener = openFrom();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(close).toHaveBeenCalledTimes(1);
        expect(dialogEl().open).toBe(false);
        // the close event of a dialog closed by `open` asks nothing more of the owner
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(document.activeElement).toBe(opener);
    });

    it('opens again after it closed, and returns focus to the opener of that time', () => {
        render(<Harness />);
        const first = openFrom();
        pressEsc();
        expect(document.activeElement).toBe(first);
        // opened again while focus is somewhere else: that is where it goes back
        const other = screen.getByRole('button', { name: 'Other' });
        act(() => other.focus());
        fireEvent.click(first);
        expect(screen.getByRole('dialog', { name: 'Rename list' })).toBeTruthy();
        expect(showModal).toHaveBeenCalledTimes(2);
        expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Name' }));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(dialogEl().open).toBe(false);
        expect(document.activeElement).toBe(other);
    });

    it('leaves focus alone when what opened it has left the page', () => {
        function Leaving() {
            const [open, setOpen] = useState(false);
            const [opened, setOpened] = useState(false);
            return (
                <>
                    {opened ? null : (
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(true);
                                setOpened(true);
                            }}
                        >
                            Once
                        </button>
                    )}
                    <Dialog open={open} onClose={() => setOpen(false)} labelledBy="once-title">
                        <h2 id="once-title">Once</h2>
                        <button type="button" onClick={() => setOpen(false)}>
                            Done
                        </button>
                    </Dialog>
                </>
            );
        }
        render(<Leaving />);
        const opener = openFrom('Once');
        expect(opener.isConnected).toBe(false);
        const focus = vi.spyOn(opener, 'focus');
        fireEvent.click(screen.getByRole('button', { name: 'Done' }));
        expect(dialogEl().open).toBe(false);
        expect(focus).not.toHaveBeenCalled();
    });

    it('dismisses without sending focus back, and the owner hears it closed', () => {
        const handle = createRef<DialogHandle>();
        const onClose = vi.fn();
        render(<Harness handle={handle} onClose={onClose} />);
        const opener = openFrom();
        const focus = vi.spyOn(opener, 'focus');
        act(() => handle.current?.dismiss());
        expect(dialogEl().open).toBe(false);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(focus).not.toHaveBeenCalled();
        expect(document.activeElement).not.toBe(opener);
        // dismissing a closed dialog does nothing
        act(() => handle.current?.dismiss());
        expect(close).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
        // and it opens again, returning focus as before
        openFrom();
        expect(screen.getByRole('dialog', { name: 'Rename list' })).toBeTruthy();
        pressEsc();
        expect(dialogEl().open).toBe(false);
        expect(document.activeElement).toBe(opener);
    });

    it('follows a dialog the web view closed itself', () => {
        const onClose = vi.fn();
        render(<Harness onClose={onClose} />);
        openFrom();
        act(() => dialogEl().close());
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('dialog')).toBeNull();
    });
});

describe('Dialog without modal dialogs (jsdom)', () => {
    it('opens and closes with the open attribute, and still sends focus back', () => {
        render(<Harness />);
        expect(typeof dialogEl().showModal).not.toBe('function');
        const opener = openFrom();
        expect(screen.getByRole('dialog', { name: 'Rename list' }).hasAttribute('open')).toBe(true);
        const field = screen.getByRole('textbox', { name: 'Name' });
        act(() => field.focus());
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(dialogEl().hasAttribute('open')).toBe(false);
        expect(document.activeElement).toBe(opener);
    });

    it('openModal and closeModal set and take off the open attribute', () => {
        const d = document.createElement('dialog');
        openModal(d);
        expect(d.hasAttribute('open')).toBe(true);
        closeModal(d);
        expect(d.hasAttribute('open')).toBe(false);
    });
});
