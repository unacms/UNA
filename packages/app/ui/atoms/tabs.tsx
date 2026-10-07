import type { ReactNode, Ref } from 'react';
import { View, type ViewProps } from 'react-native';
import * as TabsPrimitive from 'app/ui/primitives/tabs';
import { Text } from 'app/design/typography';
import { appSetting, cn } from 'app/lib/util';

const tabsTheme = appSetting('theme', 'tabs');
const tabsSizes = appSetting('theme', 'tabs_sizes');

/** Size key from `theme.tabs_sizes` (`sm`, `md`, …). */
type TabsSize = string;

type TabsSizeConfig = {
  row?: string;
  pill?: string;
  header?: string;
  item?: string;
  text?: string;
  text_active?: string;
};

function getSizeConfig(size?: TabsSize): TabsSizeConfig {
  const key = size || tabsSizes?.default_size || 'md';
  return tabsSizes?.[key] || tabsSizes?.md || {};
}

type TabsProps = ViewProps & {
  className?: string;
  size?: TabsSize;
  value?: string;
  onValueChange?: (value: string) => void;
  ref?: Ref<View>;
};

export function Tabs({ className, size: _size, ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root
      className={cn(tabsTheme['u-controls-tabs-container'], className)}
      {...props}
    />
  );
}

type TabsListProps = ViewProps & {
  className?: string;
  fullWidth?: boolean;
  rounded?: boolean;
  /** Shrink to content instead of stretching. */
  hug?: boolean;
  size?: TabsSize;
  ref?: Ref<View>;
};

export function TabsList({ className, fullWidth = false, rounded = false, hug = false, size, ...props }: TabsListProps) {
  const sizeCfg = getSizeConfig(size);
  const radiusRow = rounded ? 'rounded-full' : (sizeCfg.row || 'rounded-xl');

  return (
    <TabsPrimitive.List
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
}

type TabsTriggerProps = {
  value: string;
  className?: string;
  rounded?: boolean;
  hug?: boolean;
  size?: TabsSize;
  disabled?: boolean;
  /** A string is rendered with the theme's text classes; a function gets the selected state. */
  children?: ReactNode | ((state: { isSelected: boolean }) => ReactNode);
  ref?: Ref<View>;
  [key: string]: unknown;
};

export function TabsTrigger({ className, rounded = false, hug = false, size, children, ...props }: TabsTriggerProps) {
  const sizeCfg = getSizeConfig(size);
  const radiusPill = rounded
    ? 'rounded-full overflow-hidden'
    : (sizeCfg.pill || 'rounded-lg overflow-hidden');

  return (
    <TabsPrimitive.Trigger
      className={cn(
        tabsTheme['u-controls-tabs-header-item'],
        sizeCfg.item,
        radiusPill,
        hug && 'flex-none shrink-0',
        className
      )}
      {...props}
    >
      {({ isSelected }: { isSelected: boolean }) => (
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
}

type TabsContentProps = ViewProps & {
  value: string;
  className?: string;
  ref?: Ref<View>;
};

export function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={cn(
        tabsTheme['u-controls-tabs-tab-content'],
        className
      )}
      {...props}
    />
  );
}
