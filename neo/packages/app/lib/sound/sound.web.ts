import { bind, play, setEnabled } from 'cuelume';
import { appSetting } from 'app/lib/util';
import type { Cue, CueOptions, PressCue } from './cues';
import { pressCueParts } from './cues';

/**
 * Web: Cuelume synthesizes every cue live. `bind()` (once, from
 * `InterfaceSounds`) plays the press cue of any element carrying
 * `data-cuelume-*` attributes; `playCue` is for outcomes (saved, failed,
 * arrived). Cuelume stays silent until the page has had a user gesture.
 */

const PRESS_ATTRIBUTES: Partial<Record<Cue, string>> = {
    tap: 'data-cuelume-tap',
    select: 'data-cuelume-select',
    toggle: 'data-cuelume-toggle',
    open: 'data-cuelume-open',
    close: 'data-cuelume-close',
    navigate: 'data-cuelume-navigate',
};

let unbind: (() => void) | null = null;

/** `layout.sounds` off silences the app; `InterfaceSounds` adds the user's own setting. */
if (!appSetting('layout', 'sounds')) setEnabled(false);

export function startInterfaceSounds(): () => void {
    if (!unbind) unbind = bind();
    return () => {
        unbind?.();
        unbind = null;
    };
}

export function setInterfaceSoundsEnabled(enabled: boolean): void {
    setEnabled(enabled);
}

export function playCue(cue: Cue, options?: CueOptions): void {
    play(cue, options);
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
    return attributes;
}

/** Native only: web plays press cues through `cueAttributes`. */
export function playPressCue(_press: PressCue | null | undefined): void {}
