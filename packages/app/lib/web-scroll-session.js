/** Web scroll session helpers — native no-op stubs. */
export function getWebScrollKey() {
    return '';
}

export function readWebScroll() {
    return null;
}

export function writeWebScroll() {}

export function restoreWebScroll() {
    return () => {};
}

export function scheduleWebScrollRestore() {
    return () => {};
}
