import { useEffect } from 'react';

// The accent the previous page had: a page whose data has none yet keeps it instead of flashing the default. In the
// browser only: on the server it would carry one site's accent into another's page.
const isBrowser = typeof window !== 'undefined';
let __lastAccent = null;

const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

/**
 * The accent scale as `--accent-50: r g b; ...`, from UNA's `accent` (step => "r g b"), or '' when it is missing or
 * not a full scale of numbers.
 *
 * @param {Record<string, string> | null | undefined} accent
 * @returns {string}
 */
export function accentVariables(accent) {
    if (!accent || typeof accent !== 'object') return '';

    const lines = [];
    for (const step of STEPS) {
        const value = accent[step];
        if (typeof value !== 'string' || !/^\d{1,3} \d{1,3} \d{1,3}$/.test(value)) return '';
        lines.push(`--accent-${step}:${value}`);
    }
    return lines.join(';');
}

/**
 * UNA's accent color (Studio > Designer > Settings > Accent color) on :root as --accent-*, which NEO's palette and
 * every accent token read (design/styles/palette.css). UNA sends `accent` only for a preset other than its default
 * blue; without it the app keeps its own palette (a client's theme may set another). A <style> so the server's HTML
 * has it and the first paint has the right colour.
 *
 * @param {{ data?: any }} props
 */
export default function PageAccentStyle({ data }) {
    const hasOwn = data !== undefined && data !== null && Object.prototype.hasOwnProperty.call(data, 'accent');
    const variables = hasOwn ? accentVariables(data.accent) : isBrowser ? __lastAccent : '';
    useEffect(() => {
        if (hasOwn) __lastAccent = variables;
    }, [hasOwn, variables]);
    if (!variables) return null;

    return <style dangerouslySetInnerHTML={{ __html: `:root{${variables}}` }} />;
}
