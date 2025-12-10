import * as React from 'react';
import { View, Pressable, Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const TooltipContext = React.createContext({
    open: false,
    onOpenChange: () => {},
    triggerRef: null,
    placement: 'top',
});

// Placeholder components for JSX composition
function TooltipTrigger({ children, asChild }) {
    return children;
}
TooltipTrigger.displayName = 'TooltipTrigger';

function TooltipContent({ children, className, side, sideOffset, ...props }) {
    return <View className={className} {...props}>{children}</View>;
}
TooltipContent.displayName = 'TooltipContent';

function TooltipArrow({ className, width, height, ...props }) {
    return <View className={className} {...props} />;
}
TooltipArrow.displayName = 'TooltipArrow';

// Helper to parse children
function parseTooltipChildren(children) {
    let triggerContent = null;
    let contentChild = null;
    let arrowChild = null;

    React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) return;
        const displayName = child.type?.displayName || child.type?.name;
        if (displayName === 'TooltipTrigger') {
            triggerContent = child.props.children;
        } else if (displayName === 'TooltipContent') {
            contentChild = child;
        } else if (displayName === 'TooltipArrow') {
            arrowChild = child;
        }
    });

    return { triggerContent, contentChild, arrowChild };
}

// Tooltip Root component
function TooltipRoot({
    children,
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    delayDuration = 700,
    placement = 'top',
}) {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const triggerRef = React.useRef(null);
    const openTimerRef = React.useRef(null);
    const closeTimerRef = React.useRef(null);

    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

    const clearTimers = React.useCallback(() => {
        if (openTimerRef.current) {
            clearTimeout(openTimerRef.current);
            openTimerRef.current = null;
        }
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    const setOpen = React.useCallback((newOpen) => {
        clearTimers();
        if (controlledOpen === undefined) {
            setInternalOpen(newOpen);
        }
        onOpenChange?.(newOpen);
    }, [controlledOpen, onOpenChange, clearTimers]);

    const scheduleOpen = React.useCallback(() => {
        clearTimers();
        openTimerRef.current = setTimeout(() => {
            openTimerRef.current = null;
            setOpen(true);
        }, delayDuration);
    }, [clearTimers, setOpen, delayDuration]);

    const scheduleClose = React.useCallback(() => {
        clearTimers();
        closeTimerRef.current = setTimeout(() => {
            closeTimerRef.current = null;
            setOpen(false);
        }, 100);
    }, [clearTimers, setOpen]);

    const handleMouseEnter = React.useCallback(() => {
        scheduleOpen();
    }, [scheduleOpen]);

    const handleMouseLeave = React.useCallback(() => {
        scheduleClose();
    }, [scheduleClose]);

    const handlePress = React.useCallback(() => {
        setOpen(!isOpen);
    }, [setOpen, isOpen]);

    const handleContentMouseEnter = React.useCallback(() => {
        clearTimers();
    }, [clearTimers]);

    const handleContentMouseLeave = React.useCallback(() => {
        scheduleClose();
    }, [scheduleClose]);

    React.useEffect(() => {
        return () => clearTimers();
    }, [clearTimers]);

    const contextValue = React.useMemo(() => ({
        open: isOpen,
        onOpenChange: setOpen,
        triggerRef,
        placement,
        handleMouseEnter,
        handleMouseLeave,
        handlePress,
        handleContentMouseEnter,
        handleContentMouseLeave,
    }), [isOpen, setOpen, placement, handleMouseEnter, handleMouseLeave, handlePress, handleContentMouseEnter, handleContentMouseLeave]);

    return (
        <TooltipContext.Provider value={contextValue}>
            <View collapsable={false}>
                {children}
            </View>
        </TooltipContext.Provider>
    );
}

// Provider for tooltip configuration
function TooltipProvider({ children, delayDuration = 700, skipDelayDuration = 300 }) {
    return <>{children}</>;
}

// Hook to access tooltip context
function useTooltipContext() {
    const context = React.useContext(TooltipContext);
    if (!context) {
        throw new Error('useTooltipContext must be used within a TooltipRoot');
    }
    return context;
}

export const Root = TooltipRoot;
export const Provider = TooltipProvider;
export const Trigger = TooltipTrigger;
export const Content = TooltipContent;
export const Arrow = TooltipArrow;
export { 
    TooltipRoot, 
    TooltipProvider, 
    TooltipTrigger, 
    TooltipContent, 
    TooltipArrow,
    useTooltipContext,
    parseTooltipChildren 
};

