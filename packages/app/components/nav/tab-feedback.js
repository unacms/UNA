import { FeedbackHaptics } from 'app/lib/util';
import { playSound } from 'app/lib/hooks/use-sound';

let lastAt = 0;

/** Tab press: impact haptic + `tab` click when `layout.sounds` is on. */
export function playTabFeedback() {
    const now = Date.now();
    if (now - lastAt < 80) return;
    lastAt = now;
    FeedbackHaptics('Light');
    playSound('tab');
}
