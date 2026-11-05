import type { IconCoreProps } from 'app/ui/atoms/icon';
import { parseIconSceneClasses } from './scenes';

/** Icon's normalized props as the spec engine takes them (both platforms); each host settles `color`. */
export function engineProps({ className, color, size, width, height, _strokeWidth, active, selected, pressed, rest }: IconCoreProps) {
    const { scenes, cleanedClassName } = parseIconSceneClasses(className);
    return {
        ...(rest as Record<string, unknown>),
        size,
        width,
        height,
        color,
        strokeWidth: _strokeWidth,
        className: cleanedClassName,
        active: !!(active ?? selected),
        pressed,
        scenes: { fill: !!scenes.fill, draw: !!scenes.draw },
    };
}
