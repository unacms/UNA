import * as React from 'react';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { createPortal } from 'react-dom';
import { Text } from 'app/design/typography';

import { useWindowSize } from 'app/context/measure';
import { appSetting, cn } from 'app/lib/util';


// Get tooltip configuration from settings
const tooltipConfig = appSetting('theme', 'tooltip') || {};


/**
 * Tooltip component (Web) - Displays a popup with content and pointing arrow
 * Uses CSS animations and createPortal for rendering
 */
export default function Tooltip({
    children,
    content,
    side = 'bottom',
    sideOffset = 8,
    align = 'center',
    alignOffset = 0,
    open: controlledOpen,
    triggerDelay = 3000,
    dismissDelay = 0,
    className = '',
    showArrow = true,
    arrowClassName = '',
    triggerClassName = '',
}) {
    const effectiveDelay = triggerDelay;
    const triggerRef = useRef(null);
    const contentRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0, placement: side });
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [isInViewport, setIsInViewport] = useState(true);

    const { width: windowWidth, height: windowHeight } = useWindowSize();


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

    useEffect(() => {
        if (controlledOpen === undefined) return;

        if (controlledOpen) {
            const timer = setTimeout(() => {
                 setIsAnimatingOut(false);
                setIsVisible(true);
                updatePosition();
            }, triggerDelay);

            let dismissTimer;
            if (dismissDelay > 0) {
                dismissTimer = setTimeout(() => {
                      setIsVisible(false);
                setIsAnimatingOut(false);
                }, triggerDelay + dismissDelay);
            }

            return () => {
                clearTimeout(timer);
                if (dismissTimer) clearTimeout(dismissTimer);
            };
        } else {
            setIsVisible(false);
                setIsAnimatingOut(false);
        }
    }, [controlledOpen, triggerDelay, dismissDelay, updatePosition]);

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

   const tooltipContent = typeof content === 'string' ? (
          <Text className={cn(tooltipConfig['tooltip-text'], 'text-sm text-background')}>
              {content}
          </Text>) : content
      ;
  

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
                collapsable={false}
            >
                {children}
            </View>
            {renderTooltip()}
        </>
    );
}
