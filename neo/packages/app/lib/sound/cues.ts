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

/** Cuelume's themes: the same cues in another material. UNA's settings pick one, and one per kind of action. */
export type SoundSet = 'default' | 'mech' | 'bubble' | 'press';

export const SOUND_SETS: SoundSet[] = ['default', 'mech', 'bubble', 'press'];

/** Kinds of action UNA's settings give their own set, or no sound (Studio > Settings > Sounds). */
export type SoundGroup = 'buttons' | 'choices' | 'reactions' | 'menus' | 'navigation' | 'results' | 'notifications';

export type CueOptions = {
    emphasis?: CueEmphasis;
    /** `select` rises going forward; `back` plays `navigate`, `toggle` and `count` falling. */
    direction?: 'forward' | 'back';
    /** The kind of action when the cue alone doesn't say: `reactions` for likes, ratings, favorites and follows. */
    group?: SoundGroup;
};

/** The kind of action each cue belongs to; likes and the like name theirs (`group: 'reactions'`). */
const CUE_GROUPS: Partial<Record<Cue, SoundGroup>> = {
    tap: 'buttons',
    select: 'choices',
    toggle: 'choices',
    open: 'menus',
    close: 'menus',
    navigate: 'navigation',
    loading: 'navigation',
    success: 'results',
    warning: 'results',
    error: 'results',
    ready: 'notifications',
    attention: 'notifications',
};

export function cueGroup(cue: Cue, options: CueOptions = {}): SoundGroup | undefined {
    return options.group ?? CUE_GROUPS[cue];
}

/** A control's press cue: a cue, a cue with options, or `false` for none. */
export type PressCue = Cue | false | ({ cue: Cue } & CueOptions);

/**
 * The `Sounds` key, and file name, of one variant: `[<set>-]<cue>[-<emphasis>][-back]`,
 * as `scripts/render-sounds.mjs` names the files. The default set has no prefix.
 */
export function cueKey(cue: Cue, options: CueOptions = {}, set: SoundSet = 'default'): string {
    const prefix = set !== 'default' ? `${set}-` : '';
    const emphasis = options.emphasis && options.emphasis !== 'normal' ? `-${options.emphasis}` : '';
    const back = options.direction === 'back' ? '-back' : '';
    return `${prefix}${cue}${emphasis}${back}`;
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

/**
 * `Sounds` keys to try for a variant, best first: exact, without the emphasis, the plain cue, in `set`
 * and then in the default set, and last the old key.
 */
export function cueKeys(cue: Cue, options: CueOptions = {}, set: SoundSet = 'default'): string[] {
    const sets: SoundSet[] = set === 'default' ? ['default'] : [set, 'default'];
    const keys = [
        ...sets.flatMap((s) => [cueKey(cue, options, s), cueKey(cue, { direction: options.direction }, s), cueKey(cue, {}, s)]),
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
