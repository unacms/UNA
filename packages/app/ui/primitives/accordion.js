import * as React from 'react';
import { View, Pressable } from 'react-native';

const AccordionContext = React.createContext({});
const AccordionItemContext = React.createContext({});

function AccordionRoot({
  value,
  defaultValue,
  onValueChange,
  type = 'single',
  collapsible = false,
  disabled,
  children,
  ...props
}) {
  const [stateValue, setStateValue] = React.useState(
    value !== undefined ? value : defaultValue
  );

  const handleValueChange = (itemValue) => {
    let newValue;
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

function AccordionItem({ value, disabled, children, ...props }) {
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

function AccordionHeader({ children, ...props }) {
  return <View {...props}>{children}</View>;
}

function AccordionTrigger({ children, onPress: onPressFromProps, ...props }) {
  const context = React.useContext(AccordionContext);
  const itemContext = React.useContext(AccordionItemContext);
  
  const isExpanded =
    context.type === 'multiple'
      ? (Array.isArray(context.value) ? context.value : []).includes(itemContext.value)
      : context.value === itemContext.value;

  const handlePress = (event) => {
    onPressFromProps?.(event);
    if (!itemContext.disabled) {
      context.onValueChange(itemContext.value);
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

function AccordionContent({ children, ...props }) {
  const context = React.useContext(AccordionContext);
  const itemContext = React.useContext(AccordionItemContext);
  
  const isExpanded =
    context.type === 'multiple'
      ? (Array.isArray(context.value) ? context.value : []).includes(itemContext.value)
      : context.value === itemContext.value;

  if (!isExpanded) {
    return null;
  }

  return <View {...props}>{children}</View>;
}

function AccordionContentInner({ children, ...props }) {
    return <View {...props}>{children}</View>;
}

export const Root = AccordionRoot;
export const Item = AccordionItem;
export const Header = AccordionHeader;
export const Trigger = AccordionTrigger;
export const Content = AccordionContent;
export const ContentInner = AccordionContentInner;

