export default function Tooltip({children, content, enabled = true}) {
    return children;
}

/*import * as React from 'react';
import { View, Pressable, Platform } from 'react-native';
import * as TooltipPrimitive from 'app/ui/primitives/tooltip';
import { Text } from 'app/design/typography';
import { clsx } from 'clsx';
import { appSetting } from 'app/lib/util';

const isWeb = Platform.OS === 'web';

function cn(...inputs) {
    return clsx(inputs);
}

const tooltipTheme = appSetting('theme', 'tooltip') || {};

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <TooltipPrimitive.Root
            ref={ref}
            {...props}
        />
    );
});
Tooltip.displayName = 'Tooltip';

const TooltipTrigger = React.forwardRef(({ className, asChild, children, ...props }, ref) => {
    const context = TooltipPrimitive.useTooltipContext();
    
    if (isWeb) {
        return (
            <View
                ref={(node) => {
                    if (ref) {
                        if (typeof ref === 'function') ref(node);
                        else ref.current = node;
                    }
                    context.triggerRef.current = node;
                }}
                onMouseEnter={context.handleMouseEnter}
                onMouseLeave={context.handleMouseLeave}
                collapsable={false}
                {...props}
            >
                {children}
            </View>
        );
    }
    
    return (
        <Pressable
            ref={(node) => {
                if (ref) {
                    if (typeof ref === 'function') ref(node);
                    else ref.current = node;
                }
                context.triggerRef.current = node;
            }}
            onPress={context.handlePress}
            collapsable={false}
            {...props}
        >
            {children}
        </Pressable>
    );
});
TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = React.forwardRef(({ 
    className, 
    sideOffset = 4, 
    side = 'top',
    children,
    ...props 
}, ref) => {
    const context = TooltipPrimitive.useTooltipContext();
    
    if (!context.open) return null;
    
    return (
        <View
            ref={ref}
            className={cn(
                tooltipTheme['tooltip-content'],
                className
            )}
            {...props}
        >
            {typeof children === 'string' ? (
                <Text className={tooltipTheme['tooltip-text']}>{children}</Text>
            ) : children}
        </View>
    );
});
TooltipContent.displayName = 'TooltipContent';

const TooltipArrow = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <View
            ref={ref}
            className={cn(
                tooltipTheme['tooltip-arrow'],
                className
            )}
            {...props}
        />
    );
});
TooltipArrow.displayName = 'TooltipArrow';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipArrow, TooltipProvider };*/
