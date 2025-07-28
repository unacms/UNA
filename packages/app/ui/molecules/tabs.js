import { Text } from 'app/design/typography'
import { useState } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs';

export default function Tabs({ tabs, activeTab }) {
    const [currentTab, setCurrentTab] = useState(activeTab);
    return (
        <TabsPrimitive.Root
            value={currentTab}
            onValueChange={setCurrentTab}
            className="u-controls-tabs-container"
        >
            <TabsPrimitive.List className="u-controls-tabs-header">
                {tabs.map((tab) => (
                    <TabsPrimitive.Trigger
                        key={tab.key}
                        value={tab.key}
                        className={`${tab.key === currentTab ? 'u-controls-tabs-header-item-active' : 'u-controls-tabs-header-item'}`}>
                        <Text className={`${tab.key === currentTab ? 'u-controls-tabs-header-item-text-active' : 'u-controls-tabs-header-item-text'}`}>{tab.title}</Text>
                    </TabsPrimitive.Trigger>
                ))}
            </TabsPrimitive.List>

            {tabs.map((tab) => (
                <TabsPrimitive.Content className='u-controls-tabs-tab-content' key={tab.key} value={tab.key}>
                    {tab.content}
                </TabsPrimitive.Content>
            ))}
        </TabsPrimitive.Root>
    );
}