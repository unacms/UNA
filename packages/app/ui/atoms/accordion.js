import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';
import * as AccordionPrimitive from 'app/ui/primitives/accordion';
import { clsx } from 'clsx';
import { Icon } from 'app/ui/atoms/icon';

function cn(...inputs) {
  return clsx(inputs);
}

const Accordion = React.forwardRef(({ className, ...props }, ref) => (
  <AccordionPrimitive.Root
    ref={ref}
    className={cn('web:overflow-hidden', className)}
    {...props}
  />
));
Accordion.displayName = AccordionPrimitive.Root.displayName;

const AccordionItem = React.forwardRef(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b border-border overflow-hidden', className)}
    {...props}
  />
));
AccordionItem.displayName = AccordionPrimitive.Item.displayName;

const AccordionTrigger = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          'flex flex-row items-center justify-between py-4 font-medium transition-all web:hover:underline [&[data-state=open]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        {({ isExpanded }) => (
            <>
            {children}
            <Icon
                icon="ChevronDown"
                size={18}
                className={cn(
                'text-foreground shrink-0 transition-transform duration-200',
                isExpanded && 'rotate-180'
                )}
            />
            </>
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
);
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      'overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
      className
    )}
    {...props}
  >
    <View className={cn('pb-4 pt-0', className)}>
      {children}
    </View>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

