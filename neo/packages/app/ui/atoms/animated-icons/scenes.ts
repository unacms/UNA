/** Scenes an `icon-scene-*` class can ask for. The spec engine reads `fill` and `draw`; the rest are for legacy components. */
export type IconScene = 'fill' | 'draw' | 'morph' | 'smoke' | `custom${1 | 2 | 3 | 4 | 5 | 6}`;

const DEFAULT_SCENES: Partial<Record<IconScene, boolean>> = { fill: true, draw: true };
const SCENE_TOKEN = /icon-scene-(fill|draw|morph|smoke|custom[1-6])/;

/**
 * Reads `icon-scene-*` tokens from an animated icon's class and strips them. Without any token the icon gets
 * the default scenes (fill and draw); any token replaces the default set.
 */
export function parseIconSceneClasses(className?: string): { scenes: Partial<Record<IconScene, boolean>>; cleanedClassName: string } {
    if (!className || typeof className !== 'string')
        return { scenes: { ...DEFAULT_SCENES }, cleanedClassName: className || '' };

    const parts = className.split(/\s+/).filter(Boolean);
    const scenes: Partial<Record<IconScene, boolean>> = {};
    let explicit = false;
    for (const token of parts) {
        const scene = SCENE_TOKEN.exec(token)?.[1] as IconScene | undefined;
        if (scene) {
            explicit = true;
            scenes[scene] = true;
        }
    }
    return {
        scenes: explicit ? scenes : { ...DEFAULT_SCENES },
        cleanedClassName: parts.filter((token) => !token.includes('icon-scene-')).join(' '),
    };
}
