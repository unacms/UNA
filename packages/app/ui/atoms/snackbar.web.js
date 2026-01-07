/**
 * Snackbar Component - Web Implementation
 * 
 * A persistent notification banner for showing actionable messages like
 * "X new posts available". User must interact to dismiss.
 * Uses CSS transitions instead of react-native-reanimated.
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

import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { appSetting } from 'app/lib/util';

// Theme settings
const snackbarTheme = appSetting('theme', 'snackbar') || {};

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
 * @param {Function} [onDismiss] - Called when snackbar is dismissed
 * @param {boolean} [dismissible=true] - Allow dismiss (click outside or escape)
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
    const [shouldRender, setShouldRender] = useState(visible);
    const [isAnimating, setIsAnimating] = useState(false);
    const snackbarRef = useRef(null);

    // Handle visibility changes with animation
    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            // Small delay to trigger CSS transition
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsAnimating(true);
                });
            });
        } else {
            setIsAnimating(false);
            // Wait for animation to complete before unmounting
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    // Handle escape key for dismissal
    useEffect(() => {
        if (!visible || !dismissible || !onDismiss) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onDismiss();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [visible, dismissible, onDismiss]);

    // Handle click action
    const handlePress = useCallback(() => {
        onPress?.();
    }, [onPress]);

    // Position classes
    const positionClasses = position === 'bottom'
        ? 'fixed bottom-20 left-0 right-0'
        : 'fixed top-20 left-0 right-0';

    // Animation classes
    const translateClass = position === 'bottom'
        ? (isAnimating ? 'translate-y-0' : 'translate-y-full')
        : (isAnimating ? 'translate-y-0' : '-translate-y-full');

    const opacityClass = isAnimating ? 'opacity-100' : 'opacity-0';

    // Container classes
    const containerClasses = snackbarTheme.container || 'flex items-center justify-center px-4';
    
    // Inner wrapper classes (for non-button variant)
    const wrapperClasses = snackbarTheme.wrapper || 'bg-primary rounded-full shadow-lg px-4 py-2 flex flex-row items-center gap-2 cursor-pointer web:hover:bg-primary/90 transition-colors';

    // Don't render if not visible and animation complete
    if (!shouldRender) {
        return null;
    }

    const content = showButton ? (
        <Button
            variant={variant}
            size={size}
            title={buttonTitle || title}
            startDecorator={icon}
            onPress={handlePress}
            rounded
        />
    ) : (
        <Pressable
            onPress={handlePress}
            className={wrapperClasses}
        >
            {icon && <Icon name={icon} size={16} className="text-primary-foreground" />}
            <Text className="text-primary-foreground font-medium">{title}</Text>
            {description && (
                <Text className="text-primary-foreground/80 text-sm ml-1">{description}</Text>
            )}
        </Pressable>
    );

    return (
        <View
            ref={snackbarRef}
            className={`${positionClasses} z-50 pointer-events-none`}
            style={style}
        >
            <View
                className={`
                    ${containerClasses}
                    ${translateClass}
                    ${opacityClass}
                    transition-all duration-300 ease-out
                    pointer-events-auto
                    ${className || ''}
                `}
            >
                <View className="max-w-screen-lg w-auto">
                    {content}
                </View>
            </View>
        </View>
    );
}

// Named export for convenience
export { Snackbar };

