/**
 * Snackbar Component - Native Implementation
 * 
 * A persistent notification banner for showing actionable messages like
 * "X new posts available". User must interact to dismiss.
 * 
 * @example
 * // Basic usage
 * <Snackbar 
 *   visible={hasNewContent}
 *   title="3 new posts"
 *   onPress={loadNewContent}
 * />
 * 
 * // With icon and custom position
 * <Snackbar
 *   visible={hasNewContent}
 *   title="New posts available"
 *   icon="ArrowUp"
 *   position="top"
 *   onPress={loadNewContent}
 *   onDismiss={() => setHasNewContent(false)}
 * />
 */

import { useEffect, useCallback } from 'react';
import { Pressable } from 'react-native';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { appSetting } from 'app/lib/util';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import {
    Gesture,
    GestureDetector,
} from 'react-native-gesture-handler';

// Theme settings
const snackbarTheme = appSetting('theme', 'snackbar') || {};

// Animation config
const ANIMATION_CONFIG = {
    duration: 300,
    easing: Easing.out(Easing.cubic),
};

const SPRING_CONFIG = {
    damping: 20,
    stiffness: 300,
};

/**
 * Snackbar Component
 * 
 * @param {boolean} visible - Whether snackbar is visible
 * @param {string} title - Main text to display
 * @param {string} [description] - Optional secondary text
 * @param {string} [icon] - Optional icon name (from your icon set)
 * @param {'top'|'bottom'} [position='bottom'] - Position on screen
 * @param {string} [variant='primary'] - Button/style variant
 * @param {string} [size='sm'] - Size variant
 * @param {Function} onPress - Called when snackbar/button is pressed
 * @param {Function} [onDismiss] - Called when snackbar is dismissed (swipe)
 * @param {boolean} [dismissible=true] - Allow swipe to dismiss
 * @param {string} [buttonTitle] - Custom button title (defaults to title)
 * @param {boolean} [showButton=true] - Show action button vs plain text
 */
export default function Snackbar({
    visible = false,
    title,
    description,
    icon,
    position = 'bottom',
    variant = 'primary',
    size = 'sm',
    onPress,
    onDismiss,
    dismissible = true,
    buttonTitle,
    showButton = true,
    style,
    className,
}) {
    // Animation values
    const translateY = useSharedValue(position === 'bottom' ? 100 : -100);
    const opacity = useSharedValue(0);

    // Handle visibility changes
    useEffect(() => {
        if (visible) {
            // Animate in
            translateY.value = withSpring(0, SPRING_CONFIG);
            opacity.value = withTiming(1, ANIMATION_CONFIG);
        } else {
            // Animate out
            const targetY = position === 'bottom' ? 100 : -100;
            translateY.value = withTiming(targetY, ANIMATION_CONFIG);
            opacity.value = withTiming(0, ANIMATION_CONFIG);
        }
    }, [visible, position]);

    // Swipe gesture for dismissal
    const handleDismiss = useCallback(() => {
        onDismiss?.();
    }, [onDismiss]);

    const panGesture = Gesture.Pan()
        .enabled(dismissible && !!onDismiss)
        .onUpdate((event) => {
            // Allow swiping in the dismiss direction
            if (position === 'bottom') {
                translateY.value = Math.max(0, event.translationY);
            } else {
                translateY.value = Math.min(0, event.translationY);
            }
        })
        .onEnd((event) => {
            const threshold = 50;
            const shouldDismiss = position === 'bottom'
                ? event.translationY > threshold
                : event.translationY < -threshold;

            if (shouldDismiss) {
                const targetY = position === 'bottom' ? 100 : -100;
                translateY.value = withTiming(targetY, ANIMATION_CONFIG, () => {
                    runOnJS(handleDismiss)();
                });
                opacity.value = withTiming(0, ANIMATION_CONFIG);
            } else {
                // Snap back
                translateY.value = withSpring(0, SPRING_CONFIG);
            }
        });

    // Animated styles
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }), []);

    // Position classes
    const positionClasses = position === 'bottom'
        ? 'absolute bottom-20 left-0 right-0'
        : 'absolute top-20 left-0 right-0';

    // Container classes
    const containerClasses = snackbarTheme.container || 'items-center px-4';
    
    // Inner wrapper classes
    const wrapperClasses = snackbarTheme.wrapper || 'bg-primary rounded-full shadow-lg px-2 py-1 flex-row items-center gap-2';

    // Don't render if never visible (optimization)
    if (!visible && opacity.value === 0) {
        return null;
    }

    const content = showButton ? (
        <Button
            variant={variant}
            size={size}
            title={buttonTitle || title}
            startDecorator={icon}
            onPress={onPress}
            rounded
        />
    ) : (
        <Pressable
            onPress={onPress}
            className={wrapperClasses}
        >
            {icon && <Icon name={icon} size={16} className="text-primary-foreground" />}
            <Text className="text-primary-foreground font-medium">{title}</Text>
            {description && (
                <Text className="text-primary-foreground/80 text-sm">{description}</Text>
            )}
        </Pressable>
    );

    return (
        <View
            pointerEvents="box-none"
            className={`${positionClasses} z-50`}
        >
            <GestureDetector gesture={panGesture}>
                <Animated.View
                    style={[animatedStyle, style]}
                    className={`${containerClasses} ${className || ''}`}
                >
                    <View className="max-w-screen-lg w-auto">
                        {content}
                    </View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

// Named export for convenience
export { Snackbar };

