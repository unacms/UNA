import * as React from 'react';
import type { GestureResponderEvent, PressableProps, ViewProps } from 'react-native';
import { View, Pressable } from 'app/design/view'

/** `single`: one open item (string); `multiple`: any number (string[]). */
export type AccordionValue = string | string[];

type AccordionContextValue = {
  value?: AccordionValue;
  onValueChange?: (itemValue: string) => void;
  disabled?: boolean;
  type?: 'single' | 'multiple';
};

type AccordionItemContextValue = {
  value?: string;
  disabled?: boolean;
};

const AccordionContext = React.createContext<AccordionContextValue>({});
const AccordionItemContext = React.createContext<AccordionItemContextValue>({});

type AccordionRootProps = ViewProps & {
  value?: AccordionValue;
  defaultValue?: AccordionValue;
  onValueChange?: (value: AccordionValue) => void;
  type?: 'single' | 'multiple';
  /** `single` only: pressing the open item closes it. */
  collapsible?: boolean;
  disabled?: boolean;
};

function AccordionRoot({
  value,
  defaultValue,
  onValueChange,
  type = 'single',
  collapsible = false,
  disabled,
  children,
  ...props
}: AccordionRootProps) {
  const [stateValue, setStateValue] = React.useState(
    value !== undefined ? value : defaultValue
  );

  const handleValueChange = (itemValue: string) => {
    let newValue: AccordionValue;
    if (type === 'multiple') {
      const current = Array.isArray(stateValue) ? stateValue : [];
      const isSelected = current.includes(itemValue);
      if (isSelected) {
        newValue = current.filter((v) => v !== itemValue);
      } else {
        newValue = [...current, itemValue];
      }
    } else {
      // single
      if (stateValue === itemValue) {
        newValue = collapsible ? '' : itemValue;
      } else {
        newValue = itemValue;
      }
    }

    if (value === undefined) {
      setStateValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const contextValue = React.useMemo(
    () => ({
      value: value !== undefined ? value : stateValue,
      onValueChange: handleValueChange,
      disabled,
      type,
    }),
    [value, stateValue, handleValueChange, disabled, type]
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <View {...props}>{children}</View>
    </AccordionContext.Provider>
  );
}

type AccordionItemProps = ViewProps & {
  value: string;
  disabled?: boolean;
};

function AccordionItem({ value, disabled, children, ...props }: AccordionItemProps) {
  const context = React.useContext(AccordionContext);
  const itemContextValue = React.useMemo(
    () => ({ value, disabled: disabled || context.disabled }),
    [value, disabled, context.disabled]
  );

  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      <View {...props}>{children}</View>
    </AccordionItemContext.Provider>
  );
}

function AccordionHeader({ children, ...props }: ViewProps) {
  return <View {...props}>{children}</View>;
}

function useIsExpanded() {
  const context = React.useContext(AccordionContext);
  const itemContext = React.useContext(AccordionItemContext);
  const isExpanded =
    context.type === 'multiple'
      ? (Array.isArray(context.value) ? context.value as (string | undefined)[] : []).includes(itemContext.value)
      : context.value === itemContext.value;
  return { context, itemContext, isExpanded };
}

type AccordionTriggerProps = Omit<PressableProps, 'children'> & {
  children?: React.ReactNode | ((state: { isExpanded: boolean }) => React.ReactNode);
};

function AccordionTrigger({ children, onPress: onPressFromProps, ...props }: AccordionTriggerProps) {
  const { context, itemContext, isExpanded } = useIsExpanded();

  const handlePress = (event: GestureResponderEvent) => {
    onPressFromProps?.(event);
    if (!itemContext.disabled) {
      context.onValueChange?.(itemContext.value as string);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={itemContext.disabled}
      accessibilityRole="button"
      aria-expanded={isExpanded}
      {...props}
    >
      {typeof children === 'function'
        ? children({ isExpanded })
        : children}
    </Pressable>
  );
}

function AccordionContent({ children, ...props }: ViewProps) {
  const { isExpanded } = useIsExpanded();

  if (!isExpanded) {
    return null;
  }

  return <View {...props}>{children}</View>;
}

function AccordionContentInner({ children, ...props }: ViewProps) {
    return <View {...props}>{children}</View>;
}

export const Root = AccordionRoot;
export const Item = AccordionItem;
export const Header = AccordionHeader;
export const Trigger = AccordionTrigger;
export const Content = AccordionContent;
export const ContentInner = AccordionContentInner;
