import { View, ViewRef, Pressable } from 'app/design/view'
import { appSetting, menuItemsByName } from 'app/lib/util';
import { getComponent } from 'app/components/registry';
import { useCurrentUser } from 'app/context/user'
import { useMemo, useState, memo } from "react";
import { Button, NeoButton } from 'app/design/controls';
import DynamicMenu from 'app/components/nav/menu-dynamic';
import { Platform } from 'react-native'
import FormModal, { handleFormModal } from 'app/ui/molecules/form_modal';

const ButtonEx = memo(({ visibleItemsCount, params }) => {
    return (
        <View key="btn" className="">
            {params.button_style ? (
                <NeoButton
                    image="Ellipsis"
                    style={params.button_style}
                    controlSize={params.button_size}
                    borderShape={params.button_border_shape}
                />
            ) : (
                <Button
                    size={params.button_size}
                    variant={params.button_variant || 'default'}
                    startDecorator="Ellipsis"
                    rounded={params.button_rounded}
                />
            )}
        </View>
    );
});

const MenuItemEx = memo(({ item, index, sDisplayType, params }) => {
    const ItemType =  getComponent('menu-item', String(item.display_type ? item.display_type : sDisplayType));
    const newButtonVariant = params?.button_variant === 'none' ? '' : params?.button_variant;
    return (
        <ItemType mode="dropdown-menu" key={item.id ? item.id : item.name} {...item} params={{ ...params, button_variant: newButtonVariant, button_size: 'sm' }} />
    )
});


const MenuItem = memo(({ item, itemRefs, index, visibleItemsCount, params, bShowVertical, sAlignItems, isUseStaticWidth, isWeb, sDisplayType }) => {
    const ItemType = getComponent('menu-item', String(item.display_type ? item.display_type : sDisplayType));

    const isLastVisible = typeof visibleItemsCount === 'number' ? index >= (visibleItemsCount - 1) : false;
    let spacingClass = '';
    if (bShowVertical) {
        spacingClass = 'w-full  ';
    } else if (params?.button_full_width === true) {
        spacingClass = ' flex-1 ';
    } else {
        spacingClass = isLastVisible ? ' ' : 'mt-0';
    }

    return (
        <View className={` ${spacingClass} ${sAlignItems == 'stretch' ? 'flex-auto' : ''} `}>
            <ItemType key={item.id ? item.id : item.name} {...item} params={params} />
        </View>
    )
});


export default function ElementMenu(oProps) {
    const isWeb = Platform.OS == 'web'
    const [pageData, setPageData] = useState(false);
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

    const bAutoSize = oProps?.autoSize || false;

    //--- show only items with selected display_type and doesn't take in account the menu's display_type
    const sShowSelected = oProps?.showSelected || false;

    //--- except the following items from output
    const aExcept = oProps?.except || [''];
    const aExceptTitle = oProps?.except_title || ['BxTemplView', 'BxTemplFavorite', 'BxTemplFeature', 'BxTemplReport', 'BxTimelineModule'];

    let sClassName = oProps?.params?.className || 'bx-menu ';

    //--- show vertical
    const bShowVertical = oProps?.params?.showVertical === true;

    sClassName += bShowVertical ? ' flex-col items-center gap-y-2 w-full ' : ' flex-row  ';
    const oParams = oProps?.params || {};


    //--- horizontal menu items alignment
    const sAlignItems = oProps.alignItems || oParams.justify_items || 'between';
    sClassName += `justify-${sAlignItems}`;

    if (isWeb) {
        sClassName += ' ';
    }

    //--- show menu's content only
    const bShowContent = oParams.showContent === 'true';

    //--- use iconset if available
    let iconset = { ...appSetting('menu_items', 'iconset'), ...appSetting('menu_items', oProps.object, 'iconset') };
    if (iconset) oParams.iconset = iconset;

    const sortedItems = [...(oProps.items || [])].sort((a, b) => {
        
        const pa = (a.primary === true || a.primary === 1) ? 1 : 0;
        const pb = (b.primary === true || b.primary === 1) ? 1 : 0;
        return pb - pa;
    });

    const filteredItems = useMemo(() => {
        return (bAutoFilter ? menuItemsByName(oProps.object, sortedItems, currentUser) : sortedItems).filter((aItem) => {
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
            const sDisplayTypeItem = aItem.display_type ? aItem.display_type : (aItem.link ? 'button' : sDisplayType);

            if (sDisplayTypeItem == 'button') {
                aItem.display_type='button';
            }

            if (!getComponent('menu-item', sDisplayTypeItem)) {
                return false;
            }

            // If all checks pass, the item should be included in the filtered list
            return true;
        });
    }, [bAutoFilter, oProps.object, sortedItems, currentUser, bShowMatched, sDisplayType, sShowSelected, aExcept, aExceptTitle]);

	if (!oProps.items){
	    return;
	}

    if (!oProps?.items?.length)
        return [];

    let isUseStaticWidth = bShowContent || !bAutoSize || !isWeb;

    if (oProps.persistent > 0 && !bShowVertical) {
        // isUseStaticWidth = false;
    }
    if (!isWeb) {
        isUseStaticWidth = true;
    }

    if (oProps?.params?.menu_width) {
        sClassName += ` ${oProps.params.menu_width}`;
    }

    if (isUseStaticWidth) {
        // Prepare only actually rendered items to correctly identify the last visible one
        const preparedItems = filteredItems
            .map((item, originalIndex) => {
                const ItemType = getComponent('menu-item', item.display_type || sDisplayType);
                const element = <ItemType key={item.id ? item.id : item.name} {...item} params={oProps.params} />
                return { item, element, originalIndex };
            })
            .filter(({ element }) => element != null);

        const sItems = preparedItems.map(({ item, element, originalIndex }, i) => {
            const Wrapper = item.noAction ? Pressable : View;
            const cntProps = {};
            if (item.noAction) {
                cntProps.onPress = (event) => {
                    setPageData('loading');
                    handleFormModal(item, event, setPageData);
                };
            }

            const isLast = i === preparedItems.length - 1;
            let spacingClass = '';
            if (bShowVertical) {
                spacingClass = 'w-full  ';
            } else if (oProps?.params?.button_full_width === true) {
                spacingClass = ' flex-1 ';
            } else {
                spacingClass = oProps?.params?.menu_item_spacing != null ? ` ${oProps.params.menu_item_spacing} ` : '';
            }

            return (
                <View key={`menu${originalIndex}`} className={` ${spacingClass} ${sAlignItems === 'stretch' ? 'flex-auto' : ''}  `}>
                    <Wrapper {...cntProps}>{element}</Wrapper>
                </View>
            );
        });

        if (bShowContent)
            return sItems;

        if (!bAutoSize) {
            return <>
                <FormModal pageData={pageData} setPageData={setPageData} />
                <View className={`${sClassName}`}>{sItems}</View>
            </>;
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
        allowZeroPersistant={oProps.allowZeroPersistant}
        containerClasses={oProps.containerClasses || "w-full "}
        items={filteredItems}
        menuClasses={sClassName}
        isButtonOutside={false}
        menuExClasses="mr-auto ml-3 sm:ml-4 items-end gap-y-2"
    />
}
