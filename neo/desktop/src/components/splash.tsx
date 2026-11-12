import { useEffect, useState } from 'react';

import { t } from '../lib/i18n';
import { APP_ICON } from '../lib/brand';

/** How long the splash waits before it shows a spinner: a quick read shows none. */
export const SPINNER_DELAY_MS = 300;

/**
 * While the app reads the sign-in (the keychain may ask the person first) or loads the account:
 * the app icon and what it is doing, announced once, and a spinner after a moment.
 *
 * The status region is mounted empty and gets its text after mount (section 13's stable
 * region): screen readers skip what a live region holds when it appears. Nothing around it is
 * aria-busy, which would hold its update back until the splash is gone.
 */
export function Splash({ text = t('Signing in…') }: { text?: string }) {
    const [slow, setSlow] = useState(false);
    const [shown, setShown] = useState(false);
    useEffect(() => {
        // the text after the empty region is in the page (a task later, not in this commit)
        const text = window.setTimeout(() => setShown(true), 0);
        const spinner = window.setTimeout(() => setSlow(true), SPINNER_DELAY_MS);
        return () => {
            window.clearTimeout(text);
            window.clearTimeout(spinner);
        };
    }, []);
    return (
        <div className="splash">
            <img className="splash-icon" src={APP_ICON} alt="" width={48} height={48} />
            <p className="splash-text" role="status">
                {shown ? text : ''}
            </p>
            <span className="spinner" data-shown={slow ? 'true' : 'false'} aria-hidden="true" />
        </div>
    );
}
