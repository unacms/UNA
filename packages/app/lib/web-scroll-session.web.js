const SCROLL_PREFIX = 'neo-scroll:';
const VIRTUOSO_PREFIX = 'neo-virtuoso:';

const DEFAULT_RESTORE_DELAYS_MS = [0, 50, 150, 300, 500, 800, 1200, 1800, 2500];

export function getWebScrollKey(pathname, search) {
    if (typeof window === 'undefined') {
        return '';
    }
    const path = pathname ?? window.location.pathname ?? '/';
    const query = search ?? window.location.search ?? '';
    return `${path}${query}`;
}

export function readWebScroll(key) {
    if (!key || typeof sessionStorage === 'undefined') {
        return null;
    }
    const raw = sessionStorage.getItem(SCROLL_PREFIX + key);
    if (raw == null) {
        return null;
    }
    const y = Number(raw);
    return Number.isFinite(y) && y > 0 ? y : null;
}

/** Never overwrite a saved position with 0 unless allowClear (explicit reset). */
export function writeWebScroll(key, y, { allowClear = false } = {}) {
    if (!key || typeof sessionStorage === 'undefined') {
        return;
    }
    const rounded = Math.max(0, Math.round(y));
    if (rounded === 0 && !allowClear) {
        const prev = readWebScroll(key);
        if (prev != null && prev > 0) {
            return;
        }
    }
    sessionStorage.setItem(SCROLL_PREFIX + key, String(rounded));
}

export function readVirtuosoState(storageKey) {
    if (!storageKey || typeof sessionStorage === 'undefined') {
        return null;
    }
    try {
        const raw = sessionStorage.getItem(VIRTUOSO_PREFIX + storageKey);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function writeVirtuosoState(storageKey, state) {
    if (!storageKey || !state?.ranges?.length || typeof sessionStorage === 'undefined') {
        return;
    }
    try {
        sessionStorage.setItem(VIRTUOSO_PREFIX + storageKey, JSON.stringify(state));
    } catch {
        // Quota or serialization — ignore.
    }
}

export function restoreWebScroll(key, { delays = DEFAULT_RESTORE_DELAYS_MS } = {}) {
    const y = readWebScroll(key);
    if (y == null || typeof window === 'undefined') {
        return () => {};
    }

    const apply = () => {
        window.scrollTo({ top: y, left: 0, behavior: 'auto' });
    };

    const timers = delays.map((delay) =>
        setTimeout(() => {
            const tallEnough =
                document.documentElement.scrollHeight >= y + window.innerHeight * 0.25;
            if (tallEnough || delay >= 500) {
                apply();
            }
        }, delay)
    );

    return () => {
        timers.forEach(clearTimeout);
    };
}

let activeRestoreCancel = null;

export function scheduleWebScrollRestore(key) {
    if (typeof window === 'undefined') {
        return () => {};
    }
    const scrollKey = key ?? getWebScrollKey();
    if (activeRestoreCancel) {
        activeRestoreCancel();
    }
    activeRestoreCancel = restoreWebScroll(scrollKey);
    return activeRestoreCancel;
}
