import type { Ref } from 'react';
import type { ViewProps } from 'react-native';
import { HoverCardContent as ContentPrimitive } from 'app/ui/primitives/hover-card';
import { cn } from 'app/lib/util';

export { HoverCard, HoverCardTrigger } from 'app/ui/primitives/hover-card';

type HoverCardContentProps = ViewProps & {
  className?: string;
  ref?: Ref<unknown>;
};

export function HoverCardContent({ className, children, ...props }: HoverCardContentProps) {
  return (
    <ContentPrimitive
      className={cn(
        'rounded-md border border-border/60 bg-popover p-4 text-popover-foreground shadow-md',
        className
      )}
      {...props}
    >{children}</ContentPrimitive>
  );
}
// The primitive finds its content child by this name — keep it.
HoverCardContent.displayName = 'HoverCardContent';
