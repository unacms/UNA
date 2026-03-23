import * as React from 'react';
import { View, Pressable, Platform } from 'react-native';

const TabsContext = React.createContext({});

const TabsRoot = React.forwardRef(function TabsRoot(
  {
    value,
    defaultValue,
    onValueChange,
    orientation = 'horizontal',
    activationMode = 'automatic',
    disabled,
    children,
    ...props
  },
  ref
) {
  const [stateValue, setStateValue] = React.useState(
    value !== undefined ? value : defaultValue
  );

  const handleValueChange = React.useCallback((tabValue) => {
    if (value === undefined) {
      setStateValue(tabValue);
    }
    onValueChange?.(tabValue);
  }, [value, onValueChange]);

  const contextValue = React.useMemo(
    () => ({
      value: value !== undefined ? value : stateValue,
      onValueChange: handleValueChange,
      orientation,
      activationMode,
      disabled,
    }),
    [value, stateValue, handleValueChange, orientation, activationMode, disabled]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <View ref={ref} {...props}>
        {children}
      </View>
    </TabsContext.Provider>
  );
});
TabsRoot.displayName = 'TabsRoot';

const TabsList = React.forwardRef(function TabsList({ children, ...props }, ref) {
  const context = React.useContext(TabsContext);

  return (
    <View
      ref={ref}
      accessibilityRole="tablist"
      aria-orientation={context.orientation}
      {...props}
    >
      {children}
    </View>
  );
});
TabsList.displayName = 'TabsList';

/** Ref on Pressable is required for `measureLayout` + scroll-into-view in `molecules/tabs`. */
const TabsTrigger = React.forwardRef(function TabsTrigger(
  { value, disabled, children, ...props },
  ref
) {
  const context = React.useContext(TabsContext);

  const isSelected = context.value === value;
  const isDisabled = disabled || context.disabled;

  const handlePress = () => {
    if (!isDisabled) {
      context.onValueChange(value);
    }
  };

  return (
    <Pressable
      ref={ref}
      collapsable={Platform.OS === 'android' ? false : undefined}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="tab"
      accessibilityState={{ selected: isSelected, disabled: isDisabled }}
      aria-selected={isSelected}
      data-state={isSelected ? 'active' : 'inactive'}
      data-disabled={isDisabled ? '' : undefined}
      {...props}
    >
      {typeof children === 'function'
        ? children({ isSelected, isDisabled })
        : children}
    </Pressable>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

function TabsContent({ value, forceMount, children, ...props }) {
  const context = React.useContext(TabsContext);
  
  const isSelected = context.value === value;

  if (!forceMount && !isSelected) {
    return null;
  }

  return (
    <View 
      accessibilityRole="tabpanel"
      aria-hidden={!isSelected}
      data-state={isSelected ? 'active' : 'inactive'}
      {...props}
    >
      {children}
    </View>
  );
}

// Hook to access tabs context from custom components
function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('useTabsContext must be used within a TabsRoot');
  }
  return context;
}

export const Root = TabsRoot;
export const List = TabsList;
export const Trigger = TabsTrigger;
export const Content = TabsContent;
export { useTabsContext };

