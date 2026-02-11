import { useEffect, useRef, useCallback } from 'react';
import { View } from 'react-native';
import * as TooltipPrimitive from '@rn-primitives/tooltip';
import { Text } from 'app/design/typography';
import { appSetting, cn } from 'app/lib/util';
import { useScrollDirection } from 'app/context/jotai/layout';
import { useFocusEffect } from 'app/lib/hooks/router';

// Get tooltip configuration from settings
const tooltipConfig = appSetting('theme', 'tooltip') || {};

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
    triggerClassName
}) {
    const scrollDirection = useScrollDirection();
    const triggerRef = useRef(null);

    useFocusEffect(
        useCallback(() => {
            return () => {
                triggerRef.current?.close();
            };
        }, [])
    );

    useEffect(() => {
        if (controlledOpen === undefined || !triggerRef.current) return;

        if (scrollDirection !== 0) {
            triggerRef.current?.close();
            return;
        }


        if (controlledOpen) {
            const timer = setTimeout(() => {
                triggerRef.current?.open();
            }, triggerDelay);

            let dismissTimer;
            if (dismissDelay > 0) {
                dismissTimer = setTimeout(() => {
                    triggerRef.current?.close();
                }, triggerDelay + dismissDelay);
            }

            return () => {
                clearTimeout(timer);
                if (dismissTimer) clearTimeout(dismissTimer);
            };
        } else {
            triggerRef.current?.close();
        }
    }, [controlledOpen, triggerDelay, dismissDelay, scrollDirection]);


    const tooltipContent = typeof content === 'string' ? (
        <Text className={cn(tooltipConfig['tooltip-text'], 'text-sm text-background')}>
            {content}
        </Text>) : content
    ;

    return (
        <TooltipPrimitive.Root className={triggerClassName}>
            <TooltipPrimitive.Trigger ref={triggerRef} asChild >
                {children}
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                    side={side}
                    sideOffset={sideOffset}
                    align={align}
                    alignOffset={alignOffset}
                    avoidCollisions={true}
                    forceMount={controlledOpen ? true : undefined}
                    className={cn(
                        'bg-foreground px-4 py-2 ios:-mt-12 rounded-lg shadow-lg',
                        tooltipConfig['tooltip-content'],
                        className
                    )}
                >
                    {tooltipContent}
                    {showArrow && (
                        <View
                            className={cn(
                                'absolute w-3 h-3 bg-foreground rotate-45',
                                side === 'bottom' && '-top-1.5 self-center',
                                side === 'top' && '-bottom-1.5 self-center',
                                side === 'left' && '-right-1.5 self-center',
                                side === 'right' && '-left-1.5 self-center',
                                arrowClassName
                            )}
                        />
                    )}
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
    );
}