
import { View, ScrollView, Row } from 'app/design/view'
import { appSetting, menuItemsByName } from 'app/lib/util';
import { componentsMap } from './menu-items/_map';
import { useCurrentUser } from 'app/context/user'
import React, { useCallback, useState, useEffect, useRef, useMemo, useContext, memo } from "react";
import { Button } from 'app/design/controls';
import DynamicMenu from 'app/components/nav/menu-dynamic';
import { Platform } from 'react-native' 
export default function ElementMenu(oProps) {
    const isWeb = Platform.OS == 'web'
    const { currentUser, setCurrentUser } = useCurrentUser();
    /*
     * Display type specified in menu can be overwritten with display type specified in item.
     * default display types: mixed, link, button, element, etc.
     */
    const sDisplayType = oProps.displayType ? oProps.displayType : 'link';

    //--- auto-filter items using app settings.
    const bAutoFilter = oProps?.autoFilter == undefined || oProps.autoFilter === 'true';

    //--- show only items which match with menu's display_type
    const bShowMatched = oProps?.showMatched === true;

    const bAutoSize = oProps?.autoSize ? oProps?.autoSize : false;

    //--- show only items with selected display_type and doesn't take in account the menu's display_type
    const sShowSelected = oProps?.showSelected || false;

    //--- except the following items from output
    const aExcept = oProps?.except || [''];
    const aExceptTitle = oProps?.except_title || ['BxTemplView', 'BxTemplFavorite', 'BxTemplFeature', 'BxTemplReport', 'BxTimelineModule'];

    let sClassName = oProps?.params && oProps.params?.className || 'bx-menu ';

    //--- show vertical
    const bShowVertical = oProps?.params && oProps.params?.showVertical === true;

    sClassName += bShowVertical ? ' flex-col items-center gap-y-3 w-full ' : ' flex-row items-center gap-x-2 ';

    //--- horizontal menu items alignment
    const sAlignItems = oProps?.alignItems ? oProps?.alignItems : (oProps?.params && oProps.params?.align_items ? oProps.params.align_items : 'left');
    switch (sAlignItems) {
        case 'left':
            sClassName += ' justify-start';
            break;

        case 'center':
            sClassName += ' justify-center';
            break;

        case 'right':
            sClassName += ' justify-end';
            break;
    }

    //--- show menu's content only
    const bShowContent = oProps?.params && oProps.params?.showContent === 'true';

    //--- use iconset if available
    let iconset = { ...appSetting('menu_items', 'iconset'), ...appSetting('menu_items', oProps.object, 'iconset') };

    if (!!iconset)
        oProps.params.iconset = iconset;

    if (!oProps?.items?.length)
        return [];

    const sItemsSrc = bAutoFilter ? menuItemsByName(oProps.object, oProps.items, currentUser) : oProps.items;
    const filteredItems = sItemsSrc.filter((aItem) => {
        // Check if item should be shown based on `bShowMatched` and `sDisplayType`
        if (bShowMatched && aItem.display_type !== sDisplayType) {
            return false;
        }

        // Check if item should be shown based on `sShowSelected`
        if (sShowSelected !== false && ((aItem.display_type === undefined && sShowSelected !== 'undefined') || (aItem.display_type !== undefined && aItem.display_type !== sShowSelected))) {
            return false;
        }

        // Ensure the item has an id or name, and is not in the except lists
        if (!(aItem.id || aItem.name) || aExcept.includes(aItem.name) || aExceptTitle.includes(aItem.title)) {
            return false;
        }

        // Check if the `display_type` of the item is supported by `componentsMap`
        const sDisplayTypeItem = aItem.display_type ? aItem.display_type : sDisplayType;
        if (!componentsMap[sDisplayTypeItem]) {
            return false;
        }

        // If all checks pass, the item should be included in the filtered list
        return true;
    });

    
    let isUseStaticWidth = bShowContent || !bAutoSize || !isWeb;
    if (oProps.persistent > 0){
        isUseStaticWidth = false;
    }
    if (!isWeb){
      //  isUseStaticWidth = true;
    }

    if (isUseStaticWidth){
        const sItems = filteredItems.map((item, index) => {
            const ItemType = componentsMap[item.display_type ? item.display_type : sDisplayType];
            return (
                <View key={'menu' + index} className={(bShowVertical) ? 'w-full  ' : ' ' + (sAlignItems == 'stretch' ? 'flex-auto' : '')}>
                    <ItemType key={item.id ? item.id : item.name} {...item} params={oProps.params} />
                </View>
            )
        });

        if (bShowContent)
        return sItems;

        if (!bAutoSize) {
            return <View className={sClassName}>{sItems}</View>;
        }
    }

    const MenuItem = memo(({ item, itemRefs, index, visibleItemsCount }) => {
        const ItemType = componentsMap[item.display_type ? item.display_type : sDisplayType];
        return (
            <View ref={el => itemRefs.current[index] = el} key={'menu' + index} className={(!isWeb ? ' ml-2': ' ') + (bShowVertical ? 'w-full  ' : ' ') + (sAlignItems == 'stretch' ? 'flex-auto' : '') + ((index > visibleItemsCount - 1 && !isUseStaticWidth) ? ' item-overlap ' : '')}>
                <ItemType key={item.id ? item.id : item.name} {...item} params={oProps.params} />
            </View>
        )
    });

    const MenuItemEx = memo(({ item, index }) => {
        const ItemType = componentsMap[item.display_type ? item.display_type : sDisplayType];
        let modifiedParams = { ...oProps.params, button_variant: 'none', button_size: 'sm'};
        return (
            <ItemType key={item.id ? item.id : item.name} {...item} params={modifiedParams} />
        )
    });

    const ButtonEx = memo(() => {
        return <View key="btn" className='ml-2'><Button size={oProps.params.button_size} variant="default" startDecorator="DotsThreeOutline" /></View>;
    });
    
    return <DynamicMenu 
        name = "menu"
        ButtonEx={ButtonEx} 
        MenuItemEx={MenuItemEx}
        persistent={oProps.persistent} 
        MenuItem={MenuItem} 
        containerClasses = "justify-center md:justify-start lg:justify-end w-full"
        items={filteredItems} 
        menuClasses={sClassName} 
        isButtonOutside = {false}
        menuExClasses ="mr-auto ml-3 sm:ml-4 items-end gap-y-2"
        />
}
