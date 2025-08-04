import { Text } from 'app/design/typography'
import { useState, useRef, useEffect } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { appSetting } from 'app/lib/util';

const tabsTheme = appSetting('theme', 'tabs');

export default function Tabs({ tabs, activeTab }) {
    const [currentTab, setCurrentTab] = useState(activeTab);
    const tabsListRef = useRef(null);

    // Auto-scroll to ensure tab is fully visible
    const scrollTabIntoView = (tabElement) => {
        if (!tabElement || !tabsListRef.current) return;
        
        const container = tabsListRef.current;
        const tabRect = tabElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate target scroll position
        let targetScrollLeft = container.scrollLeft;
        
        // Check if tab is partially hidden on the left
        if (tabRect.left < containerRect.left) {
            targetScrollLeft -= (containerRect.left - tabRect.left) + 10; // 10px padding
        }
        // Check if tab is partially hidden on the right
        else if (tabRect.right > containerRect.right) {
            targetScrollLeft += (tabRect.right - containerRect.right) + 10; // 10px padding
        }
        
        // Only animate if we need to scroll
        if (targetScrollLeft !== container.scrollLeft) {
            // Smooth scroll animation
            container.scrollTo({
                left: targetScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    // Auto-scroll when active tab changes
    useEffect(() => {
        const activeTabElement = tabsListRef.current?.querySelector('[data-state="active"]');
        if (activeTabElement) {
            scrollTabIntoView(activeTabElement);
        }
    }, [currentTab]);

    // Handle hover and focus events
    const handleTabInteraction = (event) => {
        scrollTabIntoView(event.currentTarget);
    };

    return (
        <TabsPrimitive.Root
            value={currentTab}
            onValueChange={setCurrentTab}
            className={tabsTheme["u-controls-tabs-container"]}
        >
            <TabsPrimitive.List ref={tabsListRef} className={tabsTheme["u-controls-tabs-header"]}>
                {tabs.map((tab) => (
                    <TabsPrimitive.Trigger
                        key={tab.key}
                        value={tab.key}
                        onMouseEnter={handleTabInteraction}
                        onFocus={handleTabInteraction}
                        className={`${tab.key === currentTab ? `${tabsTheme['u-controls-tabs-header-item']} ${tabsTheme['u-controls-tabs-header-item-active']}` : tabsTheme['u-controls-tabs-header-item']}`}>
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