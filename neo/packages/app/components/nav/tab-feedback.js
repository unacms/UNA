import { FeedbackHaptics } from 'app/lib/util';
import { playCue } from 'app/lib/sound';

let lastAt = 0;

/** Tab press: impact haptic + a subtle `navigate` (route change; tabs are pressed often). */
export function playTabFeedback() {
    const now = Date.now();
    if (now - lastAt < 80) return;
    lastAt = now;
    FeedbackHaptics('Light');
    playCue('navigate', { emphasis: 'subtle' });
}
