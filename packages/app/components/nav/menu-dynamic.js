import { View } from 'app/design/view';
import { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from 'react-native'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useOpenModalByUrl } from 'app/context/jotai/modal';
import { useIsDesktop } from 'app/context/measure';
import { useBottomSheetData } from 'app/context/bottomsheet';
import emitter, { EVENTS } from 'app/context/emitter';
import { cn } from 'app/lib/util'

const isWeb = Platform.OS == 'web'

function getFixedVisibleCount(persistent, allowZeroPersistant, isDesktop) {
    return Math.min(
        persistent,
        allowZeroPersistant ? 0 : (isDesktop ? persistent : 1)
    );
}

/**
 * `triggerClassName` / `triggerAccessibilityLabel` go to the overflow menu's
 * trigger (the Pressable around `ButtonEx`): its accessible name, and the
 * `u-neo-btn-link hit-area-*` host classes for a passive NeoButton inside.
 */
export default function DynamicMenu({ name, isFixedCount, MenuItem, MenuItemEx, ButtonEx, allowZeroPersistant = false, items, menuClasses, menuExClasses, isButtonOutside, offsetWidth = 50, persistent = 0, triggerClassName, triggerAccessibilityLabel }) {
    const isDesktop = useIsDesktop();
    const { setBottomSheetData } = useBottomSheetData();
    const openModalByUrl = useOpenModalByUrl();
    
    const itemRefs = useRef([]);
    const itemRefsMore = useRef();
    // `allowZeroPersistant` wins on every viewport so a "more" menu paired with a
    // sibling that renders the persistent buttons can collapse fully (0 inline).
    // Otherwise desktop shows the full persistent count inline and mobile caps at 1.
    const [visibleItemsCount, setVisibleItemsCount] = useState(
        isFixedCount ? getFixedVisibleCount(persistent, allowZeroPersistant, isDesktop) : items.length
    );
    useEffect(() => {
        if (isFixedCount) {
            setVisibleItemsCount(getFixedVisibleCount(persistent, allowZeroPersistant, isDesktop));
        }
    }, [isFixedCount, persistent, allowZeroPersistant, isDesktop]);

    const [width, setWidth] = useState(0);
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

    // Overflow items render MenuItemEx as `title` (React node), so DropdownMenuItem
    // skips the outer handleSelect that normally closes the native bottomsheet.
    // Close it explicitly from the press paths that actually fire.
    const dismissOverflowMenu = useCallback(() => {
        emitter.emit(EVENTS.dynamicMenu, { action: 'hide' });
        if (!isWeb) {
            setBottomSheetData(false);
        }
    }, [setBottomSheetData]);

    const ExMenu = (visibleItemsCount < items.length) && (
        <DropdownMenu
            onSelect={(oItem) => {
                dismissOverflowMenu();
                if (oItem.noAction) {
                    openModalByUrl(oItem.link);
                }
            }}
            mode={isWeb ? "popup" : ""}
            variant='nopad'
            triggerClassName={triggerClassName}
            triggerAccessibilityLabel={triggerAccessibilityLabel}
            items={items.slice(visibleItemsCount).map((aItem, iKey) => ({
                id: 'menu-' + iKey,
                link: aItem.link,
                noAction: aItem.noAction,
                title: (
                    <MenuItemEx
                        key={name + 'menuex' + iKey}
                        item={{
                            ...aItem,
                            onPress: (event) => {
                                dismissOverflowMenu();
                                if (aItem.noAction) {
                                    openModalByUrl(aItem.link);
                                    return;
                                }
                                if (aItem.params?.onclick) {
                                    aItem.params.onclick(event, aItem);
                                }
                            },
                        }}
                        index={iKey + visibleItemsCount}
                    />
                ),
                indicator: aItem.addon,
            }))
            }
        >
            <ButtonEx visibleItemsCount={visibleItemsCount} />
        </DropdownMenu>
    )



    return (
        <>
            <View
               
                className="flex-row items-center gap-2"
                horizontal={true}
                onLayout={handleLayout}
            >
                <View className={menuClasses} >
                    {

                        items.map((aItem, iKey) => {
                            return <View
                                key={name + 'menu' + iKey}
                                className={cn(
                                    iKey > visibleItemsCount - 1 && 'item-overlap',
                                    aItem?.item?.settings?.class
                                )}
                                ref={el => (itemRefs?.current ? (itemRefs.current[iKey] = el) : (el = null))} >
                                <MenuItem item={{ ...aItem, onPress: () => openModalByUrl(aItem.link) }} visibleItemsCount={visibleItemsCount} />
                            </View>
                        })
                    }
                </View>
                {!isButtonOutside && ExMenu}
            </View>
            {isButtonOutside && ExMenu}
        </>
    );
}