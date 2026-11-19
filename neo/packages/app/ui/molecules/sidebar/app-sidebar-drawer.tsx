import { useEffect, useState, type ReactNode } from 'react';
import { BackHandler, I18nManager, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useReduceMotion } from 'app/lib/hooks/use-reduce-motion';

/**
 * The drawer's place in the window of a native app, around the tabs: over them while it is open. The tabs keep their
 * place in the tree whether there is a drawer or not (`enabled`), so signing in or out never mounts them again.
 *
 * The drawer slides in from the leading edge over a scrim. A press on the scrim, a swipe towards the edge and
 * Android's back button close it; while it is open the page behind is hidden from the screen reader. Its content is
 * mounted only while it is open or on its way out.
 */
type AppSidebarDrawerProps = {
    enabled: boolean;
    open: boolean;
    width: number;
    onClose: () => void;
    /** The scrim's name for the screen reader. */
    closeLabel: string;
    renderSidebar: () => ReactNode;
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
};

const DURATION = 250;
const SCRIM_OPACITY = 0.4;
const EASING = Easing.bezier(0.32, 0.72, 0, 1);

export default function AppSidebarDrawer({ enabled, open, width, onClose, closeLabel, renderSidebar, style, children }: Readonly<AppSidebarDrawerProps>) {
    const reduceMotion = useReduceMotion();
    const shown = enabled && open;
    // 0 closed, 1 open.
    const progress = useSharedValue(0);
    // Mounted from the render that opens it, until the way out ends.
    const [mounted, setMounted] = useState(false);
    if (shown && !mounted) setMounted(true);
    // The leading edge is the right one in a right-to-left interface.
    const side = I18nManager.isRTL ? 1 : -1;

    useEffect(() => {
        progress.set(withTiming(shown ? 1 : 0, { duration: reduceMotion ? 0 : DURATION, easing: EASING }, (finished) => {
            if (finished && !shown) runOnJS(setMounted)(false);
        }));
    }, [shown, reduceMotion, progress]);

    useEffect(() => {
        if (!shown) return undefined;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            onClose();
            return true;
        });
        return () => subscription.remove();
    }, [shown, onClose]);

    // A swipe towards the edge follows the finger; the list inside keeps its vertical scroll.
    const pan = Gesture.Pan()
        .enabled(shown)
        .activeOffsetX([-12, 12])
        .failOffsetY([-12, 12])
        .onUpdate((event) => {
            const moved = (event.translationX * side) / Math.max(width, 1);
            progress.set(Math.min(1, Math.max(0, 1 - moved)));
        })
        .onEnd((event) => {
            const closing = progress.get() < 0.6 || event.velocityX * side > 500;
            if (closing) runOnJS(onClose)();
            else progress.set(withTiming(1, { duration: DURATION, easing: EASING }));
        });

    const panelStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: (1 - progress.get()) * width * side }],
    }));
    const scrimStyle = useAnimatedStyle(() => ({
        opacity: progress.get() * SCRIM_OPACITY,
    }));

    const drawerMounted = enabled && mounted;

    return (
        <View style={[styles.root, style]}>
            <View
                style={styles.main}
                accessibilityElementsHidden={shown}
                importantForAccessibility={shown ? 'no-hide-descendants' : 'auto'}
            >
                {children}
            </View>
            {drawerMounted && (
                <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]} pointerEvents={shown ? 'auto' : 'none'}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={closeLabel} />
                </Animated.View>
            )}
            {drawerMounted && (
                <GestureDetector gesture={pan}>
                    <Animated.View style={[styles.panel, { width }, panelStyle]} accessibilityViewIsModal={shown}>
                        {renderSidebar()}
                    </Animated.View>
                </GestureDetector>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    main: { flex: 1 },
    scrim: { backgroundColor: '#000' },
    panel: { position: 'absolute', top: 0, bottom: 0, start: 0 },
});
