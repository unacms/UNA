/**
 * A count shown in a line of text ("3 followers") that visibly changes when its number does: the number rolls to
 * the new one (up for more, down for fewer) and the text takes the accent colour for a moment
 * (`ui/atoms/count-text.tsx`). These are its rules, kept apart from React so they can be tested.
 */
export type CountParts = { before: string; number: string; after: string };

export type CountChange = {
    /** The number that was shown, as text. */
    from: string;
    /** More than before rolls up, fewer rolls down. */
    direction: 'up' | 'down';
    /** Restarts the effect when the count changes again while it plays. */
    tick: number;
};

/** Whose count it is: an id, or nothing. */
type Owner = string | number | null | undefined;

export type CountState = {
    text: string;
    value: number | null;
    owner: string;
    change: CountChange | null;
    tick: number;
};

/** A number in running text: digits with separators inside ("1,204", "1 204", "1.2") and a short suffix ("3K"). */
const NUMBER = /\d+(?:[.,   ]\d+)*(?:\s?[KkMm]\b)?/;

/** The text around its first number; all of it is `before` when it has none. */
export function splitCount(text: string): CountParts {
    const match = NUMBER.exec(text);
    if (!match) return { before: text, number: '', after: '' };
    return {
        before: text.slice(0, match.index),
        number: match[0],
        after: text.slice(match.index + match[0].length),
    };
}

const toValue = (value: unknown): number | null => {
    const number = typeof value === 'number' ? value : Number(value);
    return value == null || value === '' || !Number.isFinite(number) ? null : number;
};

export function initialCountState(text: string, value: unknown, owner: Owner): CountState {
    return { text, value: toValue(value), owner: String(owner ?? ''), change: null, tick: 0 };
}

/**
 * The state for what is shown now. A new number for the same owner is a change to show. Another owner (a recycled
 * list row now shows someone else) or a first number is not: nothing changed for the reader. The same object comes
 * back when nothing differs.
 */
export function nextCountState(state: CountState, text: string, value: unknown, owner: Owner): CountState {
    const nextValue = toValue(value);
    const nextOwner = String(owner ?? '');

    if (state.owner !== nextOwner) return { ...initialCountState(text, value, owner), tick: state.tick };
    if (state.value === nextValue) return state.text === text ? state : { ...state, text };
    if (state.value === null || nextValue === null) return { ...state, text, value: nextValue, change: null };

    const from = splitCount(state.text).number;
    const tick = state.tick + 1;
    return {
        ...state,
        text,
        value: nextValue,
        tick,
        change: from ? { from, direction: nextValue > state.value ? 'up' : 'down', tick } : null,
    };
}

/** The effect has played: the state without it. A newer change (another tick) stays. */
export function settleCountState(state: CountState, tick: number): CountState {
    return state.change?.tick === tick ? { ...state, change: null } : state;
}
