
import Link from './menu-items/link';
import Button from './menu-items/button';
import Element from './menu-items/element';

import { View } from 'app/design/view'

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
    const aExcept = oProps?.except || [];

    //--- show menu as verstical
    const bShowVertical = oProps?.params && oProps.params?.showVertical === true;

    //--- show menu's content only
    const bShowContent = oProps?.params && oProps.params?.showContent === 'true';   

    const sItems = Object.keys(oProps.items).map(function(iKey) {
        const aItem = oProps.items[iKey];

        if(bShowMatched && aItem.display_type != sDisplayType)
            return;

        if(sShowSelected !== false && ((aItem.display_type == undefined && sShowSelected != 'undefined') || (aItem.display_type != undefined && aItem.display_type != sShowSelected)))
            return;

        if(!(aItem.id || aItem.name) || aExcept.includes(aItem.name))
            return;

        const sDisplayTypeItem = aItem.display_type ? aItem.display_type : sDisplayType;
        if(!oComponentsMap[sDisplayTypeItem])
            return;

        const ItemType = oComponentsMap[sDisplayTypeItem];
        return <View key={'menu' +  iKey} className={(bShowVertical) ? 'w-full items-center' : 'flex-auto'}><ItemType key={aItem.id ? aItem.id : aItem.name} {...aItem} params={oProps.params} /></View>;
    });

    if(bShowContent)
        return (
            <View>
                {sItems}
            </View>
        );

    const sClassName = oProps?.params && oProps.params?.className || 'bx-menu flex ' + (bShowVertical ? 'flex-col items-center gap-2' : 'w-full flex-row justify-start items-center');

    return (
        <View className={sClassName}>{sItems}</View>
    );
}
