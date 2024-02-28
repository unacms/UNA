
import { View, ScrollView } from 'app/design/view'
import React, { useState, useEffect, useRef, useCallback} from "react";
import DropdownPopup from 'app/ui/atoms/dropdown-popup'

export default function DynamicMenu({ name, MenuItem, MenuItemEx, ButtonEx, containerClasses, items, menuClasses, menuExClasses, isButtonOutside, offsetWidth=50 }) {

    const itemRefs = useRef([]);
    const itemRefsMore = useRef();
    const [visibleItemsCount, setVisibleItemsCount] = useState(0);
    const [width, setWidth] = useState(0);
    const [ntfsOpen, setNtfsOpen] = useState(false);
    useEffect(() => {
        const menuWidth = width;
        let visibleWidth = offsetWidth + (itemRefsMore?.current ? itemRefsMore?.current?.offsetWidth : 0);
        let visibleCount = 0;
        for (let i = 0; i < itemRefs.current.length; i++) {
            const itemWidth = itemRefs.current[i].offsetWidth;
            if (!itemRefs.current[i].className.includes('hidden')) {
                if (visibleWidth + itemWidth > menuWidth) break;
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
        setWidth(event.nativeEvent.layout.width );
    }, []);
    
    let ExMenu = visibleItemsCount < items.length && (
        <DropdownPopup open={ntfsOpen} size="small" onOpenChange={(bOpen) => { setNtfsOpen(bOpen) }} >
            {[
                <View  ref={itemRefsMore} key={name + 'trigger'}><ButtonEx visibleItemsCount={visibleItemsCount} /></View>,
                <View key={name + '-view'} className={menuExClasses} >
                    {items.slice(visibleItemsCount).map((aItem, iKey) => {
                        return <MenuItemEx setNtfsOpen={setNtfsOpen} key={name +'menuex'+ iKey} item={aItem} index={iKey}  />
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
                            return <MenuItem key={name +'menu'+ iKey} item={aItem} itemRefs={itemRefs} index={iKey} visibleItemsCount={visibleItemsCount}/>
                        })
                    }
                </View>
                {!isButtonOutside && ExMenu}
            </ScrollView>
            {isButtonOutside && ExMenu}
        </>
    );
}