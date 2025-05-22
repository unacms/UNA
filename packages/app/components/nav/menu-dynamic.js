import { View, ScrollView, ViewRef } from 'app/design/view'
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from 'react-native'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useWindowDimensions } from 'react-native'
import { LAYOUT_BREAKPOINTS } from 'app/lib/util'
import FormModal, { handleFormModal } from 'app/ui/molecules/form_modal';

export default function DynamicMenu({ name, isFixedCount, MenuItem, MenuItemEx, ButtonEx, containerClasses, items, menuClasses, menuExClasses, isButtonOutside, offsetWidth = 50, persistent = 0 }) {

    const isWeb = Platform.OS == 'web'
    const itemRefs = useRef([]);
    const itemRefsMore = useRef();
    const [visibleItemsCount, setVisibleItemsCount] = useState(isFixedCount ? persistent : items.length);
    const [width, setWidth] = useState(0);
    const [pageData, setPageData] = useState(false);
    const { width: windowWidth } = useWindowDimensions();
    const isDynamicMenu = true;//windowWidth > LAYOUT_BREAKPOINTS.sm;

    useEffect(() => {
        if (!isFixedCount && itemRefs.current.length> 0) {
            const menuWidth = width;
            let visibleWidth = offsetWidth + (itemRefsMore?.current ? itemRefsMore?.current?.offsetWidth : 0);
            let visibleCount = 0;
            for (let i = 0; i < itemRefs.current.length; i++) {
                const itemWidth = itemRefs.current[i] ? itemRefs.current[i].offsetWidth : 80;
                if (!itemRefs?.current[i]?.className?.includes('hidden')) {
                    if (visibleWidth + itemWidth > menuWidth) break;
                    visibleWidth += itemWidth;
                    visibleCount++;
                }
                else {
                    visibleCount++;
                }
            }
            if (visibleCount > persistent && persistent > 0)
                visibleCount = persistent;

            if (visibleCount != visibleItemsCount && visibleCount>0) {
                setVisibleItemsCount(visibleCount);
            }


        }
    }, [width, itemRefs]);

    const handleLayout = useCallback((event) => {
        if (isFixedCount)
            return
      
        if (isDynamicMenu){
           setWidth(event.nativeEvent.layout.width)
        }
                
        else
            setVisibleItemsCount(itemRefs.current.length)

    }, [isDynamicMenu]);

    let ExMenu = (visibleItemsCount < items.length && isWeb) && (
        <DropdownMenu
            onSelect={(oItem, event) => {
                if (oItem.noAction) {
                    handleFormModal(oItem, event, setPageData)
                }
            }}
            variant='nopad'
            items={items.slice(visibleItemsCount).map((aItem, iKey) => ({
                id: 'menu-' + iKey,
                link: aItem.link,
                noAction: aItem.noAction,
                title: <MenuItemEx key={name + 'menuex' + iKey} item={aItem} index={iKey + visibleItemsCount} />,
                indicator: aItem.addon,
            }))
            }
        >
            <ButtonEx visibleItemsCount={visibleItemsCount} />
        </DropdownMenu>
    )

    return (
        <>
            <FormModal pageData={pageData} setPageData={setPageData} />
            <ScrollView contentContainerStyle={{ alignItems: 'center' }} className={isWeb ? containerClasses : ""} horizontal={true} onLayout={handleLayout}>
                <View className={menuClasses} >
                    {
                        items.map((aItem, iKey) => {
                            return <ViewRef className={(iKey > visibleItemsCount - 1 ? ' item-overlap ' : '')} ref={el => (itemRefs?.current ? (itemRefs.current[iKey] = el) : (el = null))} ><MenuItem key={name + 'menu' + iKey} item={{ ...aItem, onPress: (event) => handleFormModal(aItem, event, setPageData) }}  visibleItemsCount={visibleItemsCount} /></ViewRef>
                        })
                    }
                </View>
                {!isButtonOutside && ExMenu}
            </ScrollView>
            {isButtonOutside && ExMenu}
        </>
    );
}