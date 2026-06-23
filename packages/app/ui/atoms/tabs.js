import * as React from 'react';
import { View } from 'react-native';
import * as TabsPrimitive from 'app/ui/primitives/tabs';
import { Text } from 'app/design/typography';
import { appSetting, cn } from 'app/lib/util';

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

const TabsList = React.forwardRef(({ className, fullWidth = false, rounded = false, hug = false, size, ...props }, ref) => {
  const currentSizeKey = size || tabsSizes?.default_size || 'md';
  const sizeCfg = tabsSizes?.[currentSizeKey] || tabsSizes?.md || {};
  const radiusRow = rounded ? 'rounded-full' : (sizeCfg.row || 'rounded-xl');

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        tabsTheme['u-controls-tabs-header'],
        fullWidth && 'w-full',
        radiusRow,
        sizeCfg.header,
        hug && 'justify-start flex-none w-auto self-start',
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef(({ className, rounded = false, hug = false, size, children, ...props }, ref) => {
  const currentSizeKey = size || tabsSizes?.default_size || 'md';
  const sizeCfg = tabsSizes?.[currentSizeKey] || tabsSizes?.md || {};
  const radiusPill = rounded
    ? 'rounded-full overflow-hidden'
    : (sizeCfg.pill || 'rounded-lg overflow-hidden');

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        tabsTheme['u-controls-tabs-header-item'],
        sizeCfg.item,
        radiusPill,
        hug && 'flex-none shrink-0',
        className
      )}
      {...props}
    >
      {({ isSelected }) => (
        <View className={cn(
          isSelected 
            ? tabsTheme['u-controls-tabs-header-item-active']
            : tabsTheme['u-controls-tabs-header-item-inactive'],
          'flex-1 items-center justify-center'
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

