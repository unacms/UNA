
import { View, ViewRef } from 'app/design/view'
import { appSetting, menuItemsByName } from 'app/lib/util';
import { componentsMap } from './menu-items/_map';
import { useCurrentUser } from 'app/context/user'
import { useMemo, memo } from "react";
import { Button } from 'app/design/controls';
import DynamicMenu from 'app/components/nav/menu-dynamic';
import { Platform } from 'react-native'

const ButtonEx = memo(({ visibleItemsCount, params }) => {
    return (
        <View key="btn" className="ml-2">
            <Button size={params.button_size}  variant="secondary" startDecorator="Ellipsis" />
        </View>
    );
});

const MenuItemEx = memo(({ item, index, sDisplayType, params }) => {
    const ItemType = componentsMap[item.display_type ? item.display_type : sDisplayType];
    return (
        <ItemType key={item.id ? item.id : item.name} {...item} params={{ ...params, button_variant: 'none', button_size: 'sm' }} />
    )
});


const MenuItem = memo(({ item, itemRefs, index, visibleItemsCount, params, bShowVertical, sAlignItems, isUseStaticWidth, isWeb, sDisplayType }) => {
    const ItemType = componentsMap[item.display_type ? item.display_type : sDisplayType];
    return (
        <ViewRef ref={el => itemRefs.current[index] = el} key={'menu' + index} className={(!isWeb ? ' ml-2' : ' ') + (bShowVertical ? 'w-full  ' : ' ') + (sAlignItems == 'stretch' ? 'flex-auto' : '') + (((index > visibleItemsCount - 1) && !isUseStaticWidth) ? ' item-overlap ' : '')}>
            <ItemType key={item.id ? item.id : item.name} {...item} params={params} />
        </ViewRef>
    )
});


export default function ElementMenu(oProps) {
    const isWeb = Platform.OS == 'web'
    const { currentUser, setCurrentUser } = useCurrentUser();
    /*
     * Display type specified in menu can be overwritten with display type specified in item.
     * default display types: mixed, link, button, element, etc.
     */
    const sDisplayType = oProps.displayType || 'secondary';

    //--- auto-filter items using app settings.
    const bAutoFilter = oProps?.autoFilter !== 'false';

    //--- show only items which match with menu's display_type
    const bShowMatched = oProps?.showMatched === true;

    const bAutoSize = oProps?.autoSize ||  false;

    //--- show only items with selected display_type and doesn't take in account the menu's display_type
    const sShowSelected = oProps?.showSelected || false;

    //--- except the following items from output
    const aExcept = oProps?.except || [''];
    const aExceptTitle = oProps?.except_title || ['BxTemplView', 'BxTemplFavorite', 'BxTemplFeature', 'BxTemplReport', 'BxTimelineModule'];

    let sClassName = oProps?.params?.className || 'bx-menu ';

    //--- show vertical
    const bShowVertical = oProps?.params?.showVertical === true;

    sClassName += bShowVertical ? ' flex-col items-center gap-y-2 w-full ' : ' flex-row ';
    const oParams = oProps?.params || {};

  


    //--- horizontal menu items alignment
    const sAlignItems = oProps.alignItems || oParams.align_items || 'left';
    sClassName += ` justify-${sAlignItems}`;

    //--- show menu's content only
    const bShowContent = oParams.showContent === 'true';

    //--- use iconset if available
    let iconset = { ...appSetting('menu_items', 'iconset'), ...appSetting('menu_items', oProps.object, 'iconset') };
    if (iconset) oParams.iconset = iconset;

    if (!oProps?.items?.length)
        return [];

    // sort by primary
    oProps.items.sort((a, b) => {
        const primaryA = a.primary === true || a.primary === 1;
        const primaryB = b.primary === true || b.primary === 1;
        return primaryB - primaryA;
    })
    const filteredItems = useMemo(() => {
        return (bAutoFilter ? menuItemsByName(oProps.object, oProps.items, currentUser) : oProps.items).filter((aItem) => {
            // Check if item should be shown based on `bShowMatched` and `sDisplayType`
            if (bShowMatched && aItem.display_type !== sDisplayType) {
                return false;
            }

            // Check if item should be shown based on `sShowSelected`
            if (
                sShowSelected !== false &&
                ((aItem.display_type === undefined && sShowSelected !== 'undefined') ||
                    (aItem.display_type !== undefined && aItem.display_type !== sShowSelected))
            ) {
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
    }, [bAutoFilter, oProps.object, oProps.items, currentUser, bShowMatched, sDisplayType, sShowSelected, aExcept, aExceptTitle, componentsMap]);

    let isUseStaticWidth = bShowContent || !bAutoSize || !isWeb;
    if (oProps.persistent > 0) {
        isUseStaticWidth = false;
    }
    if (!isWeb) {
        isUseStaticWidth = true;
    }

    if (isUseStaticWidth) {
        const sItems = filteredItems.map((item, index) => {
            const ItemType = componentsMap[item.display_type || sDisplayType];
            

            const a = <ItemType key={item.id ? item.id : item.name} {...item} params={oProps.params} />
            if (a == null ) return null;

            return (
                <View  key={`menu${index}`} className={` ${
                    bShowVertical
                      ? 'w-full  '
                      : oProps?.params?.button_full_width === true
                      ? ' flex-1 '
                      : ' '
                  } ${sAlignItems === 'stretch' ? 'flex-auto' : ''}  `}>
                    {a}
                </View>
            )
        });

        if (bShowContent)
            return sItems;

        if (!bAutoSize) {
            return <View className={`${sClassName}`}>{sItems}</View>;
        }
    }



    return <DynamicMenu
        name="menu"
        ButtonEx={({ visibleItemsCount }) => <ButtonEx visibleItemsCount={visibleItemsCount} params={oProps.params} />}
        MenuItemEx={({ item, index }) => <MenuItemEx item={item} index={index} sDisplayType={sDisplayType} params={oProps.params} />}
        MenuItem={({ item, itemRefs, visibleItemsCount, index }) => {

            return <MenuItem item={item} index={index} visibleItemsCount={visibleItemsCount}
                bShowVertical={bShowVertical}
                isWeb={isWeb}
                itemRefs={itemRefs}
                sAlignItems={sAlignItems}
                isUseStaticWidth={isUseStaticWidth}
                sDisplayType={sDisplayType} params={oProps.params} />
        }}
        isFixedCount={oProps?.params?.isFixedCount}
        persistent={oProps.persistent}
        containerClasses= {oProps.containerClasses || "w-full md:justify-end"}
        items={filteredItems}
        menuClasses={sClassName}
        isButtonOutside={false}
        menuExClasses="mr-auto ml-3 sm:ml-4 items-end gap-y-2"
    />
}
