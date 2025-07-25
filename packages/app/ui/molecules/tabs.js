import { Text } from 'app/design/typography'
import { useState } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs';

export default function Tabs({ tabs, activeTab }) {
    const [currentTab, setCurrentTab] = useState(activeTab);
    return (
        <TabsPrimitive.Root
            value={currentTab}
            onValueChange={setCurrentTab}
            className="u-cn-tb-cnt"
        >
            <TabsPrimitive.List className="u-cn-tb-hdr">
                {tabs.map((tab) => (
                    <TabsPrimitive.Trigger
                        key={tab.key}
                        value={tab.key}
                        className={`${tab.key === currentTab ? 'u-cn-tb-hdr-itm-act' : 'u-cn-tb-hdr-itm'}`}>
                        <Text className={`${tab.key === currentTab ? 'u-cn-tb-hdr-itm-txt-act' : 'u-cn-tb-hdr-itm-txt'}`}>{tab.title}</Text>
                    </TabsPrimitive.Trigger>
                ))}
            </TabsPrimitive.List>

            {tabs.map((tab) => (
                <TabsPrimitive.Content className='u-cn-tb-tab-cnt' key={tab.key} value={tab.key}>
                    {tab.content}
                </TabsPrimitive.Content>
            ))}
        </TabsPrimitive.Root>
    );
}