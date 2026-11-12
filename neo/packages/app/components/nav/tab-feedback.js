import { FeedbackHaptics } from 'app/lib/util';
import { playCue } from 'app/lib/sound';

let lastAt = 0;

/** Tab press: impact haptic + a subtle `select` (Cuelume's cue for tabs; pressed often), in the navigation sounds group. */
export function playTabFeedback() {
    const now = Date.now();
    if (now - lastAt < 80) return;
    lastAt = now;
    FeedbackHaptics('Light');
    playCue('select', { emphasis: 'subtle', group: 'navigation' });
}
