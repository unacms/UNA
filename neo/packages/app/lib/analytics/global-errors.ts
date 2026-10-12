import { persistedGet, persistedSet } from 'app/lib/util/storage';
import { buildErrorHit, captureError, isErrorCaptureOff, submitHealthHits } from './health';
import type { AnalyticsHit } from './analytics.types';

/**
 * JS errors of the apps for UNA's analytics: React Native's global handler (chained to the
 * previous one) and, in release builds, Hermes' unhandled promise rejections. Render errors
 * don't reach the global handler in React Native: `AnalyticsErrorBoundary` reports those.
 *
 * A fatal error usually ends the app before a request could finish, so it is kept on the
 * device and sent on the next start, with `deferred` and its real age.
 */

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
type RejectionTrackerOptions = {
    allRejections: boolean;
    onUnhandled: (id: number, rejection: unknown) => void;
    onHandled: (id: number) => void;
};
type NativeGlobal = typeof globalThis & {
    ErrorUtils?: { getGlobalHandler?: () => GlobalHandler | undefined; setGlobalHandler?: (handler: GlobalHandler) => void };
    HermesInternal?: { enablePromiseRejectionTracker?: (options: RejectionTrackerOptions) => void };
    __neoAnalyticsErrors?: boolean;
};
type StoredError = { hit: AnalyticsHit; at: number };

const STORAGE_KEY = 'analytics_pending_errors';
const MAX_STORED = 5;
/** UNA takes errors up to 7 days old. */
const MAX_STORED_AGE_MS = 7 * 24 * 3600 * 1000;
/** How long a fatal error waits for storage before the previous handler ends the app. */
const FATAL_WRITE_WAIT_MS = 300;

async function storeFatalError(error: unknown): Promise<void> {
    if (isErrorCaptureOff()) return;
    const hit = buildErrorHit('native', { error, fatal: true });
    if (!hit) return;
    const stored = await persistedGet(STORAGE_KEY);
    const list: StoredError[] = Array.isArray(stored) ? stored : [];
    await persistedSet(STORAGE_KEY, list.concat({ hit, at: Date.now() }).slice(-MAX_STORED));
}

export function installGlobalErrorCapture(): void {
    const g = globalThis as NativeGlobal;
    if (g.__neoAnalyticsErrors) return;
    g.__neoAnalyticsErrors = true;

    try {
        const errorUtils = g.ErrorUtils;
        if (errorUtils?.getGlobalHandler && errorUtils.setGlobalHandler) {
            const previous = errorUtils.getGlobalHandler();
            errorUtils.setGlobalHandler((error, isFatal) => {
                let stored: Promise<void> | null = null;
                try {
                    if (isFatal) stored = storeFatalError(error);
                    else captureError('native', { error });
                } catch {
                    stored = null;
                }
                if (!previous) return;
                if (!stored) {
                    previous(error, isFatal);
                    return;
                }
                let done = false;
                const finish = () => {
                    if (done) return;
                    done = true;
                    previous(error, isFatal);
                };
                stored.then(finish, finish);
                setTimeout(finish, FATAL_WRITE_WAIT_MS);
            });
        }
    } catch {
        // no global handler: nothing to chain to
    }

    // React Native tracks unhandled rejections only in development (and shows them there).
    const hermes = g.HermesInternal;
    if (!__DEV__ && typeof hermes?.enablePromiseRejectionTracker === 'function') {
        try {
            hermes.enablePromiseRejectionTracker({
                allRejections: true,
                onUnhandled: (_id, rejection) => captureError('promise', { error: rejection, nonErrorPrefix: 'Non-Error promise rejection: ' }),
                onHandled: () => {},
            });
        } catch {
            // an internal Hermes API: when it changes, rejections just aren't reported
        }
    }
}

/** Fatal errors kept by the last run of the app, sent once. */
export async function sendStoredErrors(): Promise<void> {
    try {
        const stored = await persistedGet(STORAGE_KEY);
        if (!Array.isArray(stored) || !stored.length) return;
        await persistedSet(STORAGE_KEY, []);
        const now = Date.now();
        const hits = (stored as StoredError[])
            .filter((item) => item?.hit?.type === 'error' && typeof item.at === 'number' && now - item.at >= 0 && now - item.at < MAX_STORED_AGE_MS)
            .map((item): AnalyticsHit => ({ ...item.hit, repeats: 1, deferred: 1, age: now - item.at }));
        submitHealthHits(hits);
    } catch {
        // storage unavailable: the errors stay for the next start
    }
}
