import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';

type SelectProps = {
    'aria-disabled'?: true;
    onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onMouseDown?: (e: MouseEvent<HTMLSelectElement>) => void;
    onKeyDown?: (e: KeyboardEvent<HTMLSelectElement>) => void;
};

/**
 * A list (select) that takes no change while its form is being saved, and keeps the keyboard.
 * `disabled` would drop focus to the page when the save starts from the list (Cmd+Enter in it),
 * and the form's keys (Cmd+Enter, Esc) would stop reaching the form after a save that failed.
 * So while `held` it is aria-disabled, looks as a disabled one does (styles.css), opens no menu
 * (the press and the keys that open or change it do nothing) and refuses a change that comes
 * anyway; Tab, Esc and the keys with Cmd or Ctrl are left to the form.
 */
export function heldSelect(held: boolean, onChange: (e: ChangeEvent<HTMLSelectElement>) => void): SelectProps {
    if (!held) return { onChange };
    return {
        'aria-disabled': true,
        onChange: () => undefined,
        onMouseDown: (e) => e.preventDefault(),
        onKeyDown: (e) => {
            if (e.key !== 'Tab' && e.key !== 'Escape' && !e.metaKey && !e.ctrlKey) e.preventDefault();
        },
    };
}
