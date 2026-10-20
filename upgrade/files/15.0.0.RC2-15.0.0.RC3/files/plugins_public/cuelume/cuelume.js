/**
 * Layers — the building blocks every cue is made of: one tone or one burst
 * of filtered noise, shaped by an attack/decay envelope. The builders below
 * (`knock`, `struck`, `click`, …) are how themes spell real materials —
 * a struck bar, a switch click, a breath of air — out of those layers.
 */
/**
 * Success and ready ring into the room 6 dB more than the rest, about 16 dB
 * under the sound itself: a result lands in the space without sounding far.
 */
const LANDED = 2;
/** How far sharp a knock is struck, and how fast it drops to its pitch. */
const KNOCK_DROP = 1.6;
const KNOCK_DROP_TIME = 0.018;
/**
 * A knock's body: a sine struck sharp that drops to `frequency` in 18 ms, the
 * way a small hollow part answers a tap. Heard as a soft "tok", never as a
 * slide. Measured from the keycap sounds in DawoodUI's Artasaka preview.
 */
const knock = (frequency, decay, peak, more = {}) => ({
    kind: "tone", waveform: "sine", frequency: frequency * KNOCK_DROP, glideTo: frequency, glideTime: KNOCK_DROP_TIME,
    attack: 0.001, decay, peak, ...more,
});
/** A free bar, glass or metal: modes at 1, 2.76 and 5.40 times the fundamental (euphonics.org, free-free bar). */
const BAR = [[1, 1], [2.76, 0.3], [5.4, 0.1]];
/** A marimba bar, undercut so its second mode sits at 3.99x (STK ModalBar's marimba). Rounder than a free bar. */
const MALLET = [[1, 1], [3.99, 0.2]];
/** Modes above this are left out: the register ceiling every theme keeps. */
const MODE_CEILING = 5000;
/** A struck tone swells in over 3 ms: short enough to strike, long enough not to click. */
const STRIKE_ATTACK = 0.003;
/** No mode dies faster than this, or it stops being heard as a pitch. */
const SHORTEST_MODE = 0.028;
const MODE_DAMPING = 0.75;
/**
 * A struck note: one sine per mode of `material`. A higher mode dies sooner,
 * so the highs go first as on any real bar, though more gently than the 1/f
 * of van den Doel and Pai's model. Upper modes are ornament that
 * subtle leaves out; `from` moves the whole note to a higher emphasis.
 */
function struck(frequency, decay, peak, material, { from } = {}) {
    return material
        .filter(([ratio]) => frequency * ratio <= MODE_CEILING)
        .map(([ratio, level], mode) => {
        const layerFrom = mode === 0 ? from : (from ?? "normal");
        return {
            kind: "tone", waveform: "sine", frequency: frequency * ratio, attack: STRIKE_ATTACK,
            decay: Math.max(SHORTEST_MODE, decay / ratio ** MODE_DAMPING), peak: peak * level, ...(layerFrom ? { from: layerFrom } : {}),
        };
    });
}
/** Lowpass Q in dB that gives a flat, unresonant corner. Web Audio reads a lowpass Q in dB. */
const FLAT_Q = -3;
/**
 * The mallet meeting the bar: 3 ms of noise, low-passed at the mallet's
 * hardness. A soft felt mallet sits near 1 kHz, a hard one near 3 kHz. It
 * makes a chord a struck object rather than a test tone.
 */
const contact = (hardness, peak, more = {}) => ({
    kind: "noise", filterType: "lowpass", filterFrequency: hardness, filterQ: FLAT_Q, attack: 0.001, decay: 0.0035, peak, ...more,
});
/**
 * One resonance of a switch's click: a narrow ring that dies in about 5 ms.
 * Measured from the Subscribe press in DawoodUI's Artasaka preview.
 */
const ring = (frequency, peak, more = {}) => ({
    kind: "noise", filterType: "bandpass", filterFrequency: frequency, filterQ: 8, attack: 0.001, decay: 0.0055, peak, ...more,
});
/** How far below its ring a click's body sits. */
const CLICK_BODY = 0.675;
/**
 * A click: a tight ring over a softer, wider body below it, so the energy
 * spreads the way a real switch's does. The Artasaka press rings at 4 kHz and
 * lets go at 4.8 kHz, 5 dB quieter.
 */
const click = (frequency, peak, more = {}) => [
    ring(frequency, peak, more),
    ring(frequency * CLICK_BODY, peak * 0.5, { filterQ: 2, ...more }),
];
/** Air moved by a part: filtered noise that sweeps from `from` to `to` Hz. */
const air = (from, to, decay, peak, more = {}) => ({
    kind: "noise", filterType: "bandpass", filterFrequency: from, glideTo: to, glideTime: decay, filterQ: 1.5, attack: 0.008, decay, peak, ...more,
});
/** A dull thud: a part hitting its stop. */
const thud = (frequency, decay, peak, more = {}) => ({
    kind: "noise", filterType: "lowpass", filterFrequency: frequency, filterQ: 0.7, attack: 0.001, decay, peak, ...more,
});
/**
 * A note's partials as the Artasaka press sounds them: [multiple, share of
 * the ring, level]. The octave at -6 dB carries a low note on small speakers;
 * the faint third and fourth give it its edge.
 */
const NOTE_PARTIALS = [[1, 1, 1], [2, 0.9, 0.5], [3, 1, 0.04], [4, 0.73, 0.056]];
/** The note starts 9% sharp and settles within 15 ms. */
const NOTE_SHARP = 1.09;
const NOTE_SETTLE = 0.015;
/** It swells in rather than striking: the video's peaks 105–125 ms after the click. */
const NOTE_SWELL = 0.11;
/**
 * A deep note that swells in under a click and rings on, as the Artasaka
 * press does. With a `decay` of 1.36 s it falls about 45 dB a second, as the
 * video's does.
 * Upper partials are ornament that subtle leaves out; `from` moves the whole
 * note to a higher emphasis.
 */
function note(frequency, decay, peak, { from } = {}) {
    const attack = Math.min(NOTE_SWELL, decay / 2);
    return NOTE_PARTIALS.map(([multiple, length, level], partial) => {
        const layerFrom = partial < 2 ? from : (from ?? "normal");
        return {
            note: true, kind: "tone", waveform: "sine", frequency: frequency * multiple * NOTE_SHARP, glideTo: frequency * multiple,
            glideTime: NOTE_SETTLE, attack, decay: decay * length, peak: peak * level, ...(layerFrom ? { from: layerFrom } : {}),
        };
    });
}

/**
 * The `bubble` theme: the same fourteen cues, made of water. Playful and
 * opt-in: an app switches to it with `setTheme`, or uses it for one moment with
 * `play()`'s `theme` option or `data-cuelume-theme`.
 *
 * Every cue is its own gesture, and one sound: a knock for tap and type, a drip
 * for select, a cork for toggle, a balloon for open, a gulp for close, and so
 * on. The only theme whose tones slide. Nothing
 * is centred above 5 kHz, outcomes say what they mean in one glide (success rises,
 * error sinks, warning stays level, attention bends up), and levels match the
 * default palette on perceived loudness (K-weighted, the loudest 100 ms).
 *
 * Arranged for emphasis like the other themes: layers marked from "normal"
 * are ornament that subtle leaves out, and each cue has a layer only strong
 * plays.
 */
/** A sine that slides from `from` to `to` Hz in `time` seconds. */
const slide = (from, to, time, decay, peak, more = {}) => ({
    kind: "tone", waveform: "sine", frequency: from, glideTo: to, glideTime: time, attack: 0.002, decay, peak, ...more,
});
/** A bubble surfacing: a sine that rises by half in 40 ms. */
const bloop = (frequency, decay, peak, more = {}) => slide(frequency, frequency * 1.5, 0.04, decay, peak, more);
/** A drop falling from a tap: a quick flick upward, done in 12 ms. */
const drip = (frequency, decay, peak, more = {}) => slide(frequency, frequency * 1.5, 0.012, decay, peak, { attack: 0.001, ...more });
/** A bubble bursting: 3 ms of low-passed noise. */
const pop = (filterFrequency, peak, more = {}) => ({
    kind: "noise", filterType: "lowpass", filterFrequency, filterQ: 0.9, attack: 0.001, decay: 0.0032, peak, ...more,
});
/** Input and surface cues: no two plays match. */
const LIVELY = { pitch: 0.06, level: 0.1 };
/** Outcome and progress cues vary in level only, so a rise stays a rise and a level note stays level. */
const STEADY$1 = { pitch: 0, level: 0.08 };
const BUBBLE = {
    /** A keycap landing on water: a soft knock that blooms into a small bubble. A little different every time. */
    tap: {
        masterGain: 0.411,
        layers: [
            knock(300, 0.0216, 0.06),
            bloop(600, 0.0489, 0.014, { attack: 0.012 }),
            knock(600, 0.0165, 0.015, { from: "normal" }),
            knock(150, 0.0389, 0.05, { from: "strong" }),
        ],
        vary: { pitch: 0.08, level: 0.1 },
    },
    /** A keycap popping up: a higher, shorter knock, pitched differently every stroke. */
    type: {
        masterGain: 0.383,
        layers: [
            knock(415, 0.0151, 0.06),
            pop(2500, 0.03, { from: "normal" }),
            knock(208, 0.0278, 0.05, { from: "strong" }),
        ],
        vary: { pitch: 0.1, level: 0.2 },
    },
    /** A drip: the only quick flick upward. A later option drips higher, an earlier one lower. */
    select: {
        masterGain: 0.214,
        layers: [
            drip(700, 0.0278, 0.05),
            pop(3000, 0.075, { from: "normal" }),
            bloop(350, 0.0606, 0.03, { from: "strong" }),
        ],
        vary: { pitch: 0.03, level: 0.1 },
    },
    /** A cork: a soft thup as the air rushes up an octave. Switching off sinks it. */
    toggle: {
        masterGain: 0.175,
        layers: [
            { kind: "noise", filterType: "lowpass", filterFrequency: 900, filterQ: 0.9, attack: 0.001, decay: 0.00779, peak: 0.12 },
            slide(330, 660, 0.06, 0.0791, 0.045, { attack: 0.003 }),
            slide(990, 1485, 0.02, 0.045, 0.01, { from: "normal", attack: 0.03 }),
            slide(165, 330, 0.06, 0.0969, 0.03, { from: "strong" }),
        ],
        vary: { pitch: 0.04, level: 0.1 },
    },
    /** A balloon filling: one slow swell that rises a ninth. */
    open: {
        masterGain: 0.221,
        layers: [
            slide(220, 520, 0.14, 0.0692, 0.04, { attack: 0.1 }),
            slide(330, 780, 0.14, 0.0866, 0.012, { from: "normal", attack: 0.1 }),
            slide(110, 260, 0.14, 0.0969, 0.03, { from: "strong", attack: 0.1 }),
        ],
        vary: LIVELY,
    },
    /** A gulp: one fast fall. */
    close: {
        masterGain: 0.357,
        layers: [
            slide(700, 220, 0.07, 0.0905, 0.045, { attack: 0.004 }),
            pop(1200, 0.06, { from: "normal" }),
            slide(350, 110, 0.07, 0.121, 0.03, { from: "strong", attack: 0.004 }),
        ],
        vary: LIVELY,
    },
    /** One bubble rising a fifth, C to G, in a small room. */
    success: {
        masterGain: 0.52,
        layers: [
            slide(523.25, 783.99, 0.08, 0.323, 0.04, { attack: 0.003 }),
            slide(1046.5, 1567.98, 0.08, 0.12, 0.01, { from: "normal", attack: 0.003 }),
            slide(261.63, 392, 0.08, 0.391, 0.02, { from: "strong", attack: 0.003 }),
        ],
        room: LANDED,
        vary: STEADY$1,
    },
    /** One bubble sinking a fourth, F to C: a soft "uh-oh". */
    error: {
        masterGain: 0.387,
        layers: [
            slide(349.23, 261.63, 0.14, 0.226, 0.045, { attack: 0.004 }),
            pop(900, 0.12, { from: "normal" }),
            knock(147, 0.0556, 0.05, { from: "strong" }),
        ],
        vary: STEADY$1,
    },
    /** A zip: one bubble shooting up through fizz. Going back, it dives. */
    navigate: {
        masterGain: 0.554,
        layers: [
            slide(300, 1500, 0.09, 0.0943, 0.035, { attack: 0.01 }),
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 1500, glideTo: 3000, glideTime: 0.09, filterQ: 1, attack: 0.02, decay: 0.0778, peak: 0.05 },
            slide(150, 600, 0.1, 0.125, 0.025, { from: "strong", attack: 0.01 }),
        ],
        vary: LIVELY,
    },
    /** One round note with a small wobble, settling where it started: level. */
    warning: {
        masterGain: 0.436,
        layers: [
            slide(500, 440, 0.05, 0.181, 0.045),
            pop(1800, 0.09, { from: "normal" }),
            { from: "strong", kind: "tone", waveform: "sine", frequency: 220, attack: 0.003, decay: 0.225, peak: 0.025 },
        ],
        vary: STEADY$1,
    },
    /** A simmer: one slow bubble rising through soft fizz, gone within about a second. Nothing lands. */
    loading: {
        masterGain: 0.194,
        layers: [
            { kind: "noise", filterType: "lowpass", filterFrequency: 900, filterQ: 0.7, attack: 0.35, decay: 0.727, peak: 0.03 },
            slide(400, 600, 0.35, 0.953, 0.016, { attack: 0.35 }),
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 1800, filterQ: 1.5, attack: 0.35, decay: 0.749, peak: 0.004 },
            { from: "strong", kind: "noise", filterType: "lowpass", filterFrequency: 400, filterQ: 0.7, attack: 0.35, decay: 0.807, peak: 0.04 },
        ],
        vary: STEADY$1,
    },
    /** A drop into water: the plip and the round bubble it leaves, one sound, in a small room. */
    ready: {
        masterGain: 0.532,
        layers: [
            slide(1400, 700, 0.012, 0.0242, 0.03, { attack: 0.001 }),
            slide(392, 587.33, 0.06, 0.288, 0.04, { attack: 0.012 }),
            pop(2000, 0.03, { from: "normal" }),
            slide(196, 294, 0.08, 0.391, 0.02, { from: "strong", attack: 0.012 }),
        ],
        room: LANDED,
        vary: STEADY$1,
    },
    /** "Hm?": one note that bends up a fourth like a question. */
    attention: {
        masterGain: 0.666,
        layers: [
            slide(659.25, 880, 0.14, 0.295, 0.035, { attack: 0.003 }),
            pop(2200, 0.12, { from: "normal" }),
            bloop(329.63, 0.261, 0.02, { from: "strong" }),
        ],
        vary: STEADY$1,
    },
    /** A number rolling: fizz and one bubble rising together for as long as the roll (sinking counting down). */
    count: {
        masterGain: 0.267,
        layers: [
            { stretch: true, kind: "noise", filterType: "lowpass", filterFrequency: 900, glideTo: 1800, glideTime: 0.6, filterQ: 0.7, attack: 0.15, decay: 0.634, peak: 0.04 },
            { ...slide(587.33, 880, 0.6, 0.717, 0.02, { attack: 0.15 }), stretch: true },
            pop(1600, 0.05, { from: "normal" }),
            { ...slide(293.66, 440, 0.6, 0.717, 0.02, { attack: 0.15, from: "strong" }), stretch: true },
        ],
        vary: LIVELY,
    },
};

/**
 * The `mech` theme: the same fourteen cues in a dry, precise, mechanical
 * material. Machined parts rather than glass, wood, and air. No room, no
 * ring beyond a struck part's own, and nothing harsh, industrial,
 * retro-computer, or sci-fi.
 *
 * Level-matched to the default palette on perceived loudness (K-weighted, the
 * loudest 100 ms), so switching themes changes the material, not the volume.
 *
 * Arranged for emphasis like the default palette: layers marked from
 * "normal" are ornament that subtle leaves out, and each cue has a layer only
 * strong plays.
 */
const MECH = {
    /** A machined click, like a camera's shutter button, over the short knock of its housing. */
    tap: {
        masterGain: 0.964,
        layers: [
            { kind: "noise", filterType: "bandpass", filterFrequency: 2650, filterQ: 1.5, attack: 0.001, decay: 0.00413, peak: 0.08 },
            knock(455, 0.0156, 0.02),
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 4600, filterQ: 2, attack: 0.001, decay: 0.00222, peak: 0.05 },
            { from: "strong", kind: "noise", filterType: "bandpass", filterFrequency: 215, filterQ: 2, attack: 0.001, decay: 0.0216, peak: 0.3 },
        ],
        vary: { pitch: 0.02, level: 0.1 },
    },
    /** A tight low-profile switch: shorter and drier than a keycap, almost no body. */
    type: {
        masterGain: 0.484,
        layers: [
            { kind: "noise", filterType: "bandpass", filterFrequency: 3000, filterQ: 1.2, attack: 0.001, decay: 0.003, peak: 0.1 },
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 2150, filterQ: 5, attack: 0.001, decay: 0.00737, peak: 0.18 },
            { kind: "noise", filterType: "bandpass", filterFrequency: 750, filterQ: 3, attack: 0.001, decay: 0.00898, peak: 0.22 },
            { from: "strong", kind: "noise", filterType: "bandpass", filterFrequency: 330, filterQ: 2.5, attack: 0.001, decay: 0.0173, peak: 0.3 },
        ],
        vary: { pitch: 0.05, level: 0.15 },
    },
    /** A ratchet detent: a precision dial clicking over one tooth, with a faint ring of the metal. */
    select: {
        masterGain: 0.295,
        layers: [
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 3650, filterQ: 3, attack: 0.001, decay: 0.00273, peak: 0.2 },
            { kind: "noise", filterType: "bandpass", filterFrequency: 1500, filterQ: 8, attack: 0.001, decay: 0.00762, peak: 0.35 },
            { kind: "tone", waveform: "sine", frequency: 1480, attack: 0.001, decay: 0.0433, peak: 0.012 },
            knock(250, 0.0188, 0.025, { from: "strong" }),
        ],
    },
    /** A toggle switch's throw: the lever snaps over centre with the knock of its housing. */
    toggle: {
        masterGain: 0.293,
        layers: [
            { kind: "noise", filterType: "bandpass", filterFrequency: 1650, filterQ: 2, attack: 0.001, decay: 0.00381, peak: 0.14 },
            knock(330, 0.0288, 0.04),
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 2650, filterQ: 3, attack: 0.001, decay: 0.00553, peak: 0.18 },
            { from: "strong", kind: "noise", filterType: "bandpass", filterFrequency: 250, filterQ: 2, attack: 0.001, decay: 0.0259, peak: 0.3 },
        ],
    },
    /** A latch releasing: the catch lets go as the bolt slides back, in one motion. */
    open: {
        masterGain: 0.869,
        layers: [
            { kind: "noise", filterType: "bandpass", filterFrequency: 2150, filterQ: 3, attack: 0.001, decay: 0.00375, peak: 0.16 },
            { kind: "noise", filterType: "bandpass", filterFrequency: 1160, glideTo: 2150, glideTime: 0.05, filterQ: 2, attack: 0.02, decay: 0.031, peak: 0.08 },
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 1330, filterQ: 5, attack: 0.001, decay: 0.00763, peak: 0.14 },
            { from: "strong", kind: "noise", filterType: "bandpass", filterFrequency: 290, filterQ: 2, attack: 0.001, decay: 0.0265, peak: 0.25 },
        ],
    },
    /** A latch catching: the bolt slides home into the catch, in one motion. */
    close: {
        masterGain: 0.96,
        layers: [
            { kind: "noise", filterType: "bandpass", filterFrequency: 2150, glideTo: 1080, glideTime: 0.04, filterQ: 2, attack: 0.015, decay: 0.0288, peak: 0.04 },
            { kind: "noise", filterType: "bandpass", filterFrequency: 1000, filterQ: 4, attack: 0.001, decay: 0.00898, peak: 0.22 },
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 3300, filterQ: 2, attack: 0.001, decay: 0.003, peak: 0.1 },
            { from: "strong", kind: "noise", filterType: "bandpass", filterFrequency: 180, filterQ: 2, attack: 0.001, decay: 0.0302, peak: 0.3 },
        ],
    },
    /** One dry struck bar, F, C and A at once, spread so no two notes rub, hit with something hard: a short chord, not a bell. */
    success: {
        masterGain: 0.662,
        layers: [
            contact(2200, 0.05),
            ...struck(698.46, 0.121, 0.03, BAR),
            ...struck(1046.5, 0.149, 0.026, BAR),
            ...struck(1760, 0.106, 0.018, BAR),
            { from: "strong", kind: "noise", filterType: "bandpass", filterFrequency: 4150, filterQ: 2, attack: 0.001, decay: 0.00324, peak: 0.06 },
        ],
    },
    /** One firm low knock with a dull D in it and the F a tenth above, like a handle that is locked. */
    error: {
        masterGain: 0.59,
        layers: [
            { kind: "noise", filterType: "bandpass", filterFrequency: 430, filterQ: 4, attack: 0.001, decay: 0.0173, peak: 0.3 },
            ...struck(293.66, 0.0678, 0.045, BAR),
            ...struck(698.46, 0.0522, 0.02, BAR),
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 1830, filterQ: 3, attack: 0.001, decay: 0.006, peak: 0.1 },
            { from: "strong", kind: "noise", filterType: "bandpass", filterFrequency: 150, filterQ: 2, attack: 0.001, decay: 0.0345, peak: 0.3 },
        ],
    },
    /** A short carriage slide, rising as it passes. */
    navigate: {
        masterGain: 0.804,
        layers: [
            { kind: "noise", filterType: "bandpass", filterFrequency: 750, glideTo: 1400, glideTime: 0.13, filterQ: 1.8, attack: 0.05, decay: 0.096, peak: 0.1 },
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 2500, filterQ: 4, attack: 0.001, decay: 0.003, peak: 0.1 },
            { from: "strong", kind: "noise", filterType: "bandpass", filterFrequency: 250, filterQ: 1.5, attack: 0.04, decay: 0.109, peak: 0.12 },
        ],
    },
    /** One dry struck fifth, D and A: between success and error. */
    warning: {
        masterGain: 0.484,
        layers: [
            contact(2000, 0.05),
            ...struck(587.33, 0.0922, 0.04, BAR),
            ...struck(880, 0.0969, 0.03, BAR),
            { from: "strong", kind: "noise", filterType: "bandpass", filterFrequency: 300, filterQ: 2, attack: 0.001, decay: 0.0265, peak: 0.25 },
        ],
    },
    /** A small motor spinning up and winding down: one soft, low whirr over about a second. */
    loading: {
        masterGain: 0.223,
        layers: [
            { kind: "noise", filterType: "bandpass", filterFrequency: 500, filterQ: 1, attack: 0.35, decay: 0.848, peak: 0.03 },
            { kind: "tone", waveform: "sine", frequency: 233.08, attack: 0.35, decay: 0.965, peak: 0.015 },
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 1000, filterQ: 2, attack: 0.35, decay: 0.883, peak: 0.005 },
            { from: "strong", kind: "noise", filterType: "lowpass", filterFrequency: 250, filterQ: 0.7, attack: 0.35, decay: 0.807, peak: 0.04 },
        ],
    },
    /** One dry struck bar, lower than success: a result is there. */
    ready: {
        masterGain: 0.546,
        layers: [
            contact(2000, 0.05),
            ...struck(523.25, 0.178, 0.05, BAR),
            ...struck(261.63, 0.242, 0.03, BAR, { from: "strong" }),
        ],
    },
    /** One metal bell, A and E struck together, ringing longer than the rest. */
    attention: {
        masterGain: 0.481,
        layers: [
            contact(2500, 0.04),
            ...struck(880, 0.231, 0.04, BAR),
            ...struck(1318.51, 0.242, 0.03, BAR),
            { from: "strong", kind: "noise", filterType: "bandpass", filterFrequency: 300, filterQ: 2, attack: 0.001, decay: 0.0265, peak: 0.25 },
        ],
    },
    /** An odometer drum turning: one dry slide that rises with the count and lasts as long as the roll. */
    count: {
        masterGain: 0.654,
        layers: [
            { stretch: true, kind: "noise", filterType: "bandpass", filterFrequency: 500, glideTo: 900, glideTime: 0.6, filterQ: 2, attack: 0.1, decay: 0.648, peak: 0.06 },
            { stretch: true, from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 1900, glideTo: 3300, glideTime: 0.6, filterQ: 4, attack: 0.1, decay: 0.606, peak: 0.03 },
            { stretch: true, from: "strong", kind: "noise", filterType: "bandpass", filterFrequency: 220, filterQ: 2, attack: 0.1, decay: 0.5, peak: 0.1 },
        ],
        vary: { pitch: 0.03, level: 0.1 },
    },
};

/**
 * The `press` theme: the same fourteen cues, each one press of a premium
 * switch, built from the Subscribe press and keycaps in DawoodUI's Artasaka
 * preview. A press clicks at 4 kHz over a deep note that swells in and rings
 * for about a second; it lets go with a lighter click at 4.8 kHz, 5 dB down.
 * Quick taps walk up a chord, C, E, A, as the video's presses do.
 *
 * Keys are the video's keycaps: one lands with a click over a body that drops
 * 480 to 305 Hz, and lifts off with a quieter click over 676 to 414 Hz.
 *
 * Outcomes are not touched, so they do not click: they are the press's note
 * on its own, with a chord that says what happened. Success is major and
 * rings into a small room, error a low, spread minor over a soft thump,
 * warning a plain fifth between them, attention a high bell ringing longest,
 * and loading one soft, low note that swells in and fades.
 *
 * Arranged for emphasis like the other themes: layers marked from "normal"
 * are ornament that subtle leaves out (a note's upper partials, the release),
 * and each cue has a layer only strong plays.
 */
const C2 = 65.41, E2 = 82.41, A2 = 110;
const G3 = 196, A3 = 220;
const C4 = 261.63, E4 = 329.63, G4 = 392, A4 = 440;
const C5 = 523.25, E5 = 659.25, A5 = 880;
/** The video's presses: the press rings at 4 kHz, the release at 4.8 kHz. */
const PRESS_HZ = 4000;
const RELEASE_HZ = 4800;
/** The video's walk: C, E and A over its first note. */
const WALK = [0, 4, 9];
/** A note that rings as the video's does: about 45 dB a second. */
const STEADY = { pitch: 0, level: 0.08 };
const PRESS = {
    /** The Subscribe press: a click over a deep C that swells in and rings, and a lighter click letting go. Quick taps walk C, E, A. */
    tap: {
        masterGain: 0.0431,
        layers: [...click(PRESS_HZ, 0.53), ...note(C2, 1.36, 0.12), thud(200, 0.0472, 0.15, { from: "strong" })],
        release: click(RELEASE_HZ, 0.28, { from: "normal" }),
        walk: WALK,
        vary: STEADY,
    },
    /** A keycap landing, and lifting off quieter as the key comes up. Every stroke a slightly different key. */
    type: {
        masterGain: 0.297,
        layers: [...click(4200, 0.25), knock(305, 0.0288, 0.04), knock(150, 0.0424, 0.03, { from: "strong" })],
        release: [ring(4100, 0.08, { from: "normal" }), ring(1000, 0.06, { filterQ: 2, from: "normal" }), knock(414, 0.0216, 0.012, { from: "normal" })],
        vary: { pitch: 0.08, level: 0.15 },
    },
    /** A detent: only the light click, over a small, high knock. A later option knocks higher, an earlier one lower. */
    select: {
        masterGain: 0.442,
        layers: [...click(RELEASE_HZ, 0.12), knock(700, 0.0196, 0.02), knock(350, 0.0326, 0.02, { from: "strong" })],
        release: [ring(RELEASE_HZ, 0.03, { from: "normal" })],
        vary: { pitch: 0.02, level: 0.1 },
    },
    /** A switch thrown: the press and a firm knock over a short, deep E, letting go lighter. Switching off knocks upward. */
    toggle: {
        masterGain: 0.0571,
        layers: [...click(PRESS_HZ, 0.245), knock(330, 0.0389, 0.05), ...note(E2, 0.324, 0.06), knock(165, 0.05, 0.05, { from: "strong" })],
        release: click(RELEASE_HZ, 0.1, { from: "normal" }),
        vary: STEADY,
    },
    /** A lid lifting: the light click, a knock, air drawn upward and an A swelling in under it. Quick opens walk. */
    open: {
        masterGain: 0.0857,
        layers: [
            ...click(RELEASE_HZ, 0.15),
            knock(440, 0.0363, 0.03),
            air(1600, 3200, 0.035, 0.1),
            ...note(A2, 0.827, 0.08),
            thud(260, 0.039, 0.12, { from: "strong" }),
        ],
        release: [ring(RELEASE_HZ, 0.05, { from: "normal" })],
        walk: WALK,
        vary: STEADY,
    },
    /** A lid shutting: a lower, duller click, air pushed out and down, and a low C, damped short, as it seats. */
    close: {
        masterGain: 0.099,
        layers: [
            ...click(3200, 0.204),
            knock(130.81, 0.0432, 0.06),
            air(1800, 700, 0.04, 0.1, { from: "normal" }),
            ...note(C2, 0.258, 0.08),
            thud(180, 0.0364, 0.2, { from: "strong" }),
        ],
        vary: STEADY,
    },
    /** No click: C, G and E struck at once, swelling in and ringing long into a small room. */
    success: {
        masterGain: 0.102,
        layers: [...note(C4, 1.47, 0.072), ...note(G4, 1.51, 0.06), ...note(E5, 1.36, 0.045), ...note(C4 / 2, 1.64, 0.036, { from: "strong" })],
        room: LANDED,
    },
    /** No click: a low A with the C an octave and a third above, minor and spread, over a soft thump. A calm refusal. */
    error: {
        masterGain: 0.0708,
        layers: [
            ...note(A2, 0.487, 0.12),
            ...note(C5, 0.461, 0.04),
            thud(200, 0.0545, 0.2, { attack: 0.01 }),
            thud(120, 0.0727, 0.2, { from: "strong" }),
        ],
    },
    /** A swipe: the light click with air sliding past it. Going back, the air falls. */
    navigate: {
        masterGain: 0.837,
        layers: [
            ...click(RELEASE_HZ, 0.15),
            air(600, 1400, 0.0877, 0.12, { filterQ: 1 }),
            knock(587.33, 0.0207, 0.015, { from: "normal" }),
            thud(300, 0.0487, 0.12, { from: "strong" }),
        ],
        vary: STEADY,
    },
    /** No click: a plain fifth, A and E, between success and error. Heads up, nothing broke. */
    warning: {
        masterGain: 0.0716,
        layers: [...note(A3, 0.905, 0.096), ...note(E4, 0.84, 0.072), ...note(A3 / 2, 1.01, 0.048, { from: "strong" })],
    },
    /** No click: one warm, low G that swells in softly and fades within about a second. Work has begun. */
    loading: {
        masterGain: 0.0661,
        layers: [
            { kind: "tone", waveform: "sine", frequency: G3, attack: 0.35, decay: 0.889, peak: 0.05 },
            { from: "normal", kind: "tone", waveform: "sine", frequency: G3 * 2, attack: 0.35, decay: 0.9, peak: 0.01 },
            { from: "strong", kind: "tone", waveform: "sine", frequency: G3 / 2, attack: 0.35, decay: 0.969, peak: 0.03 },
        ],
    },
    /** No click: one long, warm G below success, ringing into a small room. A result is there. */
    ready: {
        masterGain: 0.0983,
        layers: [...note(G3, 1.78, 0.108), ...note(G3 / 2, 1.98, 0.054, { from: "strong" })],
        room: LANDED,
    },
    /** No click: A and E over A, high and bell-like, ringing longest. Blocked until the user answers. */
    attention: {
        masterGain: 0.125,
        layers: [...note(A4, 2.34, 0.067), ...note(E5, 2.24, 0.048), ...note(A5, 1.89, 0.024), ...note(A4 / 2, 2.61, 0.034, { from: "strong" })],
    },
    /** A number rolling: a dial spun, air rising with it for as long as the roll (falling counting down). */
    count: {
        masterGain: 0.362,
        layers: [
            { stretch: true, kind: "noise", filterType: "bandpass", filterFrequency: 900, glideTo: 1800, glideTime: 0.6, filterQ: 2, attack: 0.15, decay: 0.568, peak: 0.08 },
            { stretch: true, kind: "noise", filterType: "lowpass", filterFrequency: 200, glideTo: 500, glideTime: 0.6, filterQ: 0.7, attack: 0.15, decay: 0.594, peak: 0.06 },
            { stretch: true, from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 2600, glideTo: 3600, glideTime: 0.6, filterQ: 4, attack: 0.15, decay: 0.587, peak: 0.02 },
            { stretch: true, from: "strong", kind: "noise", filterType: "lowpass", filterFrequency: 150, glideTo: 300, glideTime: 0.6, filterQ: 0.7, attack: 0.15, decay: 0.568, peak: 0.08 },
        ],
        vary: { pitch: 0.02, level: 0.1 },
    },
};

/**
 * The sound palette — the fourteen canonical cues, built from layers.ts.
 * Each cue names an interface job, not a synthesis style, and has its own
 * distinct shape rather than being a volume/EQ tweak on the same click.
 * Retired v0.2 names live on as aliases until 1.0.
 */
// Each cue is arranged for three emphases: layers marked from "normal" are
// ornament that subtle leaves out, and each cue has one layer of its own that
// only strong plays.
//
// A cue's press strikes at once, and so does its release: no layer starts late.
//
// Premium, not playful: clicks and knocks are filtered noise, tones are
// struck objects (`struck`): a marimba bar for mallets, a free bar for glass,
// each mode dying faster the higher it is, touched off by the mallet's
// `contact`. Chords are spread so no two notes rub. Rooms are short enough
// to hear as space rather than echo, and no audible tone slides in pitch: a
// knock's 18 ms drop is heard as the body of a tap, not as a slide.
// Nothing is centred above 5 kHz, so the palette holds up through a working day.
const RECIPES = {
    /**
     * A small glassy tap — buttons, links, nav. A nail's tick, a soft knock of
     * body, then the glass ringing briefly: the fundamental is two near-identical modes that beat
     * slowly, as real glass shimmers, and the upper mode sits at the glass-bar
     * ratio 2.76x, dying faster than the fundamental.
     */
    tap: {
        masterGain: 0.39,
        layers: [
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 4500, filterQ: 1.2, attack: 0.001, decay: 0.00242, peak: 0.03 },
            { kind: "tone", waveform: "sine", frequency: 1174.66, attack: 0.001, decay: 0.18, peak: 0.0135 },
            { kind: "tone", waveform: "sine", frequency: 1180, attack: 0.001, decay: 0.164, peak: 0.008 },
            { kind: "tone", waveform: "sine", frequency: 3242, attack: 0.001, decay: 0.0827, peak: 0.0055 },
            knock(300, 0.0261, 0.02, { from: "normal" }),
            { from: "strong", kind: "tone", waveform: "sine", frequency: 587.33, attack: 0.002, decay: 0.246, peak: 0.009 },
            knock(150, 0.0489, 0.014, { from: "strong" }),
        ],
        vary: { pitch: 0.012, level: 0.12 },
    },
    /**
     * One keyboard keystroke — the switch's click, the keycap's clack, and the
     * thock of bottoming out, all in one strike. Every stroke
     * lands at a slightly different pitch and weight, like different keys.
     */
    type: {
        masterGain: 0.375,
        layers: [
            { kind: "noise", filterType: "bandpass", filterFrequency: 3900, filterQ: 0.8, attack: 0.001, decay: 0.00517, peak: 0.08 },
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 1550, filterQ: 3.5, attack: 0.001, decay: 0.0144, peak: 0.22 },
            { kind: "noise", filterType: "bandpass", filterFrequency: 310, filterQ: 2.5, attack: 0.002, decay: 0.0254, peak: 0.35 },
            { from: "strong", kind: "noise", filterType: "bandpass", filterFrequency: 140, filterQ: 2, attack: 0.002, decay: 0.037, peak: 0.45 },
        ],
        vary: { pitch: 0.07, level: 0.2 },
    },
    /** A crisp detent over a small wooden knock — dropdowns, menus, lists. */
    select: {
        masterGain: 0.306,
        layers: [
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 2800, filterQ: 2.2, attack: 0.001, decay: 0.00749, peak: 0.16 },
            knock(415, 0.0194, 0.03),
            knock(208, 0.0313, 0.025, { from: "strong" }),
        ],
    },
    /** A switch snapping over: one crisp click with a small knock of body. Switching off knocks upward. */
    toggle: {
        masterGain: 0.24,
        layers: [
            { kind: "noise", filterType: "bandpass", filterFrequency: 1830, filterQ: 1.6, attack: 0.001, decay: 0.0156, peak: 0.12 },
            knock(330, 0.0339, 0.045),
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 3150, filterQ: 1.6, attack: 0.001, decay: 0.0124, peak: 0.08 },
            knock(165, 0.0375, 0.025, { from: "strong" }),
        ],
    },
    /** Air drawing upward with a light note swelling inside it: one breath as a panel opens — menus, drawers, dialogs. */
    open: {
        masterGain: 0.335,
        layers: [
            { kind: "noise", filterType: "bandpass", filterFrequency: 600, glideTo: 1500, glideTime: 0.1, filterQ: 1.4, attack: 0.05, decay: 0.0558, peak: 0.168 },
            { kind: "tone", waveform: "sine", frequency: 659.25, attack: 0.05, decay: 0.165, peak: 0.015 },
            { from: "normal", kind: "tone", waveform: "sine", frequency: 1318.51, attack: 0.05, decay: 0.0883, peak: 0.005 },
            { from: "strong", kind: "noise", filterType: "lowpass", filterFrequency: 250, filterQ: 0.7, attack: 0.04, decay: 0.0779, peak: 0.12 },
        ],
    },
    /** The same air falling shut over a low, damped mallet note — closing and dismissing. */
    close: {
        masterGain: 0.258,
        layers: [
            { kind: "noise", filterType: "bandpass", filterFrequency: 1400, glideTo: 540, glideTime: 0.07, filterQ: 1.4, attack: 0.02, decay: 0.054, peak: 0.216 },
            { kind: "tone", waveform: "sine", frequency: 261.63, attack: 0.003, decay: 0.104, peak: 0.02 },
            { from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 350, filterQ: 2, attack: 0.001, decay: 0.0273, peak: 0.2 },
            { from: "strong", kind: "noise", filterType: "bandpass", filterFrequency: 165, filterQ: 2, attack: 0.001, decay: 0.0345, peak: 0.3 },
        ],
    },
    /** One soft mallet chord, C, G and E spread wide so no two notes rub, struck with felt in a small room — confirmed completion. */
    success: {
        masterGain: 0.566,
        layers: [
            contact(1500, 0.04),
            ...struck(523.25, 0.333, 0.022, MALLET),
            ...struck(783.99, 0.391, 0.02, MALLET),
            ...struck(1318.51, 0.335, 0.014, MALLET),
            ...struck(261.63, 0.469, 0.02, MALLET, { from: "strong" }),
        ],
        room: LANDED,
    },
    /** One muted low mallet chord, D with the F a tenth above, spread so it never rubs, short — a calm, recoverable refusal. */
    error: {
        masterGain: 0.501,
        layers: [
            contact(900, 0.05),
            ...struck(293.66, 0.138, 0.04, MALLET),
            ...struck(698.46, 0.106, 0.018, MALLET),
            { from: "strong", kind: "noise", filterType: "bandpass", filterFrequency: 250, filterQ: 1.5, attack: 0.001, decay: 0.0273, peak: 0.2 },
        ],
    },
    /** A soft whoosh whose air rises as it passes — routes, pages, galleries, carousels. */
    navigate: {
        masterGain: 0.322,
        layers: [
            { kind: "noise", filterType: "bandpass", filterFrequency: 400, glideTo: 1100, glideTime: 0.21, filterQ: 1.2, attack: 0.12, decay: 0.111, peak: 0.18 },
            { from: "normal", kind: "noise", filterType: "lowpass", filterFrequency: 540, filterQ: 0.7, attack: 0.09, decay: 0.109, peak: 0.045 },
            { from: "strong", kind: "noise", filterType: "lowpass", filterFrequency: 230, filterQ: 0.7, attack: 0.1, decay: 0.144, peak: 0.1 },
        ],
    },
    /** One mallet fifth, A and E, neither bright nor low: between success and error. */
    warning: {
        masterGain: 0.437,
        layers: [
            contact(1200, 0.04),
            ...struck(440, 0.163, 0.038, MALLET),
            ...struck(659.25, 0.145, 0.03, MALLET),
            ...struck(220, 0.261, 0.02, MALLET, { from: "strong" }),
        ],
    },
    /** One low, muted note that swells in and fades away over about a second, never struck: work has begun, nothing has landed. */
    loading: {
        masterGain: 0.106,
        layers: [
            { kind: "tone", waveform: "sine", frequency: 196, attack: 0.35, decay: 0.969, peak: 0.03 },
            { kind: "tone", waveform: "sine", frequency: 392, attack: 0.35, decay: 0.9, peak: 0.01 },
            { from: "normal", kind: "noise", filterType: "lowpass", filterFrequency: 500, filterQ: 0.7, attack: 0.35, decay: 0.844, peak: 0.006 },
            { from: "strong", kind: "tone", waveform: "sine", frequency: 98, attack: 0.35, decay: 1.04, peak: 0.02 },
        ],
    },
    /**
     * One warm glass note, G, below success, in its small room: a result is
     * there. A second mode a hertz sharp lets the glass shimmer once as it
     * rings, too slow to be heard as a wobble.
     */
    ready: {
        masterGain: 0.467,
        layers: [
            contact(1500, 0.02),
            ...struck(392, 0.497, 0.026, BAR),
            { kind: "tone", waveform: "sine", frequency: 393.2, attack: 0.003, decay: 0.462, peak: 0.012 },
            ...struck(196, 0.612, 0.016, BAR, { from: "strong" }),
        ],
        room: LANDED,
    },
    /**
     * One high glass bell, A and E struck together, ringing longest: blocked
     * until the user answers. The A's twin sits 2 Hz sharp, so the bell swells
     * once rather than warbling.
     */
    attention: {
        masterGain: 0.551,
        layers: [
            contact(2500, 0.02),
            ...struck(880, 0.599, 0.018, BAR),
            { kind: "tone", waveform: "sine", frequency: 882, attack: 0.003, decay: 0.57, peak: 0.01 },
            ...struck(1318.51, 0.559, 0.014, BAR),
            ...struck(440, 0.649, 0.012, BAR, { from: "strong" }),
        ],
    },
    /**
     * A number rolling to a new value: one breath of air that rises with the
     * count (and falls counting down) over a soft glass note, lasting as long
     * as the roll.
     */
    count: {
        masterGain: 0.336,
        layers: [
            { stretch: true, kind: "noise", filterType: "bandpass", filterFrequency: 700, glideTo: 1400, glideTime: 0.6, filterQ: 1.2, attack: 0.15, decay: 0.611, peak: 0.05 },
            { stretch: true, kind: "tone", waveform: "sine", frequency: 1046.5, attack: 0.15, decay: 0.721, peak: 0.012 },
            { stretch: true, from: "normal", kind: "noise", filterType: "bandpass", filterFrequency: 2000, glideTo: 3200, glideTime: 0.6, filterQ: 2, attack: 0.15, decay: 0.652, peak: 0.02 },
            { stretch: true, from: "strong", kind: "tone", waveform: "sine", frequency: 261.63, attack: 0.15, decay: 0.758, peak: 0.015 },
        ],
        vary: { pitch: 0.02, level: 0.12 },
    },
};
/** All canonical cue names, derived from the recipe palette. */
const sounds = Object.keys(RECIPES);
/** The v0.2 palette, mapped to the cue that now does each job. Removed in 1.0. */
const ALIASES = {
    chime: "success",
    sparkle: "success",
    droplet: "close",
    bloom: "open",
    whisper: "select",
    tick: "select",
    press: "tap",
    release: "tap",
    page: "navigate",
    pulse: "tap",
    scan: "select",
    arrival: "navigate",
};
const own$1 = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
/** Maps a canonical or deprecated name to its canonical cue; anything else is `null`. */
function resolveSound(value) {
    if (typeof value !== "string")
        return null;
    if (own$1(RECIPES, value))
        return value;
    return own$1(ALIASES, value) ? ALIASES[value] : null;
}

/**
 * Themes — finished materials for the same fourteen cues. A theme changes how a
 * cue sounds, never what it means, so every theme carries every cue.
 */
const THEMES = {
    default: RECIPES,
    mech: MECH,
    bubble: BUBBLE,
    press: PRESS,
};
/** The built-in theme names. */
const themes = Object.keys(THEMES);
function isThemeName(value) {
    return typeof value === "string" && Object.prototype.hasOwnProperty.call(THEMES, value);
}

/**
 * Context-aware shaping: how a cue bends to the interaction that played it.
 *
 *   semantic cue + interaction context + emphasis = rendered sound
 *
 * A shape scales a recipe's pitch, level, and length, plus its bright layers
 * (centred at or above BRIGHT_HZ) and its tail (layers that start late). Every
 * factor is curated here and clamped, so a cue always stays recognisably itself
 * and context that is missing leaves the canonical sound untouched.
 */
const IDENTITY = { pitch: 1, level: 1, length: 1, bright: 1, tail: 1, sweep: 1, time: 1 };
const BRIGHT_HZ = 2500;
/**
 * How much the action matters. Most of the difference is the arrangement
 * (which layers play, see `arrangement`); this shape only leans on it.
 */
const EMPHASIS = {
    subtle: { level: 0.8, length: 0.85, bright: 0.75 },
    normal: {},
    strong: { pitch: 0.98, level: 1.08, length: 1.2, bright: 1.1 },
};
const RANK = { subtle: 0, normal: 1, strong: 2 };
/** `type`: bigger keys sound bigger; deleting sits lower than writing. */
const KEYS = {
    printable: {},
    space: { pitch: 0.86, level: 1.08, length: 1.15 },
    delete: { pitch: 0.92, level: 0.9, bright: 0.8 },
    enter: { pitch: 0.8, level: 1.12, length: 1.25 },
};
/** `tap`: the glass answers to what touched it. */
const INPUTS = {
    mouse: {},
    touch: { pitch: 0.97, level: 0.92, bright: 0.45 },
    pen: { pitch: 1.02, bright: 1.3 },
    keyboard: { pitch: 0.94, length: 0.85, bright: 0.7 },
};
/** `select`: a later option rises, an earlier one falls. Perceptible, never melodic. */
const DIRECTION_STEP = 0.05;
/** Repeats closer than FAST_MS play fully lightened; slower than SLOW_MS, not at all. */
const FAST_MS = 70;
const SLOW_MS = 220;
const CADENCE_CUES = new Set(["type", "select", "tap", "toggle", "navigate"]);
/** `count` is written at COUNT_MS; `duration` stretches it within these bounds. */
const COUNT_MS = 800;
const COUNT_MIN_MS = 300;
const COUNT_MAX_MS = 2000;
/** Going back plays these cues' glides backwards, so they fall. */
const REVERSIBLE = new Set(["navigate", "toggle", "count"]);
/** The layers an emphasis plays: subtle strips ornament, strong adds its own layer. */
function arrangement(layers, emphasis) {
    return layers.filter((layer) => RANK[emphasis] >= RANK[layer.from ?? "subtle"]);
}
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
function resolveEmphasis(value) {
    return typeof value === "string" && own(EMPHASIS, value) ? value : "normal";
}
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const DIRECTIONS = { forward: 1, back: -1 };
/**
 * The context a caller passed to `play()`, in the shape bindings produce.
 * Unknown values are left out, so the cue plays as it would with none.
 */
function contextFrom(options) {
    const context = {};
    if (!options)
        return context;
    const { direction, key, input, duration } = options;
    if (typeof direction === "string" && own(DIRECTIONS, direction))
        context.direction = DIRECTIONS[direction];
    if (typeof key === "string" && own(KEYS, key))
        context.key = key;
    if (typeof input === "string" && own(INPUTS, input))
        context.input = input;
    if (typeof duration === "number" && Number.isFinite(duration))
        context.duration = clamp(duration, COUNT_MIN_MS, COUNT_MAX_MS);
    return context;
}
function cadence(sinceLastMs) {
    const speed = Math.min(1, Math.max(0, (SLOW_MS - sinceLastMs) / (SLOW_MS - FAST_MS)));
    return { level: 1 - 0.22 * speed, length: 1 - 0.25 * speed, bright: 1 - 0.2 * speed, tail: 1 - 0.8 * speed };
}
/** The combined shape for one play of `sound`. */
function shapeFor(sound, context, emphasis, sinceLastMs) {
    const parts = [EMPHASIS[emphasis]];
    if (CADENCE_CUES.has(sound))
        parts.push(cadence(sinceLastMs));
    if (sound === "type" && context.key)
        parts.push(KEYS[context.key]);
    if (sound === "tap" && context.input)
        parts.push(INPUTS[context.input]);
    if (sound === "select" && context.direction)
        parts.push({ pitch: 1 + DIRECTION_STEP * context.direction });
    if (sound === "count" && context.duration)
        parts.push({ time: context.duration / COUNT_MS });
    if (REVERSIBLE.has(sound) && context.direction === -1)
        parts.push({ sweep: -1 });
    const shape = { ...IDENTITY };
    for (const part of parts) {
        for (const key of Object.keys(part))
            shape[key] *= part[key];
    }
    return shape;
}
/** What `shape` does to one layer, bounded so no context can run away with a cue. */
function layerFactors(layer, shape) {
    const frequency = layer.kind === "tone" ? layer.frequency : layer.filterFrequency;
    const gain = shape.level * (frequency >= BRIGHT_HZ ? shape.bright : 1) * ((layer.offset ?? 0) > 0 ? shape.tail : 1);
    return {
        pitch: clamp(shape.pitch, 0.75, 1.25),
        gain: clamp(gain, 0, 1.5),
        length: clamp(shape.length, 0.6, 1.6),
    };
}

/**
 * The shared output stage: one boosted bus through a subsonic cut and a
 * soft clip, plus one faint stereo room every cue rings into. Built once per
 * AudioContext; also owns the shared noise buffer noise layers loop from.
 */
const OUTPUT_GAIN = 5.8;
const CLIP_KNEE = 0.7;
const CLIP_CURVE_POINTS = 1025;
/** Below this nothing is heard, but deep notes would still spend headroom on it. */
const SUBSONIC_HZ = 40;
/** Seconds of shared noise. Noise layers loop it from a random point, so none is made per play. */
const NOISE_SECONDS = 2;
/** How long a silenced voice takes to fade: short enough to hear as at once, long enough not to click. */
const SILENCE_FADE = 0.015;
/**
 * Fades every voice sounding on `bus`, for a mute that should be heard at once.
 * ponytail: the room's own tail, a quarter of a second and 22 dB down, rings out; gate its return if that is ever heard
 */
function silence(context, bus) {
    const now = context.currentTime;
    for (const { gain } of bus.live) {
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(gain.value, now);
        gain.linearRampToValueAtTime(0, now + SILENCE_FADE);
    }
    bus.live.clear();
}
const NOISE_SEED = 1;
function seeded(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
        mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 2 ** 32;
    };
}
function fillNoise(data) {
    const random = seeded(NOISE_SEED);
    for (let i = 0; i < data.length; i++)
        data[i] = 2 * random() - 1;
}
function getNoise(context, bus) {
    if (bus.noise)
        return bus.noise;
    const length = Math.max(1, Math.floor(NOISE_SECONDS * context.sampleRate));
    bus.noise = context.createBuffer(1, length, context.sampleRate);
    fillNoise(bus.noise.getChannelData(0));
    return bus.noise;
}
/**
 * The shared room: a short, dense burst of reflections that dies away over
 * ROOM_SECONDS. Reflections within the first 80 ms or so are what move a sound
 * out of the listener's head (Begault); a longer tail only adds distance. Its
 * two channels are independent noise, so the room is wide while the sound
 * itself stays centred.
 */
const ROOM_SECONDS = 0.25;
/** The gap before the first reflection: a small room's nearest wall. */
const ROOM_PREDELAY = 0.008;
/** Reflections are low-passed here: walls swallow the highs first. */
const ROOM_LOWPASS = 3500;
/** How much of every cue reaches the room: about 22 dB down, faint enough to feel rather than hear. */
const ROOM_SEND = 0.08;
/** 60 dB of decay, the conventional end of a room's tail. */
const ROOM_DECAY_DB = 60;
const ROOM_SEEDS = [3110, 5639];
const ROOM_REFLECTIONS_PER_SECOND = 48000;
function fillRoom(data, rate, seed) {
    const random = seeded(seed);
    const fall = (ROOM_DECAY_DB / 20) * Math.LN10;
    const reflections = new Float32Array(Math.floor(ROOM_SECONDS * ROOM_REFLECTIONS_PER_SECOND));
    let energy = 0;
    for (let i = 0; i < reflections.length; i++) {
        const t = i / ROOM_REFLECTIONS_PER_SECOND;
        reflections[i] = t < ROOM_PREDELAY ? 0 : (2 * random() - 1) * Math.exp((-fall * t) / ROOM_SECONDS);
        energy += reflections[i] * reflections[i];
    }
    const scale = 1 / Math.sqrt(energy);
    for (let i = 0; i < reflections.length; i++) {
        const at = (i / ROOM_REFLECTIONS_PER_SECOND) * rate;
        const sample = Math.floor(at);
        const late = at - sample;
        if (sample < data.length)
            data[sample] += reflections[i] * scale * (1 - late);
        if (sample + 1 < data.length)
            data[sample + 1] += reflections[i] * scale * late;
    }
}
/** Builds the room once, feeding `output`; returns the node sends connect to. */
function buildRoom(context, output) {
    const rate = context.sampleRate;
    const length = Math.max(1, Math.floor(ROOM_SECONDS * rate));
    const impulse = context.createBuffer(2, length, rate);
    ROOM_SEEDS.forEach((seed, channel) => fillRoom(impulse.getChannelData(channel), rate, seed));
    const convolver = context.createConvolver();
    convolver.normalize = false;
    convolver.buffer = impulse;
    const walls = context.createBiquadFilter();
    walls.type = "lowpass";
    walls.frequency.value = ROOM_LOWPASS;
    walls.Q.value = FLAT_Q;
    walls.connect(convolver).connect(output);
    return walls;
}
function softClip(level) {
    const over = Math.abs(level) - CLIP_KNEE;
    if (over <= 0)
        return level;
    const shoulder = 1 - CLIP_KNEE;
    return Math.sign(level) * (CLIP_KNEE + over - (over * over) / (2 * shoulder));
}
/** Builds one context's output bus and room. Engine owns the result and builds it once. */
function createOutput(context) {
    const output = context.createGain();
    output.gain.value = OUTPUT_GAIN;
    const clip = context.createWaveShaper();
    clip.curve = Float32Array.from({ length: CLIP_CURVE_POINTS }, (_, i) => softClip((2 * i) / (CLIP_CURVE_POINTS - 1) - 1));
    const subsonic = context.createBiquadFilter();
    subsonic.type = "highpass";
    subsonic.frequency.value = SUBSONIC_HZ;
    subsonic.Q.value = FLAT_Q;
    output.connect(subsonic).connect(clip).connect(context.destination);
    return { output, room: buildRoom(context, output), noise: null, live: new Set() };
}

/**
 * Rendering: turns one shaped recipe into Web Audio nodes — an oscillator
 * or filtered-noise source per layer, each swelling in along a straight line
 * and dying away exponentially. Every sound rings faintly into the shared
 * room (see output.ts), so it sounds placed in a space.
 *
 * A straight swell is heard from its first moment; an exponential one stays
 * silent for most of its length and then jumps in, heard as a late second hit.
 */
const SOURCE_STOP_PADDING = 0.05;
const DECAY_DB = 60;
const fallTime = (decay) => decay / ((DECAY_DB / 20) * Math.LN10);
const CLEANUP_MARGIN = 0.05;
/** Holds `param` at `from`, then glides it toward the layer's `glideTo`, if any. */
function glide(param, from, layer, startTime) {
    param.setValueAtTime(from, startTime);
    if (layer.glideTo === undefined)
        return;
    param.exponentialRampToValueAtTime(layer.glideTo, startTime + (layer.glideTime ?? layer.attack + layer.decay));
}
/** Swells `param` to the layer's peak along a straight line, then lets it die away. */
function envelope(param, layer, startTime) {
    param.setValueAtTime(0, startTime);
    param.linearRampToValueAtTime(layer.peak, startTime + layer.attack);
    param.setTargetAtTime(0, startTime + layer.attack, fallTime(layer.decay));
}
function renderTone(context, destination, layer, startTime) {
    const oscillator = context.createOscillator();
    oscillator.type = layer.waveform;
    glide(oscillator.frequency, layer.frequency, layer, startTime);
    if (layer.detune)
        oscillator.detune.value = layer.detune;
    const gain = context.createGain();
    envelope(gain.gain, layer, startTime);
    oscillator.connect(gain).connect(destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + layer.attack + layer.decay + SOURCE_STOP_PADDING);
}
function renderNoise(context, bus, destination, layer, startTime) {
    const duration = layer.attack + layer.decay + SOURCE_STOP_PADDING;
    const source = context.createBufferSource();
    source.buffer = getNoise(context, bus);
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = layer.filterType;
    glide(filter.frequency, layer.filterFrequency, layer, startTime);
    if (layer.filterQ !== undefined)
        filter.Q.value = layer.filterQ;
    const gain = context.createGain();
    envelope(gain.gain, layer, startTime);
    source.connect(filter).connect(gain).connect(destination);
    // a different stretch of the same noise every time
    source.start(startTime, Math.random() * NOISE_SECONDS);
    source.stop(startTime + duration);
}
function sourceEnd(layers) {
    return Math.max(...layers.map((layer) => (layer.offset ?? 0) + layer.attack + layer.decay + SOURCE_STOP_PADDING));
}
const nudge = (amount) => 1 + (Math.random() * 2 - 1) * amount;
const STEADY_STRIKE = { pitch: 1, force: 1 };
/** Within one strike, each layer's ring length moves by up to this: same object, a slightly different hit. */
const DECAY_JITTER = 0.1;
/** And each tone's pitch by up to this, about 9 cents: the object's modes never sit exactly the same twice. */
const MODE_JITTER = 0.005;
/** How long a cue's last play takes to fade when the same cue plays again, in seconds. */
const HANDOFF_TIME = 0.08;
/**
 * A cue with notes lets its last play go slower, so a walk overlaps: in the
 * Artasaka press the old note falls about twice as fast once the next lands.
 */
const NOTE_HANDOFF_TIME = 0.4;
/** The Artasaka press lets go 85–95 ms after it presses; a play with no real let-go waits this long. */
const RELEASE_GAP = 0.09;
/**
 * A copy of `layer` bent by the play's context shape and its strike. A cue
 * with `vary` also moves each layer's ring and tone a little on its own, so no
 * two plays match; one without plays exactly. A harder strike raises a noise
 * layer's filter with its level: louder is brighter. A reversed sweep starts
 * where it would have ended. `time` moves every layer's start, and a
 * `stretch` layer lasts as long as the count.
 */
function shaped(layer, shape, strike, vary, walk) {
    const factors = layerFactors(layer, shape);
    const tune = layer.kind === "tone" ? (vary ? nudge(MODE_JITTER) : 1) : strike.force;
    const pitch = factors.pitch * strike.pitch * tune * (layer.note ? walk : 1);
    const peak = layer.peak * factors.gain * strike.force;
    const stretch = layer.stretch ? shape.time : 1;
    const decay = layer.decay * factors.length * stretch * (vary ? nudge(DECAY_JITTER) : 1);
    const start = layer.kind === "tone" ? layer.frequency : layer.filterFrequency;
    const [from, to] = shape.sweep < 0 && layer.glideTo !== undefined ? [layer.glideTo, start] : [start, layer.glideTo];
    const glideTo = to === undefined ? undefined : to * pitch;
    const timing = {
        offset: (layer.offset ?? 0) * shape.time,
        attack: layer.attack * stretch,
        glideTime: layer.glideTime === undefined ? undefined : layer.glideTime * stretch,
    };
    return layer.kind === "tone"
        ? { ...layer, ...timing, frequency: from * pitch, glideTo, peak, decay }
        : { ...layer, ...timing, filterFrequency: from * pitch, glideTo, peak, decay };
}
/**
 * The layers `part` of one play sounds: arranged for its emphasis, bent by its
 * shape, strike and walk, the release starting as the gesture lets go. No Web
 * Audio here, so scripts/sound.mjs renders the same layers offline.
 */
function layersFor({ recipe, emphasis, shape, step }, part) {
    const parts = [];
    if (part !== "release")
        parts.push([recipe.layers, 0]);
    if (part !== "press" && recipe.release)
        parts.push([recipe.release, part === "both" ? RELEASE_GAP : 0]);
    const walk = 2 ** ((recipe.walk?.[step] ?? 0) / 12);
    const { vary } = recipe;
    const strike = vary ? { pitch: nudge(vary.pitch), force: nudge(vary.level) } : STEADY_STRIKE;
    return parts.flatMap(([partLayers, delay]) => arrangement(partLayers, emphasis).map((layer) => {
        const bent = shaped(layer, shape, strike, vary, walk);
        return { ...bent, offset: (bent.offset ?? 0) + delay };
    }));
}
function renderRecipe(context, getBus, voices, sound, played, part) {
    const { recipe, volume } = played;
    const layers = layersFor(played, part);
    if (layers.length === 0)
        return;
    const now = context.currentTime;
    const bus = getBus();
    const { output, room } = bus;
    const master = context.createGain();
    master.gain.value = recipe.masterGain * volume;
    master.connect(output);
    const send = context.createGain();
    send.gain.value = ROOM_SEND * (recipe.room ?? 1);
    master.connect(send).connect(room);
    bus.live.add(master);
    // a release rings with its press rather than replacing it
    if (part !== "release") {
        const last = voices.get(sound);
        if (last) {
            last.gain.gain.setValueAtTime(last.gain.gain.value, now);
            last.gain.gain.exponentialRampToValueAtTime(0.0001, now + last.fade);
        }
        const fade = recipe.layers.some((layer) => layer.note) ? NOTE_HANDOFF_TIME : HANDOFF_TIME;
        voices.set(sound, { gain: master, fade });
    }
    for (const layer of layers) {
        const startTime = now + (layer.offset ?? 0);
        if (layer.kind === "tone")
            renderTone(context, master, layer, startTime);
        else
            renderNoise(context, bus, master, layer, startTime);
    }
    // the room rings on by itself once the last source has fed it
    const cleanupAfterMs = (sourceEnd(layers) + CLEANUP_MARGIN) * 1000;
    setTimeout(() => {
        if (voices.get(sound)?.gain === master)
            voices.delete(sound);
        bus.live.delete(master);
        master.disconnect();
        send.disconnect();
    }, cleanupAfterMs);
}

/**
 * The audio engine — the public playback API (`play`, `press`, `release`,
 * settings) and the shared `AudioContext` lifecycle. It decides what to
 * play; render.ts decides how it sounds, output.ts where it goes.
 * No audio files, no dependencies: synthesis happens live in render.ts.
 */
/** Repeats closer than this walk on to the next step; a longer pause starts the walk again. */
const WALK_GAP_MS = 1000;
let sharedContext = null;
let sharedBus = null;
const voices = new Map();
let enabled = true;
let globalVolume = 1;
let activeTheme = "default";
function normalizeVolume(value, fallback) {
    return typeof value === "number" && Number.isFinite(value)
        ? Math.min(1, Math.max(0, value))
        : fallback;
}
/**
 * Turns sound on or off. Off is heard at once: whatever is ringing fades
 * within a few milliseconds, and a press waiting for its release is forgotten.
 * Preference storage stays with the app.
 */
function setEnabled(value) {
    if (typeof value !== "boolean")
        return;
    enabled = value;
    if (value)
        return;
    held.clear();
    voices.clear();
    if (sharedContext && sharedBus)
        silence(sharedContext, sharedBus);
}
/**
 * Switches the material of future playback. Sounds already playing finish as
 * they started; unknown names are ignored. Preference storage stays with the app.
 */
function setTheme(theme) {
    if (isThemeName(theme))
        activeTheme = theme;
}
/** Sets the volume multiplier for future playback. Preference storage stays with the app. */
function setVolume(value) {
    globalVolume = normalizeVolume(value, globalVolume);
}
/** Browsers refuse audio until the page has been interacted with; where they say so, cuelume doesn't ask. */
function isBlocked() {
    return typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive === false;
}
/**
 * Starts audio now rather than on the first cue. Call it from a user gesture,
 * such as the click that turns sound on: some browsers only start audio
 * there, and a cue played later from code would stay silent. Resolves `true`
 * once cues can sound, `false` while the browser still blocks audio or has no
 * Web Audio. Never rejects.
 */
function unlock() {
    const context = isBlocked() ? null : getAudioContext();
    if (!context)
        return Promise.resolve(false);
    if (context.state === "running")
        return Promise.resolve(true);
    try {
        return context.resume().then(() => context.state === "running", () => false);
    }
    catch {
        // Some browsers throw synchronously when audio is blocked.
        return Promise.resolve(false);
    }
}
function getAudioContext() {
    if (sharedContext)
        return sharedContext;
    if (typeof window === "undefined")
        return null;
    const Ctor = window.AudioContext ??
        window.webkitAudioContext;
    if (!Ctor)
        return null;
    try {
        sharedContext = new Ctor();
    }
    catch {
        return null;
    }
    return sharedContext;
}
/** When each cue last played, for cadence and the walk. Page memory only; never stored. */
const lastPlayedAt = new Map();
/** Where each cue is in its walk. */
const steps = new Map();
/** Presses still waiting for their release: one per cue, or one per gesture when a binding names it. */
const held = new Map();
function sinceLastPlay(sound) {
    const now = performance.now();
    const since = now - (lastPlayedAt.get(sound) ?? -Infinity);
    lastPlayedAt.set(sound, now);
    return since;
}
function play(sound = "tap", options) {
    playInContext(sound, options, contextFrom(options));
}
/** The next step of `sound`'s walk: on while repeats come quickly, back to the first after a pause. */
function stepFor(sound, recipe, sinceLastMs) {
    const length = recipe.walk?.length ?? 0;
    const step = length > 0 && sinceLastMs < WALK_GAP_MS ? ((steps.get(sound) ?? -1) + 1) % length : 0;
    steps.set(sound, step);
    return step;
}
/**
 * Plays the press of a gesture that lets go later: call `release` with the
 * same cue when it lifts. For custom controls that don't use `bind()`, such as
 * a key that presses on pointerdown and lets go on pointerup.
 */
function press(sound = "tap", options) {
    playInContext(sound, options, contextFrom(options), "press");
}
/** Lets go of the cue's last `press`. Plays nothing if that press already let go, or the theme has no release. */
function release(sound = "tap") {
    playInContext(sound, undefined, {}, "release");
}
/**
 * `play`, plus what a binding knows about the interaction. Internal to cuelume.
 * A binding plays the press as the gesture goes down and the release as it
 * lifts; a release with no press waiting plays nothing. `options` and
 * `interaction` are the press's: a release sounds like its press. `gesture`
 * names what is pressing, a key's code, so keys that overlap each let go of
 * their own press; without it a cue holds one press.
 */
function playInContext(sound, options, interaction, part = "both", gesture) {
    const name = resolveSound(sound);
    if (!enabled || !name)
        return;
    if (isBlocked())
        return;
    const holding = gesture ? `${name}:${gesture}` : name;
    let played;
    if (part === "release") {
        const pressed = held.get(holding);
        if (!pressed)
            return;
        held.delete(holding);
        played = pressed;
    }
    else {
        // the press before this one is over, even if this play turns out silent
        held.delete(holding);
        const volume = globalVolume * normalizeVolume(options?.volume, 1);
        if (volume === 0)
            return;
        const requested = options?.theme;
        const recipe = THEMES[isThemeName(requested) ? requested : activeTheme][name];
        const emphasis = resolveEmphasis(options?.emphasis);
        const since = sinceLastPlay(name);
        played = { recipe, volume, emphasis, shape: shapeFor(name, interaction, emphasis, since), step: stepFor(name, recipe, since) };
        if (part === "press")
            held.set(holding, played);
    }
    const context = getAudioContext();
    if (!context)
        return;
    // ponytail: bus built lazily inside render, only once a layer will actually sound
    const getBus = () => (sharedBus ?? (sharedBus = createOutput(context)));
    if (context.state === "running") {
        renderRecipe(context, getBus, voices, name, played, part);
    }
    else {
        try {
            void context.resume().then(() => {
                if (enabled && context.state === "running")
                    renderRecipe(context, getBus, voices, name, played, part);
            }, () => { });
        }
        catch {
            // Some browsers throw synchronously when audio is blocked.
        }
    }
}

/**
 * Declarative binding — one call to `bind()` wires up every element
 * carrying a `data-cuelume-*` attribute:
 *
 *   data-cuelume-tap       → click
 *   data-cuelume-type      → keydown that edits text (the marked field only)
 *   data-cuelume-select    → change on a native <select>/<input>, otherwise click
 *   data-cuelume-toggle    → click
 *   data-cuelume-open      → click
 *   data-cuelume-close     → click
 *   data-cuelume-navigate  → click
 *
 * A cue sounds as the gesture goes down and lets go as it lifts. A mouse
 * plays the press on pointerdown and the release on the click that follows;
 * touch and pen play both on lift, so a scroll that starts on a button stays
 * silent; keyboard activation plays both at once. A typed key presses on
 * keydown and lets go on keyup.
 *
 * Deprecated, kept for the v0.3 migration window and removed in 1.0:
 *
 *   data-cuelume-hover     → pointerenter (fine mouse, throttled), plays `select`
 *   data-cuelume-press     → pointerdown, plays `tap`
 *   data-cuelume-release   → pointerup, plays `tap` unless the element also has press
 *
 * Delegated listeners resolve attributes when each event fires, so later
 * DOM additions, removals, and clones work without rescanning. When
 * annotated elements nest, the innermost one decides the cue.
 *
 * Each binding also passes along what the event says about the interaction:
 * the key pressed, which way a selection moved, whether a toggle is switching
 * on or off, and what did the clicking. `data-cuelume-emphasis`, on the
 * element or any ancestor, sets how much the action matters, and
 * `data-cuelume-theme` sets the material the same way. Nothing is stored
 * beyond the page's memory.
 */
const HOVER_GAP_MS = 150;
const TYPE_GAP_MS = 40;
/** Chrome reports keydowns that belong to an IME composition with this code. */
const IME_KEY_CODE = 229;
const CLICK_CUES = {
    "data-cuelume-tap": "tap",
    "data-cuelume-select": "select",
    "data-cuelume-toggle": "toggle",
    "data-cuelume-open": "open",
    "data-cuelume-close": "close",
    "data-cuelume-navigate": "navigate",
};
const CLICK_SELECTOR = Object.keys(CLICK_CUES).map((attr) => `[${attr}]`).join();
/** Each bound root: how many callers hold it, and the signal that removes its listeners. */
const bound = new WeakMap();
const handledEvents = new WeakSet();
const lastPlayed = { hover: -Infinity, type: -Infinity };
/** The last selected index per select group, so the next pick knows which way it moved. */
const lastSelected = new WeakMap();
/** The element a pointer pressed, waiting for its click to let go. */
let pressed = null;
/** Keys whose keydown played `type`, waiting for their keyup. By code: lifting Shift first renames a key, "A" to "a". */
const typed = new Set();
function throttled(kind, gapMs) {
    const now = performance.now();
    if (now - lastPlayed[kind] < gapMs)
        return true;
    lastPlayed[kind] = now;
    return false;
}
function isMouse(event) {
    return (event.pointerType === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
}
/** Native controls report a new selection through `change`; clicking one only opens it. */
function isNativeControl(element) {
    return element.tagName === "SELECT" || element.tagName === "INPUT";
}
/** Whether Backspace or Delete would remove anything right now. */
function deletes(event, field) {
    const { selectionStart: start, selectionEnd: end, value } = field;
    // contenteditable, and inputs such as email that hide their caret, can't tell
    if (typeof start !== "number" || typeof end !== "number")
        return true;
    if (start !== end)
        return true;
    return event.key === "Backspace" ? start > 0 : end < value.length;
}
function keyRole(key) {
    if (key === " ")
        return "space";
    if (key === "Enter")
        return "enter";
    return key === "Backspace" || key === "Delete" ? "delete" : "printable";
}
/** What activated a click. Keyboard activation (Enter, Space) reports detail 0. */
function inputMethod(event) {
    const { detail, pointerType } = event;
    if (detail === 0)
        return "keyboard";
    return pointerType === "mouse" || pointerType === "touch" || pointerType === "pen" ? pointerType : undefined;
}
/** 1 when `index` is later in `group` than the last pick, -1 when earlier, else none. */
function moved(group, index, keep = true) {
    const previous = lastSelected.get(group);
    if (!(index >= 0))
        return undefined;
    if (keep)
        lastSelected.set(group, index);
    if (previous === undefined || previous === index)
        return undefined;
    return index > previous ? 1 : -1;
}
/** Whether an option is marked chosen through ARIA. */
function isChosen(option) {
    return option.getAttribute("aria-checked") === "true" || option.getAttribute("aria-selected") === "true";
}
/**
 * Direction for a custom option, counted among its marked siblings. The first
 * pick in a group starts from the option ARIA marks as chosen: this listener
 * runs in the capture phase, before the app moves that state.
 */
function siblingDirection(option, keep = true) {
    const group = option.parentElement;
    if (!group)
        return undefined;
    const options = Array.from(group.children).filter((child) => child.hasAttribute("data-cuelume-select"));
    if (!lastSelected.has(group)) {
        const chosen = options.findIndex(isChosen);
        if (chosen >= 0)
            lastSelected.set(group, chosen);
    }
    return moved(group, options.indexOf(option), keep);
}
/**
 * Which way a toggle is switching: 1 on, -1 off. A native checkbox or radio
 * has already changed when its click is dispatched, but not on pointerdown,
 * when a radio can only switch on. ARIA state has changed in neither: the app
 * flips it in its own handler, after these capture listeners.
 */
function switched(element, beforeClick = false) {
    const { type, checked } = element;
    if (type === "radio")
        return beforeClick || checked ? 1 : -1;
    if (type === "checkbox")
        return checked !== beforeClick ? 1 : -1;
    const state = element.getAttribute("aria-checked") ?? element.getAttribute("aria-pressed");
    if (state === "true")
        return -1;
    return state === "false" ? 1 : undefined;
}
function isTypingKey(event, field) {
    if (event.isComposing || event.keyCode === IME_KEY_CODE)
        return false;
    if (field.type === "password")
        return false;
    // Deleting is an edit with any modifier (word, line) and keeps going while held.
    if (event.key === "Backspace" || event.key === "Delete")
        return deletes(event, field);
    if (event.repeat)
        return false;
    // AltGr reports as Ctrl+Alt and still types a character.
    if (event.metaKey || (event.ctrlKey && !event.altKey))
        return false;
    // Enter submits a single-line input rather than editing it.
    if (event.key === "Enter")
        return field.tagName !== "INPUT";
    return event.key.length === 1;
}
function match(root, event, attr, fallback) {
    if (!(event.target instanceof Element))
        return null;
    const element = event.target.closest(`[${attr}]`);
    return element && root.contains(element) ? [element, attr, fallback] : null;
}
function listen(root, signal, eventName, find) {
    root.addEventListener(eventName, (event) => {
        if (handledEvents.has(event))
            return;
        const found = find(event);
        if (!found)
            return;
        handledEvents.add(event);
        const [element, attr, fallback, context = {}, part] = found;
        const emphasis = element.closest("[data-cuelume-emphasis]")?.getAttribute("data-cuelume-emphasis");
        const theme = element.closest("[data-cuelume-theme]")?.getAttribute("data-cuelume-theme");
        playInContext(resolveSound(element.getAttribute(attr)) ?? fallback, { emphasis: emphasis, theme: theme }, context, part, 
        // a key holds its own press, so keys that overlap each let go; a pointer has no code
        event.code);
    }, { capture: true, signal });
}
/**
 * Delegates `data-cuelume-*` interactions under `root` (default: the whole
 * document). Safe during SSR and safe to call repeatedly for the same root.
 *
 * Returns its undo, for a component that unmounts or a module that hot
 * reloads. A root stays bound until every caller that bound it has let go.
 */
function bind(root) {
    if (typeof document === "undefined")
        return () => { };
    const scope = root ?? document;
    const binding = bound.get(scope) ?? { holders: 0, listeners: new AbortController() };
    let holding = true;
    const unbind = () => {
        if (!holding)
            return;
        holding = false;
        if (--binding.holders > 0)
            return;
        binding.listeners.abort();
        bound.delete(scope);
    };
    if (binding.holders++ > 0)
        return unbind;
    bound.set(scope, binding);
    const { signal } = binding.listeners;
    /** The marked element an event activates, its attribute, and the control inside a marked label. */
    const clicked = (event) => {
        if (!(event.target instanceof Element))
            return null;
        const element = event.target.closest(CLICK_SELECTOR);
        if (!element || !scope.contains(element))
            return null;
        const control = element.tagName === "LABEL" ? element.control : null;
        const inside = control && element.contains(control) ? control : null;
        // a disabled control gets pointer events but never the click that would let go
        if ((inside ?? element).matches(":disabled"))
            return null;
        const attr = Object.keys(CLICK_CUES).find((name) => element.hasAttribute(name));
        if (attr === "data-cuelume-select" && isNativeControl(element))
            return null;
        return { element, attr, inside };
    };
    const direction = (element, attr, inside, beforeClick) => attr === "data-cuelume-select" ? siblingDirection(element, !beforeClick) : attr === "data-cuelume-toggle" ? switched(inside ?? element, beforeClick) : undefined;
    listen(scope, signal, "click", (event) => {
        const found = clicked(event);
        if (!found)
            return null;
        const { element, attr, inside } = found;
        // A label around its control gets two clicks, its own and the one it forwards
        // to the control. Only the forwarded one plays, and it reads the control's state.
        if (inside && event.target !== inside)
            return null;
        if (pressed === element) {
            pressed = null;
            // the press only read which way a select moved; this click makes the pick
            direction(element, attr, inside, false);
            return [element, attr, CLICK_CUES[attr], {}, "release"];
        }
        return [element, attr, CLICK_CUES[attr], { input: inputMethod(event), direction: direction(element, attr, inside, false) }];
    });
    listen(scope, signal, "pointerdown", (event) => {
        // a press abandoned without a click or a cancel is over once another pointer goes down
        pressed = null;
        // Only a mouse presses here. A finger or a pen may be starting a scroll, and neither's
        // pointerdown unlocks audio; both play whole on the click.
        const { pointerType, button } = event;
        const found = pointerType === "mouse" && !(button > 0) ? clicked(event) : null;
        if (found) {
            const { element, attr, inside } = found;
            pressed = element;
            // pointerdown reports detail 0, so inputMethod would call this a keyboard
            return [element, attr, CLICK_CUES[attr], { input: "mouse", direction: direction(element, attr, inside, true) }, "press"];
        }
        const legacy = match(scope, event, "data-cuelume-press", "tap");
        return legacy && [legacy[0], legacy[1], legacy[2], { input: inputMethod(event) }];
    });
    scope.addEventListener("pointercancel", () => (pressed = null), { capture: true, signal });
    listen(scope, signal, "change", (event) => {
        const found = match(scope, event, "data-cuelume-select", "select");
        if (!found || !isNativeControl(found[0]))
            return null;
        const [element, attr, fallback] = found;
        return [element, attr, fallback, { direction: moved(element, element.selectedIndex) }];
    });
    listen(scope, signal, "keydown", (event) => {
        // a press abandoned without a click or a cancel is over once a key goes down
        pressed = null;
        const found = match(scope, event, "data-cuelume-type", "type");
        if (!found || found[0] !== event.target)
            return null;
        const key = event;
        if (!isTypingKey(key, found[0]) || throttled("type", TYPE_GAP_MS))
            return null;
        typed.add(key.code);
        const [element, attr, fallback] = found;
        return [element, attr, fallback, { key: keyRole(key.key) }, "press"];
    });
    listen(scope, signal, "keyup", (event) => {
        // the key is done wherever it lifts, even if focus left the field
        if (!typed.delete(event.code))
            return null;
        const found = match(scope, event, "data-cuelume-type", "type");
        return found && found[0] === event.target ? [found[0], found[1], found[2], {}, "release"] : null;
    });
    listen(scope, signal, "pointerenter", (event) => {
        const found = match(scope, event, "data-cuelume-hover", "select");
        if (!found || !isMouse(event))
            return null;
        const relatedTarget = event.relatedTarget;
        if (relatedTarget instanceof Node && found[0].contains(relatedTarget))
            return null;
        return throttled("hover", HOVER_GAP_MS) ? null : found;
    });
    listen(scope, signal, "pointerup", (event) => {
        const found = match(scope, event, "data-cuelume-release", "tap");
        return found && !found[0].hasAttribute("data-cuelume-press") ? found : null;
    });
    return unbind;
}

export { bind, play, press, release, setEnabled, setTheme, setVolume, sounds, themes, unlock };
