/**
 * Interface sounds are Cuelume's cues (https://cuelume.dev): one sound per
 * interface job. Web synthesizes them live with the `cuelume` package; native
 * plays files rendered from the same package (`scripts/render-sounds.mjs`).
 *
 * Pick a cue by the job, not by how it sounds; the "Which cue?" table in
 * https://cuelume.dev/agents.md is the contract. Subtle emphasis for frequent
 * actions, strong only for rare ones that matter. Never on hover, never once
 * per item of a burst, never on page load.
 */

export type Cue =
    | 'tap'
    | 'type'
    | 'select'
    | 'toggle'
    | 'open'
    | 'close'
    | 'navigate'
    | 'success'
    | 'warning'
    | 'error'
    | 'loading'
    | 'ready'
    | 'attention'
    | 'count';

export type CueEmphasis = 'subtle' | 'normal' | 'strong';

export type CueOptions = {
    emphasis?: CueEmphasis;
    /** `select` rises going forward; `back` plays `navigate`, `toggle` and `count` falling. */
    direction?: 'forward' | 'back';
};

/** A control's press cue: a cue, a cue with options, or `false` for none. */
export type PressCue = Cue | false | ({ cue: Cue } & CueOptions);

/**
 * The `Sounds` key, and file name, of one variant: `<cue>[-<emphasis>][-back]`,
 * as `scripts/render-sounds.mjs` names the files.
 */
export function cueKey(cue: Cue, options: CueOptions = {}): string {
    const emphasis = options.emphasis && options.emphasis !== 'normal' ? `-${options.emphasis}` : '';
    const back = options.direction === 'back' ? '-back' : '';
    return `${cue}${emphasis}${back}`;
}

/** The key that played each job before Cuelume, so a `Sounds` map with only those keys still sounds. */
const LEGACY_KEY: Partial<Record<Cue, string>> = {
    tap: 'click',
    select: 'click',
    toggle: 'click',
    open: 'click',
    close: 'click',
    navigate: 'tab',
    success: 'success',
    warning: 'success',
    ready: 'notif',
    attention: 'notif',
};

/** `Sounds` keys to try for a variant, best first: exact, without the emphasis, the plain cue, the old key. */
export function cueKeys(cue: Cue, options: CueOptions = {}): string[] {
    const keys = [
        cueKey(cue, options),
        cueKey(cue, { direction: options.direction }),
        cue,
        LEGACY_KEY[cue],
    ];
    return keys.filter((key, i): key is string => !!key && keys.indexOf(key) === i);
}

/** Names `useSound` / `playSound` took before Cuelume, mapped to the cue for their job. */
export const LEGACY_SOUNDS: Record<string, { cue: Cue } & CueOptions> = {
    click: { cue: 'tap', emphasis: 'subtle' },
    tab: { cue: 'navigate', emphasis: 'subtle' },
    success: { cue: 'success', emphasis: 'subtle' },
    notif: { cue: 'ready' },
};

export function pressCueParts(press: PressCue | null | undefined): ({ cue: Cue } & CueOptions) | null {
    if (!press) return null;
    return typeof press === 'string' ? { cue: press } : press;
}
