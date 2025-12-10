import * as React from 'react';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { createPortal } from 'react-dom';
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
const HOVER_OUT_DELAY = tooltipConfig.hoverOutDelay ?? 150;

/**
 * Tooltip component (Web) - Displays a popup with content and pointing arrow
 * Uses CSS animations and createPortal for rendering
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
    const effectiveDelay = delayDuration ?? HOVER_DELAY;
    const triggerRef = useRef(null);
    const contentRef = useRef(null);
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const [position, setPosition] = useState({ x: 0, y: 0, placement: side });
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [isInViewport, setIsInViewport] = useState(true);
    const openTimerRef = useRef(null);
    const closeTimerRef = useRef(null);

    const { width: windowWidth, height: windowHeight } = useWindowSize();

    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

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
        if (isOpen) {
            setIsAnimatingOut(false);
            setIsVisible(true);
            updatePosition();
        } else if (isVisible) {
            setIsAnimatingOut(true);
            const hideTimer = setTimeout(() => {
                setIsVisible(false);
                setIsAnimatingOut(false);
            }, 150);
            return () => clearTimeout(hideTimer);
        }
    }, [isOpen, updatePosition]);

    // Update position on scroll/resize and check viewport visibility
    useEffect(() => {
        if (!isVisible) return;

        const NAVBAR_HEIGHT = 64;

        const checkPositionAndVisibility = () => {
            if (!triggerRef.current?.measureInWindow) return;
            
            triggerRef.current.measureInWindow((x, y, width, height) => {
                const viewportHeight = window.innerHeight;
                const inView = y >= NAVBAR_HEIGHT && y < viewportHeight - 20;
                setIsInViewport(inView);

                const tooltipX = x + width / 2;
                setPosition({
                    x: tooltipX,
                    y: side === 'bottom' ? y + height + sideOffset : y - sideOffset,
                    triggerWidth: width,
                    triggerHeight: height,
                    triggerX: x,
                    triggerY: y,
                    placement: side,
                });
            });
        };

        window.addEventListener('scroll', checkPositionAndVisibility, true);
        window.addEventListener('resize', checkPositionAndVisibility);

        return () => {
            window.removeEventListener('scroll', checkPositionAndVisibility, true);
            window.removeEventListener('resize', checkPositionAndVisibility);
        };
    }, [isVisible, side, sideOffset]);

    const scheduleOpen = useCallback(() => {
        clearTimers();
        openTimerRef.current = setTimeout(() => {
            openTimerRef.current = null;
            setOpen(true);
        }, effectiveDelay);
    }, [clearTimers, setOpen, effectiveDelay]);

    const scheduleClose = useCallback(() => {
        clearTimers();
        closeTimerRef.current = setTimeout(() => {
            closeTimerRef.current = null;
            setOpen(false);
        }, HOVER_OUT_DELAY);
    }, [clearTimers, setOpen]);

    const handleMouseEnter = useCallback(() => {
        if (effectiveDelay > 0) {
            scheduleOpen();
        } else {
            setOpen(true);
        }
    }, [scheduleOpen, setOpen, effectiveDelay]);

    const handleMouseLeave = useCallback(() => {
        scheduleClose();
    }, [scheduleClose]);

    const handleContentMouseEnter = useCallback(() => {
        clearTimers();
    }, [clearTimers]);

    const handleContentMouseLeave = useCallback(() => {
        scheduleClose();
    }, [scheduleClose]);

    useEffect(() => {
        return () => clearTimers();
    }, [clearTimers]);

    // Calculate tooltip position styles
    const getTooltipStyle = useMemo(() => {
        const { x, y, placement } = position;
        
        const baseStyle = {
            position: 'fixed',
            zIndex: 9999,
        };

        switch (placement) {
            case 'top':
                return { ...baseStyle, bottom: windowHeight - y, left: x };
            case 'bottom':
                return { ...baseStyle, top: y, left: x };
            case 'left':
                return { ...baseStyle, right: windowWidth - x, top: y };
            case 'right':
                return { ...baseStyle, left: x, top: y };
            default:
                return baseStyle;
        }
    }, [position, windowWidth, windowHeight]);

    // Get arrow classes based on placement
    const getArrowClassName = () => {
        const placement = position.placement;
        const baseClasses = 'absolute w-3 h-3 bg-foreground rotate-45';
        
        let positionClass;
        switch (placement) {
            case 'bottom':
                positionClass = '-top-1.5 left-1/2 -translate-x-1/2';
                break;
            case 'top':
                positionClass = '-bottom-1.5 left-1/2 -translate-x-1/2';
                break;
            case 'left':
                positionClass = '-right-1.5 top-1/2 -translate-y-1/2';
                break;
            case 'right':
                positionClass = '-left-1.5 top-1/2 -translate-y-1/2';
                break;
            default:
                positionClass = '-bottom-1.5 left-1/2 -translate-x-1/2';
        }
        
        return cn(baseClasses, positionClass, arrowClassName);
    };

    const tooltipContent = contentComponent || (
        <Text className={cn(tooltipConfig['tooltip-text'], 'text-sm')}>
            {content}
        </Text>
    );

    const getAnimationClass = () => {
        if (isAnimatingOut) return 'animate-tooltip-out';
        return position.placement === 'bottom' ? 'animate-tooltip-in-bottom' : 'animate-tooltip-in';
    };

    const renderTooltip = () => {
        if (!isVisible || !isInViewport) return null;

        const tooltipElement = (
            <View
                ref={contentRef}
                style={getTooltipStyle}
                pointerEvents="auto"
                className={cn(
                    tooltipConfig['tooltip-content'],
                    getAnimationClass(),
                    '-translate-x-1/2',
                    className
                )}
                onMouseEnter={handleContentMouseEnter}
                onMouseLeave={handleContentMouseLeave}
            >
                {tooltipContent}
                {showArrow && <View className={getArrowClassName()} />}
            </View>
        );

        if (typeof document !== 'undefined') {
            return createPortal(tooltipElement, document.body);
        }
        return tooltipElement;
    };

    return (
        <>
            <View
                ref={triggerRef}
                className={triggerClassName}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                collapsable={false}
            >
                {children}
            </View>
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

