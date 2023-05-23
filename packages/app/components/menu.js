
import Link from './menu-items/link';
import Button from './menu-items/button';
import Element from './menu-items/element';

import { View } from 'app/design/view'
import { appSetting, menuItemsByName } from 'app/lib/util';

const oComponentsMap = {
    link: Link,
    button: Button,
    element: Element
};

export default function ElementMenu(oProps) {

    /*
     * Display type specified in menu can be overwritten with display type specified in item.
     * default display types: mixed, link, button, element, etc.
     */
    const sDisplayType = oProps.displayType ? oProps.displayType : 'link';

    //--- show only items which match with menu's display_type
    const bShowMatched = oProps?.showMatched === 'true';

    //--- show only items with selected display_type and doesn't take in account the menu's display_type
    const sShowSelected = oProps?.showSelected || false;

    //--- except the following items from output
    const aExcept = oProps?.except || [''];
    const aExceptTitle = oProps?.except_title || ['BxTemplView', 'BxTemplFavorite', 'BxTemplFeature', 'BxTemplReport', 'BxTimelineModule'];

    let sClassName = oProps?.params && oProps.params?.className || 'bx-menu ';

    //--- show menu as verstical
    const bShowVertical = oProps?.params && oProps.params?.showVertical === true;

    sClassName += bShowVertical ? 'flex-col items-center web:gap-y-2 ' : 'flex-row gap-x-2 ';

    //--- horizontal menu items alignment
    const sAlignItems = oProps?.alignItems ? oProps?.alignItems : (oProps?.params && oProps.params?.align_items ? oProps.params.align_items : 'left');
    switch(sAlignItems) {
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

    if (!oProps?.items?.length)
        return [];

    const sItems = menuItemsByName(oProps.object, oProps.items).map((aItem, iKey) => {
        if(bShowMatched && aItem.display_type != sDisplayType)
            return;

        if(sShowSelected !== false && ((aItem.display_type == undefined && sShowSelected != 'undefined') || (aItem.display_type != undefined && aItem.display_type != sShowSelected)))
            return;

        if(!(aItem.id || aItem.name) || aExcept.includes(aItem.name) || aExceptTitle.includes(aItem.title))
            return;

        const sDisplayTypeItem = aItem.display_type ? aItem.display_type : sDisplayType;
        if(!oComponentsMap[sDisplayTypeItem])
            return;

        const ItemType = oComponentsMap[sDisplayTypeItem];
        return <View key={'menu' +  iKey} className={(bShowVertical) ? 'w-full items-center ios:mb-2 android:mb-2' : ' ' + (sAlignItems == 'stretch' ? 'flex-auto' : '')}><ItemType key={aItem.id ? aItem.id : aItem.name} {...aItem} params={oProps.params} /></View>;
    });

    if(bShowContent)
        return sItems;

    return (
        <View className={sClassName}>{sItems}</View>
    );
}
