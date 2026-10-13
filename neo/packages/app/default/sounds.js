/**
 * Native interface sounds: Cuelume cues (https://cuelume.dev, MIT) rendered
 * to files by `scripts/render-sounds.mjs`. Web synthesizes the same cues live
 * and does not use these files.
 *
 * Keys are `[<set>-]<cue>[-<emphasis>][-back]`, the default set without a
 * prefix. A cue without its own key plays a plainer one, then the default set's,
 * then the key that did its job before Cuelume (`click`, `tab`, `success`,
 * `notif`); see `cueKeys` in `lib/sound/cues.ts`. A fork replaces a sound by
 * pointing a key at its own file in `customization/sounds.js`.
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

    // The Mechanical set (`mech`): Studio > Settings > Sounds picks it for the app or for one kind of action.
    'mech-toggle': require('app/customization/resources/sounds/mech-toggle.wav'),
    'mech-toggle-back': require('app/customization/resources/sounds/mech-toggle-back.wav'),
    'mech-open-subtle': require('app/customization/resources/sounds/mech-open-subtle.wav'),
    'mech-close-subtle': require('app/customization/resources/sounds/mech-close-subtle.wav'),
    'mech-navigate-subtle': require('app/customization/resources/sounds/mech-navigate-subtle.wav'),
    'mech-success-subtle': require('app/customization/resources/sounds/mech-success-subtle.wav'),
    'mech-ready': require('app/customization/resources/sounds/mech-ready.wav'),
    'mech-ready-subtle': require('app/customization/resources/sounds/mech-ready-subtle.wav'),
    'mech-error': require('app/customization/resources/sounds/mech-error.wav'),

    // The Bubble set (`bubble`): Studio > Settings > Sounds picks it for the app or for one kind of action.
    'bubble-toggle': require('app/customization/resources/sounds/bubble-toggle.wav'),
    'bubble-toggle-back': require('app/customization/resources/sounds/bubble-toggle-back.wav'),
    'bubble-open-subtle': require('app/customization/resources/sounds/bubble-open-subtle.wav'),
    'bubble-close-subtle': require('app/customization/resources/sounds/bubble-close-subtle.wav'),
    'bubble-navigate-subtle': require('app/customization/resources/sounds/bubble-navigate-subtle.wav'),
    'bubble-success-subtle': require('app/customization/resources/sounds/bubble-success-subtle.wav'),
    'bubble-ready': require('app/customization/resources/sounds/bubble-ready.wav'),
    'bubble-ready-subtle': require('app/customization/resources/sounds/bubble-ready-subtle.wav'),
    'bubble-error': require('app/customization/resources/sounds/bubble-error.wav'),

    // The Press set (`press`): Studio > Settings > Sounds picks it for the app or for one kind of action.
    'press-toggle': require('app/customization/resources/sounds/press-toggle.wav'),
    'press-toggle-back': require('app/customization/resources/sounds/press-toggle-back.wav'),
    'press-open-subtle': require('app/customization/resources/sounds/press-open-subtle.wav'),
    'press-close-subtle': require('app/customization/resources/sounds/press-close-subtle.wav'),
    'press-navigate-subtle': require('app/customization/resources/sounds/press-navigate-subtle.wav'),
    'press-success-subtle': require('app/customization/resources/sounds/press-success-subtle.wav'),
    'press-ready': require('app/customization/resources/sounds/press-ready.wav'),
    'press-ready-subtle': require('app/customization/resources/sounds/press-ready-subtle.wav'),
    'press-error': require('app/customization/resources/sounds/press-error.wav'),

    // Keys from before Cuelume, for code that plays sounds by these names.
    click: toggle,
    tab: navigateSubtle,
    success: successSubtle,
    notif: ready,
};

export const Sounds = SoundsDefault;
