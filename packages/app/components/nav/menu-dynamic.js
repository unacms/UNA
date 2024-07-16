import { View, ScrollView } from 'app/design/view'
import React, { useState, useEffect, useRef, useCallback} from "react";
import { Platform } from 'react-native' 
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
   
export default function DynamicMenu({ name, MenuItem, MenuItemEx, ButtonEx, containerClasses, items, menuClasses, menuExClasses, isButtonOutside, offsetWidth=50, persistent = 0 }) {

    const isWeb = Platform.OS == 'web'
    const itemRefs = useRef([]);
    const itemRefsMore = useRef();
    const [visibleItemsCount, setVisibleItemsCount] = useState(0);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const menuWidth = width;
        let visibleWidth = offsetWidth + (itemRefsMore?.current ? itemRefsMore?.current?.offsetWidth : 0);
        let visibleCount = 0;
        for (let i = 0; i < itemRefs.current.length; i++) {
            const itemWidth = itemRefs.current[i].offsetWidth;
            if (!itemRefs?.current[i].className?.includes('hidden')) {
                if (visibleWidth + itemWidth > menuWidth) break;
                visibleWidth += itemWidth;
                visibleCount++;
            }
            else{
                visibleCount++;
            }
        }
        if (visibleCount > persistent && persistent > 0)
            visibleCount = persistent;
        if (visibleCount != visibleItemsCount) {
            setVisibleItemsCount(visibleCount);
        }
    }, [width]);

    const handleLayout = useCallback((event) => {
        setWidth(event.nativeEvent.layout.width );
    }, []);

    let ExMenu = (visibleItemsCount < items.length && isWeb) && (
        <DropdownMenu 
            variant = 'nopad'
            items={items.slice(visibleItemsCount).map((aItem, iKey) => ({
            id: 'menu-' + iKey,
            link: aItem.link,
            title: <MenuItemEx  key={name +'menuex'+ iKey} item={aItem} index={iKey+visibleItemsCount}  />,
            indicator: aItem.addon,
            onClick: () => console.log('TODO'),
        }))
        }
        >
            <ButtonEx visibleItemsCount={visibleItemsCount} />
        </DropdownMenu>
    )

    return (
        <>
            <ScrollView contentContainerStyle={{alignItems: 'center'}} className={isWeb ? containerClasses : ""} horizontal={true}  onLayout={handleLayout}>
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