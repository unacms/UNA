
import { View, ScrollView } from 'app/design/view'
import React, { useState, useEffect, useRef, useCallback} from "react";
import DropdownPopup from 'app/ui/atoms/dropdown-popup'

export default function DynamicMenu({ MenuItem, MenuItemEx, ButtonEx, containerClasses, items, menuClasses, menuExClasses, isButtonOutside }) {

    const itemRefs = useRef([]);
    const [visibleItemsCount, setVisibleItemsCount] = useState(0);
    const [width, setWidth] = useState(0);
    const [ntfsOpen, setNtfsOpen] = useState(false);
    //console.log("menuWidth", width, items[0])
    useEffect(() => {
        const menuWidth = width;
        let visibleWidth = 0;
        let visibleCount = 0;
        for (let i = 0; i < itemRefs.current.length; i++) {
            const itemWidth = itemRefs.current[i].offsetWidth;
            if (!itemRefs.current[i].className.includes('hidden')) {
                if (visibleWidth + itemWidth > menuWidth) break;
                console.log("visibleWidth"+ items[0].key, visibleWidth, i, menuWidth)
                visibleWidth += itemWidth;
                visibleCount++;
            }
            else{
                visibleCount++;
            }
        }
        if (visibleCount != visibleItemsCount) {
            setVisibleItemsCount(visibleCount);
        }
    }, [width]);

    const handleLayout = useCallback((event) => {
        setWidth(event.nativeEvent.layout.width - 60);
    }, []);
    
    let ExMenu = visibleItemsCount < items.length && (
        <DropdownPopup open={ntfsOpen} size="small" onOpenChange={(bOpen) => { setNtfsOpen(bOpen) }} >
            {[
                <ButtonEx/>,
                <View key='view' className={menuExClasses} >
                    {items.slice(visibleItemsCount).map((aItem, iKey) => {
                        return <MenuItemEx item={aItem} index={iKey}  />
                    })}
                </View>
            ]}
        </DropdownPopup>
    )

    return (
        <>
            <ScrollView horizontal={true} className={containerClasses+" "} onLayout={handleLayout}>
                <View className={menuClasses} >
                    {
                        items.map((aItem, iKey) => {
                            return <MenuItem item={aItem} itemRefs={itemRefs} index={iKey} visibleItemsCount={visibleItemsCount}/>
                        })
                    }
                </View>
                {!isButtonOutside && ExMenu}
            </ScrollView>
            {isButtonOutside && ExMenu}
        </>
    );
}