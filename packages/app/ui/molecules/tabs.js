import { Text } from 'app/design/typography'
import { useState} from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { appSetting } from 'app/lib/util';

const tabsTheme = appSetting('theme', 'tabs');

export default function Tabs({ tabs, activeTab, fullWidth = false }) {
    const [currentTab, setCurrentTab] = useState(activeTab);

   
    return (
        <TabsPrimitive.Root
            value={currentTab}
            onValueChange={setCurrentTab}
            className={tabsTheme["u-controls-tabs-container"]}
        >
            <TabsPrimitive.List className={fullWidth ? tabsTheme["u-controls-tabs-header-full-width"] : tabsTheme["u-controls-tabs-header"]}>
                {tabs.map((tab) => (
                    <TabsPrimitive.Trigger
                        key={tab.key}
                        value={tab.key}
                        className={` ${tabsTheme['u-controls-tabs-header-item']} ${tab.key === currentTab ? tabsTheme['u-controls-tabs-header-item-active'] : tabsTheme['u-controls-tabs-header-item-inactive']}`}>
                        <Text className={`${tab.key === currentTab ? tabsTheme['u-controls-tabs-header-item-text-active'] : tabsTheme['u-controls-tabs-header-item-text']}`}>{tab.title}</Text>
                    </TabsPrimitive.Trigger>
                ))}
            </TabsPrimitive.List>

            {tabs.map((tab) => (
                <TabsPrimitive.Content 
                    className={`${tabsTheme['u-controls-tabs-tab-content']} ${tabsTheme['u-controls-tabs-tab-content-animated']}`}
                    key={tab.key} 
                    value={tab.key}
                >
                    {tab.content}
                </TabsPrimitive.Content>
            ))}
        </TabsPrimitive.Root>
    );
}