import { t } from './i18n';

/** Said when a failure brings no words of its own. It also ends sentences such as "Could not delete it: …", so it has no full stop. */
const NO_WORDS = t('Something went wrong');

/**
 * What a failure says, to show or announce. A caught value can be anything: the API client and
 * the page throw Errors, a Rust command rejects with a string (its message), and a value with
 * neither gets the fallback rather than "undefined" on screen.
 */
export function errorMessage(e: unknown, fallback: string = NO_WORDS): string {
    if (typeof e === 'string') return e;
    // an Error, of this page or of another realm (which `instanceof Error` would miss)
    if (typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string') return e.message;
    return fallback;
}
