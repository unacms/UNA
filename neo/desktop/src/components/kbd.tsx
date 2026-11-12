import { platform } from '../lib/platform';
import { type Command, keyCaps, spokenShortcut } from '../lib/shortcuts';
import { VisuallyHidden } from './visually-hidden';

type Props = {
    /** The command whose keys are shown, or the key caps themselves. */
    command?: Command;
    caps?: string[];
    /** What a screen reader says instead of the caps (with `caps`). */
    spoken?: string;
    /** Inside something hidden from screen readers already (a tooltip): no spoken text. */
    decorative?: boolean;
    mac?: boolean;
};

/**
 * A key combination: one chip per key, inside one <kbd> (HTML's nesting for a combination).
 * The chips are hidden from screen readers, which mispronounce ⌘ ⇧ ⌥ and ignore aria-label on a
 * <kbd>; the keys are said in words beside them instead ("Command K").
 */
export function Kbd({ command, caps, spoken, decorative, mac = platform.mac }: Props) {
    const keys = caps ?? (command ? keyCaps(command, mac) : []);
    if (!keys.length) return null;
    const words = spoken ?? (command ? spokenShortcut(command, mac) : keys.join(' '));
    return (
        <>
            <kbd className="kbd" aria-hidden="true">
                {keys.map((k, i) => (
                    <kbd key={i} className="kbd-key">
                        {k}
                    </kbd>
                ))}
            </kbd>
            {decorative ? null : <VisuallyHidden>{words}</VisuallyHidden>}
        </>
    );
}
