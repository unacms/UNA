import * as React from 'react';
import { View } from 'react-native';
import * as TabsPrimitive from 'app/ui/primitives/tabs';
import { Text } from 'app/design/typography';
import { clsx } from 'clsx';
import { appSetting } from 'app/lib/util';

function cn(...inputs) {
  return clsx(inputs);
}

const tabsTheme = appSetting('theme', 'tabs');
const tabsSizes = appSetting('theme', 'tabs_sizes');

const Tabs = React.forwardRef(({ className, size, ...props }, ref) => {
  const currentSizeKey = size || tabsSizes?.default_size || 'md';
  
  return (
    <TabsPrimitive.Root
      ref={ref}
      className={cn(tabsTheme['u-controls-tabs-container'], className)}
      {...props}
    />
  );
});
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef(({ className, fullWidth = false, size, ...props }, ref) => {
  const currentSizeKey = size || tabsSizes?.default_size || 'md';
  const sizeCfg = tabsSizes?.[currentSizeKey] || tabsSizes?.md || {};
  
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        fullWidth 
          ? tabsTheme['u-controls-tabs-header-full-width'] 
          : tabsTheme['u-controls-tabs-header'],
        sizeCfg.header,
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef(({ className, size, children, ...props }, ref) => {
  const currentSizeKey = size || tabsSizes?.default_size || 'md';
  const sizeCfg = tabsSizes?.[currentSizeKey] || tabsSizes?.md || {};
  
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        tabsTheme['u-controls-tabs-header-item'],
        sizeCfg.item,
        className
      )}
      {...props}
    >
      {({ isSelected }) => (
        <View className={cn(
          isSelected 
            ? tabsTheme['u-controls-tabs-header-item-active']
            : tabsTheme['u-controls-tabs-header-item-inactive'],
          'flex-1 items-center justify-center rounded-lg'
        )}>
          {typeof children === 'function' 
            ? children({ isSelected })
            : typeof children === 'string' 
              ? (
                <Text className={cn(
                  isSelected
                    ? cn(tabsTheme['u-controls-tabs-header-item-text-active'], sizeCfg.text_active)
                    : cn(tabsTheme['u-controls-tabs-header-item-text'], sizeCfg.text)
                )}>
                  {children}
                </Text>
              )
              : children
          }
        </View>
      )}
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      tabsTheme['u-controls-tabs-tab-content'],
      className
    )}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };

