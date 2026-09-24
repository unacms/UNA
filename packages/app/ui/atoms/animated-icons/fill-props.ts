import { Platform, type Animated } from 'react-native'

export const ANIMATED_FILL_OPACITY = 0.2

/**
 * Fill props for animated Lucide icons.
 *
 * On native, react-native-svg ignores Animated `fillOpacity` (and often
 * `fillOpacity={0}`) when `fill` is set, so inactive icons render fully
 * filled. Use `fill="none"` when the fill scene is off, and a numeric
 * opacity when it is on. Web keeps the animated fade.
 */
export function getAnimatedFillProps(
    fillOn: boolean,
    color: string,
    fillOpacityAnim: Animated.Value | Animated.AnimatedInterpolation<number>,
) {
    if (Platform.OS === 'web') {
        return {
            fill: color,
            fillOpacity: fillOpacityAnim,
        }
    }
    return {
        fill: fillOn ? color : 'none',
        fillOpacity: fillOn ? ANIMATED_FILL_OPACITY : 0,
    }
}
