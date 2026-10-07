import * as React from 'react';
import { View, Pressable, Platform, type PressableProps, type ViewProps } from 'react-native';

type TabsContextValue = {
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  activationMode?: 'automatic' | 'manual';
  disabled?: boolean;
};

const TabsContext = React.createContext<TabsContextValue>({});

type TabsRootProps = ViewProps & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  activationMode?: 'automatic' | 'manual';
  disabled?: boolean;
  ref?: React.Ref<View>;
};

function TabsRoot({
  value,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  activationMode = 'automatic',
  disabled,
  children,
  ...props
}: TabsRootProps) {
  const [stateValue, setStateValue] = React.useState(
    value !== undefined ? value : defaultValue
  );

  const handleValueChange = React.useCallback((tabValue: string) => {
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
      <View {...props}>
        {children}
      </View>
    </TabsContext.Provider>
  );
}

type TabsListProps = ViewProps & { ref?: React.Ref<View> };

function TabsList({ children, ...props }: TabsListProps) {
  const context = React.useContext(TabsContext);

  return (
    <View
      accessibilityRole="tablist"
      aria-orientation={context.orientation}
      {...props}
    >
      {children}
    </View>
  );
}

type TabsTriggerState = { isSelected: boolean; isDisabled: boolean };

type TabsTriggerProps = Omit<PressableProps, 'children'> & {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode | ((state: TabsTriggerState) => React.ReactNode);
  /** Required for `measureLayout` + scroll-into-view in `molecules/tabs`. */
  ref?: React.Ref<View>;
};

function TabsTrigger({ value, disabled, children, ...props }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);

  const isSelected = context.value === value;
  const isDisabled = !!(disabled || context.disabled);

  const handlePress = () => {
    if (!isDisabled) {
      context.onValueChange?.(value);
    }
  };

  return (
    <Pressable
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
}

type TabsContentProps = ViewProps & {
  value: string;
  /** Keep mounted while inactive. */
  forceMount?: boolean;
};

function TabsContent({ value, forceMount, children, ...props }: TabsContentProps) {
  const context = React.useContext(TabsContext);

  const isSelected = context.value === value;

  if (!forceMount && !isSelected) {
    return null;
  }

  return (
    <View
      // "tabpanel" is a react-native-web role; RN types don't list it.
      accessibilityRole={'tabpanel' as ViewProps['accessibilityRole']}
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
  return React.useContext(TabsContext);
}

export const Root = TabsRoot;
export const List = TabsList;
export const Trigger = TabsTrigger;
export const Content = TabsContent;
export { useTabsContext };
