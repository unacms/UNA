import { Text } from 'app/design/typography'
import { useState, useRef, useEffect, useCallback } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { appSetting } from 'app/lib/util';

const tabsTheme = appSetting('theme', 'tabs');
const tabsSizes = appSetting('theme', 'tabs_sizes');

export default function Tabs({ tabs, activeTab, fullWidth = false, size, contentClassName = '' }) {
    const [currentTab, setCurrentTab] = useState(activeTab);
    const headerWrapperRef = useRef(null);
    const listRef = useRef(null);
    const triggerRefs = useRef({});
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
    const [ready, setReady] = useState(false);
    const readyRef = useRef(false);

    const updateIndicator = useCallback(() => {
        try {
            const wrapper = headerWrapperRef.current;
            const list = listRef.current;
            const currentEl = triggerRefs.current?.[currentTab];
            if (!wrapper || !list || !currentEl) return;
            const wrapperRect = wrapper.getBoundingClientRect();
            const elRect = currentEl.getBoundingClientRect();
            const left = elRect.left - wrapperRect.left;
            const width = elRect.width;
            setIndicatorStyle({ left, width });
            if (!readyRef.current) {
                readyRef.current = true;
                setReady(true);
            }
        } catch (e) {}
    }, [currentTab]);

    useEffect(() => {
        updateIndicator();
        const onResize = () => updateIndicator();
        window.addEventListener('resize', onResize);
        const list = listRef.current;
        if (list) list.addEventListener('scroll', onResize, { passive: true });
        return () => {
            window.removeEventListener('resize', onResize);
            if (list) list.removeEventListener('scroll', onResize);
        };
    }, [updateIndicator]);

   
    const currentSizeKey = size || tabsSizes?.default_size || 'md';
    const sizeCfg = tabsSizes?.[currentSizeKey] || tabsSizes?.md || {};

    return (
        <TabsPrimitive.Root
            value={currentTab}
            onValueChange={setCurrentTab}
            className={tabsTheme['u-controls-tabs-container']}
        >
            <div className="relative overflow-hidden" ref={headerWrapperRef}>
                <TabsPrimitive.List ref={listRef} className={`${fullWidth ? tabsTheme['u-controls-tabs-header-full-width'] : tabsTheme['u-controls-tabs-header']}${sizeCfg.header || ''}`}>
                    {tabs.map((tab) => (
                        <TabsPrimitive.Trigger
                            ref={(node) => {
                                if (node) triggerRefs.current[tab.key] = node;
                            }}
                            key={tab.key}
                            value={tab.key}
                            className={` ${tabsTheme['u-controls-tabs-header-item']}${sizeCfg.item || ''} ${tab.key === currentTab ? tabsTheme['u-controls-tabs-header-item-active'] : tabsTheme['u-controls-tabs-header-item-inactive']}`}
                        >
                            <Text className={`${tab.key === currentTab ? `${tabsTheme['u-controls-tabs-header-item-text-active']}${sizeCfg.text_active || ''}` : `${tabsTheme['u-controls-tabs-header-item-text']}${sizeCfg.text || ''}`}`}>{tab.title}</Text>
                        </TabsPrimitive.Trigger>
                    ))}
                </TabsPrimitive.List>
                <div
                    className={`${tabsTheme['u-controls-tabs-header-item-active-indicator']}${sizeCfg.indicator || ''} ${ready ? 'web:transition-all web:duration-300 web:ease-out' : ''}`}
                    style={{ left: `${indicatorStyle.left}px`, width: `${indicatorStyle.width}px` }}
                />
            </div>

            {tabs.map((tab) => (
                <TabsPrimitive.Content
                    className={`${tabsTheme['u-controls-tabs-tab-content']} ${tabsTheme['u-controls-tabs-tab-content-animated']} ${contentClassName}`}
                    key={tab.key}
                    value={tab.key}
                >
                    {tab.content}
                </TabsPrimitive.Content>
            ))}
        </TabsPrimitive.Root>
    );
}