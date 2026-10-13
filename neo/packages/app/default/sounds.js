/**
 * Native interface sounds: Cuelume cues (https://cuelume.dev, MIT) rendered
 * to files by `scripts/render-sounds.mjs`. Web synthesizes the same cues live
 * and does not use these files.
 *
 * Keys are `<cue>[-<emphasis>][-back]`. A cue without its own key plays a
 * plainer one, then the key that did its job before Cuelume (`click`, `tab`,
 * `success`, `notif`); see `cueKeys` in `lib/sound/cues.ts`. A fork replaces
 * a sound by pointing a key at its own file in `customization/sounds.js`.
 */
const toggle = require('app/customization/resources/sounds/toggle.wav');
const navigateSubtle = require('app/customization/resources/sounds/navigate-subtle.wav');
const successSubtle = require('app/customization/resources/sounds/success-subtle.wav');
const ready = require('app/customization/resources/sounds/ready.wav');

const SoundsDefault = {
    toggle,
    'toggle-back': require('app/customization/resources/sounds/toggle-back.wav'),
    'open-subtle': require('app/customization/resources/sounds/open-subtle.wav'),
    'close-subtle': require('app/customization/resources/sounds/close-subtle.wav'),
    'navigate-subtle': navigateSubtle,
    'success-subtle': successSubtle,
    ready,
    'ready-subtle': require('app/customization/resources/sounds/ready-subtle.wav'),
    error: require('app/customization/resources/sounds/error.wav'),

    // Keys from before Cuelume, for code that plays sounds by these names.
    click: toggle,
    tab: navigateSubtle,
    success: successSubtle,
    notif: ready,
};

export const Sounds = SoundsDefault;
