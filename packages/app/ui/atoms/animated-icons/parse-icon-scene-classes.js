/**
 * Scene markers in className: `icon-scene-{fill|draw|morph|smoke|custom1-6}`.
 * Works with prefixed Tailwind variants (`web:hover:icon-scene-draw`) — any token
 * containing `icon-scene-*` is detected and removed from the cleaned class string.
 *
 * Pair with Icon props: active, pressed, hovered (same state names as button theme).
 */
export function parseIconSceneClasses(className) {
    if (!className || typeof className !== 'string') {
        return {
            scenes: {},
            cleanedClassName: className || '',
        };
    }

    const scenes = {
        fill: false,
        draw: false,
        morph: false,
        smoke: false,
        custom1: false,
        custom2: false,
        custom3: false,
        custom4: false,
        custom5: false,
        custom6: false,
    };

    const parts = className.split(/\s+/).filter(Boolean);
    for (const tok of parts) {
        const m = tok.match(/icon-scene-(fill|draw|morph|smoke|custom[1-6])/);
        if (m && m[1] in scenes) {
            scenes[m[1]] = true;
        }
    }

    const cleanedClassName = parts.filter((t) => !t.includes('icon-scene-')).join(' ');

    return { scenes, cleanedClassName };
}
