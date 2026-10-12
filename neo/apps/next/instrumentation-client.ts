import { installGlobalErrorCapture } from 'app/lib/analytics/global-errors';
import { startScreenLoad } from 'app/lib/analytics/health';

// Runs before hydration: errors from the first scripts on reach UNA's analytics. They wait in
// app/lib/analytics/health until the tracker knows whether the site takes them.
installGlobalErrorCapture();

/** A router navigation starts: the time to its page rendered is its `screen_load`. */
export function onRouterTransitionStart(url: string): void {
    try {
        const target = new URL(url, window.location.href);
        // same page (a hash change, a refresh): nothing renders that the tracker would see
        if (target.pathname === window.location.pathname && target.search === window.location.search) return;
        startScreenLoad();
    } catch {
        // never break a navigation
    }
}
