import * as React from 'react';
import { View, Pressable, Platform } from 'react-native';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';

const isWeb = Platform.OS === 'web';

// Placeholder components for JSX composition
function HoverCardTrigger({ children }) {
  return children;
}
HoverCardTrigger.displayName = 'HoverCardTrigger';

function HoverCardContent({ children, className, ...props }) {
  return <View className={className} {...props}>{children}</View>;
}
HoverCardContent.displayName = 'HoverCardContent';

// Helper to parse children once
function parseHoverCardChildren(children) {
  let triggerContent = null;
  let contentChild = null;
  
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const displayName = child.type?.displayName || child.type?.name;
    if (displayName === 'HoverCardTrigger') {
      triggerContent = child.props.children;
    } else if (displayName === 'HoverCardContent') {
      contentChild = child;
    }
  });
  
  return { triggerContent, contentChild };
}

// Separated trigger wrapper to avoid re-renders
const TriggerWrapper = React.memo(function TriggerWrapper({ 
  children, 
  onMouseEnter, 
  onMouseLeave,
  onPress,
}) {
  if (isWeb) {
    return (
      <View onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {children}
      </View>
    );
  }
  return <Pressable onPress={onPress}>{children}</Pressable>;
});

// Separated content wrapper to avoid re-renders
const ContentWrapper = React.memo(function ContentWrapper({ 
  children, 
  className,
  onMouseEnter, 
  onMouseLeave,
}) {
  return (
    <View 
      className={className}
      {...(isWeb ? { onMouseEnter, onMouseLeave } : {})}
    >
      {children}
    </View>
  );
});

// Main HoverCard component that uses DropdownPopup for rendering
const HoverCard = React.memo(function HoverCard({ 
  children, 
  open: controlledOpen, 
  defaultOpen = false, 
  onOpenChange,
  openDelay = 1000, // 1 second delay to avoid accidental triggers
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const openTimerRef = React.useRef(null);
  const closeTimerRef = React.useRef(null);
  const isHoveringContent = React.useRef(false);
  const isHoveringTrigger = React.useRef(false);
  const protectionEndTime = React.useRef(0);

  // Use controlled or internal state
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
    if (newOpen) {
      // Set protection end time - ignore close events for 100ms after opening
      // Reduced from 300ms for faster dismissal while still preventing flickering
      protectionEndTime.current = Date.now() + 100;
    } else {
      protectionEndTime.current = 0;
    }
    clearTimers();
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [controlledOpen, onOpenChange, clearTimers]);

  const isProtected = React.useCallback(() => {
    return Date.now() < protectionEndTime.current;
  }, []);

  const tryClose = React.useCallback(() => {
    // Don't close during protection period
    if (isProtected()) {
      return;
    }
    // Don't close if hovering trigger or content
    if (isHoveringContent.current || isHoveringTrigger.current) {
      return;
    }
    setOpen(false);
  }, [isProtected, setOpen]);

  const scheduleOpen = React.useCallback(() => {
    clearTimers();
    if (isHoveringTrigger.current) {
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null;
        if (isHoveringTrigger.current) {
          setOpen(true);
        }
      }, openDelay);
    }
  }, [clearTimers, setOpen, openDelay]);

  const scheduleClose = React.useCallback(() => {
    // Cancel any pending open
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    // Clear existing close timer and set new one
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    // Immediate close with minimal delay for state to settle
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      tryClose();
    }, 10);
  }, [tryClose]);

  const handleTriggerMouseEnter = React.useCallback(() => {
    isHoveringTrigger.current = true;
    clearTimers();
    if (!isOpen) {
      scheduleOpen();
    }
  }, [clearTimers, isOpen, scheduleOpen]);

  const handleTriggerMouseLeave = React.useCallback(() => {
    isHoveringTrigger.current = false;
    scheduleClose();
  }, [scheduleClose]);

  const handleContentMouseEnter = React.useCallback(() => {
    isHoveringContent.current = true;
    clearTimers();
  }, [clearTimers]);

  const handleContentMouseLeave = React.useCallback(() => {
    isHoveringContent.current = false;
    scheduleClose();
  }, [scheduleClose]);

  // Close when backdrop is clicked
  const handleDropdownOpenChange = React.useCallback((newOpen) => {
    if (!newOpen && !isProtected()) {
      isHoveringContent.current = false;
      isHoveringTrigger.current = false;
      setOpen(false);
    }
  }, [isProtected, setOpen]);

  const handleTogglePress = React.useCallback(() => {
    setOpen(!isOpen);
  }, [setOpen, isOpen]);

  React.useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Parse children - memoized to prevent re-parsing
  const { triggerContent, contentChild } = React.useMemo(
    () => parseHoverCardChildren(children), 
    [children]
  );

  // Memoize content class and children to prevent re-renders
  const contentClassName = contentChild?.props?.className;
  const contentChildren = contentChild?.props?.children;

  // Render trigger with stable handlers - memoized
  const trigger = React.useMemo(() => (
    <TriggerWrapper
      onMouseEnter={handleTriggerMouseEnter}
      onMouseLeave={handleTriggerMouseLeave}
      onPress={handleTogglePress}
    >
      {triggerContent}
    </TriggerWrapper>
  ), [triggerContent, handleTriggerMouseEnter, handleTriggerMouseLeave, handleTogglePress]);

  // Render content with stable handlers - memoized
  const content = React.useMemo(() => contentChild ? (
    <ContentWrapper
      className={contentClassName}
      onMouseEnter={handleContentMouseEnter}
      onMouseLeave={handleContentMouseLeave}
    >
      {contentChildren}
    </ContentWrapper>
  ) : null, [contentChild, contentClassName, contentChildren, handleContentMouseEnter, handleContentMouseLeave]);

  return (
    <DropdownPopup
      open={isOpen}
      onOpenChange={handleDropdownOpenChange}
      trigger={trigger}
      minPopupWidth={320}
      hoverMode={true}
    >
      {content}
    </DropdownPopup>
  );
});

export const Root = HoverCard;
export const Trigger = HoverCardTrigger;
export const Content = HoverCardContent;
export { HoverCard, HoverCardTrigger, HoverCardContent };
