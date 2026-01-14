import { View, ScrollView, ViewRef, Row } from 'app/design/view'
import { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from 'react-native'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import FormModal, { handleFormModal } from 'app/ui/molecules/form_modal';
import { useIsDesktop } from 'app/context/measure';

export default function DynamicMenu({ name, isFixedCount, MenuItem, MenuItemEx, ButtonEx, containerClasses, items, menuClasses, menuExClasses, isButtonOutside, offsetWidth = 50, persistent = 0 }) {
    const isDesktop = useIsDesktop();
    const isWeb = Platform.OS == 'web'
    const itemRefs = useRef([]);
    const itemRefsMore = useRef();
    const [visibleItemsCount, setVisibleItemsCount] = useState(isFixedCount ? isDesktop ? persistent : 1 : items.length);
    const [width, setWidth] = useState(0);
    const [pageData, setPageData] = useState(false);
    const isDynamicMenu = true;//windowWidth > LAYOUT_BREAKPOINTS.sm;

    useEffect(() => {
        if (!isFixedCount && itemRefs.current.length > 0) {
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

            if (visibleCount != visibleItemsCount && visibleCount > 0) {
                setVisibleItemsCount(visibleCount);
            }


        }
    }, [width, itemRefs]);

    const handleLayout = useCallback((event) => {
        if (isFixedCount)
            return

        if (isDynamicMenu) {
            setWidth(event.nativeEvent.layout.width)
        }

        else
            setVisibleItemsCount(itemRefs.current.length)

    }, [isDynamicMenu]);

    const ExMenu = (visibleItemsCount < items.length) && (
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

    // return <View className='bg-red-500 h-4 w-4'></View>

    const Container = isWeb ? Row : ScrollView;

    return (
        <>
            <FormModal pageData={pageData} setPageData={setPageData} />
            <Container
                contentContainerStyle={{ alignItems: 'center' }}
                className={isWeb ? (containerClasses ? containerClasses.trim() + ' overflow-visible gap-x-2' : 'overflow-visible gap-x-2') : (containerClasses ? containerClasses.trim() + ' overflow-visible gap-x-2' : 'overflow-visible gap-x-2')}
                horizontal={true}
                onLayout={handleLayout}
            >
                <View className={menuClasses} >
                    {

                        items.map((aItem, iKey) => {
                            return <View key={name + 'menu' + iKey} className={`${iKey > visibleItemsCount - 1 && ' item-overlap '} ${aItem?.item?.settings?.class}`} ref={el => (itemRefs?.current ? (itemRefs.current[iKey] = el) : (el = null))} ><MenuItem item={{ ...aItem, onPress: (event) => handleFormModal(aItem, event, setPageData) }} visibleItemsCount={visibleItemsCount} /></View>
                        })
                    }
                </View>
                {!isButtonOutside && ExMenu}
            </Container>
            {isButtonOutside && ExMenu}
        </>
    );
}