import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { useIsFocused } from '@react-navigation/native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming,
} from 'react-native-reanimated';
import { Text } from 'app/design/typography';
import { appSetting } from 'app/lib/util';
import { clsx } from 'clsx';
import { useWindowSize } from 'app/context/measure';

function cn(...inputs) {
    return clsx(inputs);
}

// Get tooltip configuration from settings
const tooltipConfig = appSetting('theme', 'tooltip') || {};
const HOVER_DELAY = tooltipConfig.hoverDelay ?? 300;

/**
 * Tooltip component (Native) - Displays a popup with content and pointing arrow
 * Uses Reanimated for smooth 60fps animations and FullWindowOverlay for z-index
 */
export default function Tooltip({
    children,
    content,
    contentComponent,
    side = 'top',
    sideOffset = 8,
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    delayDuration,
    className = '',
    triggerClassName = '',
    showArrow = true,
    arrowClassName = '',
}) {
    return children
    const effectiveDelay = delayDuration ?? HOVER_DELAY;
    const triggerRef = useRef(null);
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const [position, setPosition] = useState({ x: 0, y: 0, placement: side });
    const [isVisible, setIsVisible] = useState(false);
    const openTimerRef = useRef(null);
    const closeTimerRef = useRef(null);

    const { height: windowHeight } = useWindowSize();
    
    // Track screen focus to hide tooltip when navigating away
    const isFocused = useIsFocused();

    // Reanimated shared values for smooth 60fps position updates
    const animatedX = useSharedValue(0);
    const animatedY = useSharedValue(0);
    const animatedOpacity = useSharedValue(0);

    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    
    // Hide tooltip when screen loses focus (navigating to another tab/screen)
    useEffect(() => {
        if (!isFocused && isVisible) {
            // Screen lost focus, immediately hide tooltip
            animatedOpacity.value = 0;
            setIsVisible(false);
        }
    }, [isFocused, isVisible]);

    const clearTimers = useCallback(() => {
        if (openTimerRef.current) {
            clearTimeout(openTimerRef.current);
            openTimerRef.current = null;
        }
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    const setOpen = useCallback((newOpen) => {
        clearTimers();
        if (controlledOpen === undefined) {
            setInternalOpen(newOpen);
        }
        onOpenChange?.(newOpen);
    }, [controlledOpen, onOpenChange, clearTimers]);

    // Update position based on trigger location
    const updatePosition = useCallback(() => {
        if (!triggerRef.current?.measureInWindow) return;

        triggerRef.current.measureInWindow((x, y, width, height) => {
            let finalX = x;
            let finalY = y;
            let finalPlacement = side;

            switch (side) {
                case 'top':
                    finalX = x + width / 2;
                    finalY = y - sideOffset;
                    break;
                case 'bottom':
                    finalX = x + width / 2;
                    finalY = y + height + sideOffset;
                    break;
                case 'left':
                    finalX = x - sideOffset;
                    finalY = y + height / 2;
                    break;
                case 'right':
                    finalX = x + width + sideOffset;
                    finalY = y + height / 2;
                    break;
            }

            setPosition({
                x: finalX,
                y: finalY,
                triggerWidth: width,
                triggerHeight: height,
                triggerX: x,
                triggerY: y,
                placement: finalPlacement,
            });
        });
    }, [side, sideOffset]);

    // Handle opening/closing
    useEffect(() => {
        if (isOpen && isFocused) {
            // First, measure position BEFORE showing tooltip
            if (triggerRef.current?.measureInWindow) {
                triggerRef.current.measureInWindow((x, y, width, height) => {
                    const tooltipX = x + width / 2;
                    const tooltipY = side === 'bottom' ? y + height + sideOffset : y - sideOffset - 40;
                    
                    // Initialize position immediately (no animation) so it doesn't fly from (0,0)
                    animatedX.value = tooltipX - 120;
                    animatedY.value = tooltipY + 8; // Start slightly below final position
                    animatedOpacity.value = 0;
                    
                    // Now show and animate in
                    setIsVisible(true);
                    
                    // Subtle slide up + fade in
                    animatedY.value = withSpring(tooltipY, {
                        damping: 25,
                        stiffness: 400,
                        mass: 0.5,
                    });
                    animatedOpacity.value = withTiming(1, { duration: 200 });
                });
            } else {
                setIsVisible(true);
                animatedOpacity.value = withTiming(1, { duration: 200 });
            }
        } else if (isVisible && !isOpen) {
            // Fade out + slide down animation
            animatedOpacity.value = withTiming(0, { duration: 150 });
            animatedY.value = withTiming(animatedY.value + 8, { duration: 150 });
            
            const hideTimer = setTimeout(() => {
                setIsVisible(false);
            }, 150);
            return () => clearTimeout(hideTimer);
        }
    }, [isOpen, side, sideOffset, isFocused]);

    // Update position on scroll - use interval since we can't hook into scroll events
    useEffect(() => {
        if (!isVisible) return;

        const NAVBAR_HEIGHT = 64;
        const TOOLTIP_HEIGHT = 50; // Approximate tooltip height with some buffer

        const checkPositionAndVisibility = () => {
            if (!triggerRef.current?.measureInWindow) return;
            
            triggerRef.current.measureInWindow((x, y, width, height) => {
                // Calculate tooltip position
                const tooltipX = x + width / 2;
                const tooltipY = side === 'bottom' ? y + height + sideOffset : y - sideOffset - TOOLTIP_HEIGHT;
                
                // Check if TOOLTIP would overlap navbar or be off screen
                const tooltipTop = tooltipY;
                const triggerBottom = y + height;
                
                // Hide tooltip if it would overlap navbar (with buffer)
                // For bottom placement: tooltip appears below trigger, so check tooltip top
                const wouldOverlapNavbar = tooltipTop < NAVBAR_HEIGHT + 10;
                const triggerScrolledOff = triggerBottom < NAVBAR_HEIGHT;
                
                if (wouldOverlapNavbar || triggerScrolledOff) {
                    // Immediately set opacity to 0 - no animation to prevent overlap
                    animatedOpacity.value = 0;
                    return;
                }
                
                // Update shared values with spring animation for smooth 60fps
                animatedX.value = withSpring(tooltipX - 120, { // -120 to center (half of maxWidth)
                    damping: 20,
                    stiffness: 300,
                    mass: 0.5,
                });
                animatedY.value = withSpring(tooltipY, {
                    damping: 20,
                    stiffness: 300,
                    mass: 0.5,
                });
                // Fade back in if was hidden
                if (animatedOpacity.value === 0) {
                    animatedOpacity.value = withTiming(1, { duration: 150 });
                }
                
                // Update state for non-animated properties
                setPosition({
                    x: tooltipX,
                    y: tooltipY,
                    triggerWidth: width,
                    triggerHeight: height,
                    triggerX: x,
                    triggerY: y,
                    placement: side,
                });
            });
        };

        // Check position at ~60fps rate, Reanimated handles smooth interpolation
        const intervalId = setInterval(checkPositionAndVisibility, 16);
        
        return () => clearInterval(intervalId);
    }, [isVisible, windowHeight, side, sideOffset]);

    const handlePress = useCallback(() => {
        setOpen(!isOpen);
    }, [setOpen, isOpen]);

    useEffect(() => {
        return () => clearTimers();
    }, [clearTimers]);

    // Get arrow classes based on placement
    const getArrowClassName = () => {
        const placement = position.placement;
        const baseClasses = 'absolute w-3 h-3 bg-foreground rotate-45';
        
        let positionClass;
        switch (placement) {
            case 'bottom':
                positionClass = '-top-1.5 self-center';
                break;
            case 'top':
                positionClass = '-bottom-1.5 self-center';
                break;
            case 'left':
                positionClass = '-right-1.5 self-center';
                break;
            case 'right':
                positionClass = '-left-1.5 self-center';
                break;
            default:
                positionClass = '-bottom-1.5 self-center';
        }
        
        return cn(baseClasses, positionClass, arrowClassName);
    };

    const tooltipContent = contentComponent || (
        <Text className={cn(tooltipConfig['tooltip-text'], 'text-sm')}>
            {content}
        </Text>
    );

    // Animated style for smooth 60fps position updates
    const animatedStyle = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            maxWidth: 240,
            left: animatedX.value,
            top: animatedY.value,
            opacity: animatedOpacity.value,
        };
    });

    const renderTooltip = () => {
        if (!isVisible) return null;

        return (
            <FullWindowOverlay>
                <View style={{ flex: 1 }} pointerEvents="box-none">
                    <Animated.View
                        style={animatedStyle}
                        pointerEvents="none"
                        className={cn(tooltipConfig['tooltip-content'], className)}
                    >
                        {tooltipContent}
                        {showArrow && <View className={getArrowClassName()} />}
                    </Animated.View>
                </View>
            </FullWindowOverlay>
        );
    };

    return (
        <>
            <Pressable
                ref={triggerRef}
                className={triggerClassName}
                onPress={handlePress}
                collapsable={false}
            >
                {children}
            </Pressable>
            {renderTooltip()}
        </>
    );
}

// Simple controlled tooltip for programmatic use
export function ControlledTooltip({
    children,
    content,
    open,
    onOpenChange,
    side = 'top',
    sideOffset = 8,
    showArrow = true,
    className = '',
    triggerClassName = '',
    ...props
}) {
    return children
    return (
        <Tooltip
            content={content}
            open={open}
            onOpenChange={onOpenChange}
            side={side}
            sideOffset={sideOffset}
            showArrow={showArrow}
            className={className}
            triggerClassName={triggerClassName}
            delayDuration={0}
            {...props}
        >
            {children}
        </Tooltip>
    );
}
