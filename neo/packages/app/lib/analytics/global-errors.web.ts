import { captureError } from './health';

/**
 * Uncaught errors, unhandled rejections and the site's own scripts and stylesheets that fail
 * to load, for UNA's analytics. Installed before hydration by `apps/next/instrumentation-client.ts`
 * (and again, as a no-op, by the tracker). Listeners are added, never assigned
 * (`window.onerror`), so other handlers keep working.
 */

type FlaggedWindow = Window & { __neoAnalyticsErrors?: boolean };

function isSameOrigin(url: string): boolean {
    try {
        return new URL(url, window.location.href).origin === window.location.origin;
    } catch {
        return false;
    }
}

function onError(event: Event): void {
    try {
        const target = event.target;
        // capture phase: an element that fails to load doesn't bubble to window
        if (target && target !== window && target instanceof Element) {
            const isScript = target instanceof HTMLScriptElement;
            const url = isScript
                ? target.src
                : target instanceof HTMLLinkElement && /stylesheet/i.test(target.rel) ? target.href : '';
            // the site's own files: a blocked tracker or ad elsewhere is not the site's error
            if (url && isSameOrigin(url)) {
                captureError('resource', { message: `Failed to load ${isScript ? 'script' : 'stylesheet'} ${url}`, source: url });
            }
            return;
        }

        const errorEvent = event as ErrorEvent;
        captureError('js', {
            error: errorEvent.error,
            message: errorEvent.message || undefined,
            source: errorEvent.filename,
            line: errorEvent.lineno,
            col: errorEvent.colno,
        });
    } catch {
        // never throw from an error listener
    }
}

function onRejection(event: PromiseRejectionEvent): void {
    try {
        captureError('promise', { error: event.reason, nonErrorPrefix: 'Non-Error promise rejection: ' });
    } catch {
        // never throw from an error listener
    }
}

export function installGlobalErrorCapture(): void {
    if (typeof window === 'undefined') return;
    const flagged = window as FlaggedWindow;
    if (flagged.__neoAnalyticsErrors) return;
    flagged.__neoAnalyticsErrors = true;
    window.addEventListener('error', onError, true);
    window.addEventListener('unhandledrejection', onRejection);
}
