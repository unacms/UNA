import * as React from 'react';
import { View } from 'react-native';
import { HoverCard as HoverCardPrimitive, HoverCardTrigger as TriggerPrimitive, HoverCardContent as ContentPrimitive } from 'app/ui/primitives/hover-card';
import { clsx } from 'clsx';

function cn(...inputs) {
  return clsx(inputs);
}

const HoverCard = HoverCardPrimitive;

const HoverCardTrigger = TriggerPrimitive;

const HoverCardContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <ContentPrimitive
      ref={ref}
      className={cn(
        'rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md',
        className
      )}
      {...props}
    >{children}</ContentPrimitive>
  )
);
HoverCardContent.displayName = 'HoverCardContent';

export { HoverCard, HoverCardTrigger, HoverCardContent };
