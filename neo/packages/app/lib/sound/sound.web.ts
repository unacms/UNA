import { bind, play, setEnabled, setTheme, setVolume } from 'cuelume';
import type { Cue, CueOptions, PressCue } from './cues';
import { pressCueParts } from './cues';
import type { SoundState } from './config';
import { cueSet, getSoundConfig, soundState } from './config';

/**
 * Web: Cuelume synthesizes every cue live. `bind()` (once, from
 * `InterfaceSounds`) plays the press cue of any element carrying
 * `data-cuelume-*` attributes; `playCue` is for outcomes (saved, failed,
 * arrived). Cuelume stays silent until the page has had a user gesture.
 *
 * UNA's settings (`SoundState`, from `InterfaceSounds`) pick the set, the
 * volume and a set or silence per kind of action. Outcomes read them as they
 * play; a press gets them from `gatePress`, which runs before `bind()`.
 */

const PRESS_ATTRIBUTES: Partial<Record<Cue, string>> = {
    tap: 'data-cuelume-tap',
    select: 'data-cuelume-select',
    toggle: 'data-cuelume-toggle',
    open: 'data-cuelume-open',
    close: 'data-cuelume-close',
    navigate: 'data-cuelume-navigate',
};

const PRESS_SELECTOR = Object.values(PRESS_ATTRIBUTES).map((attribute) => `[${attribute}]`).join(',');

/** Names the kind of action of a control whose cue doesn't (`reactions` on a like). */
const GROUP_ATTRIBUTE = 'data-bx-sound-group';

/** Events `bind()` plays from. */
const PRESS_EVENTS = ['pointerdown', 'click', 'keydown', 'keyup', 'change'];

let state: SoundState = soundState(getSoundConfig(), undefined);
let unbind: (() => void) | null = null;
let restoring = false;

function applyState() {
    restoring = false;
    setTheme(state.set);
    setVolume(state.volume);
}

/** The cue a marked control plays: the one its attribute names, else the attribute's own. */
function pressedCue(control: Element): Cue | undefined {
    for (const [cue, attribute] of Object.entries(PRESS_ATTRIBUTES)) {
        if (control.hasAttribute(attribute)) return (control.getAttribute(attribute) || cue) as Cue;
    }
    return undefined;
}

/**
 * Runs before `bind()` (it listens on `document`) for every event it plays from: a press whose kind of action has a
 * set of its own plays in it, one with no sound, or any press while sounds are off, plays nothing. Cuelume reads the
 * set and volume as it plays, so the page's own are back on the next tick.
 */
function gatePress(event: Event) {
    if (!(event.target instanceof Element)) return;
    const control = event.target.closest(PRESS_SELECTOR);
    if (!control) return;
    const cue = pressedCue(control);
    if (!cue) return;
    const group = control.closest(`[${GROUP_ATTRIBUTE}]`)?.getAttribute(GROUP_ATTRIBUTE) as CueOptions['group'] | undefined;
    const set = state.on ? cueSet(state, cue, group ? { group } : undefined) : 'off';
    if (set === state.set) return;
    if (set === 'off') setVolume(0);
    else setTheme(set);
    if (!restoring) {
        restoring = true;
        setTimeout(applyState, 0);
    }
}

export function startInterfaceSounds(): () => void {
    if (!unbind) {
        for (const name of PRESS_EVENTS) window.addEventListener(name, gatePress, true);
        const undo = bind();
        unbind = () => {
            undo();
            for (const name of PRESS_EVENTS) window.removeEventListener(name, gatePress, true);
        };
    }
    return () => {
        unbind?.();
        unbind = null;
    };
}

export function setInterfaceSoundsState(next: SoundState): void {
    const wasOn = state.on;
    state = next;
    applyState();
    if (wasOn && !next.on) {
        // Off is heard at once: whatever still rings fades; presses are muted by `gatePress` from now on.
        setEnabled(false);
        setEnabled(true);
    }
}

export function playCue(cue: Cue, options?: CueOptions): void {
    if (!state.on) return;
    const set = cueSet(state, cue, options);
    if (set === 'off') return;
    play(cue, { emphasis: options?.emphasis, direction: options?.direction, theme: set });
}

/**
 * Attributes that make `bind()` play `press` when the element is pressed:
 * the press on pointerdown for a mouse, on lift for touch, both at once for
 * Enter and Space. Toggles and selects read their direction from
 * `aria-checked` / `aria-pressed` / `aria-selected`, so keep those current.
 * Put them on the element that is pressed (the innermost marked one wins).
 */
export function cueAttributes(press: PressCue | null | undefined): Record<string, string> {
    const parts = pressCueParts(press);
    if (!parts) return {};
    const attribute = PRESS_ATTRIBUTES[parts.cue];
    const attributes: Record<string, string> = attribute
        ? { [attribute]: '' }
        : { 'data-cuelume-tap': parts.cue };
    if (parts.emphasis) attributes['data-cuelume-emphasis'] = parts.emphasis;
    if (parts.group) attributes[GROUP_ATTRIBUTE] = parts.group;
    return attributes;
}

/** Native only: web plays press cues through `cueAttributes`. */
export function playPressCue(_press: PressCue | null | undefined): void {}
