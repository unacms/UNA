
import { View } from 'app/design/view'
import { appSetting, menuItemsByName } from 'app/lib/util';
import {componentsMap} from './menu-items/_map';
import { useCurrentUser } from 'app/context/user'

export default function ElementMenu(oProps) {
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

    //--- use iconset if available
    let iconset = {...appSetting('menu_items', 'iconset'), ...appSetting('menu_items', oProps.object, 'iconset')};

    if(!!iconset)
        oProps.params.iconset = iconset;

    if (!oProps?.items?.length)
        return [];

    const sItemsSrc = bAutoFilter ? menuItemsByName(oProps.object, oProps.items, currentUser) : oProps.items;
    const sItems = sItemsSrc.map((aItem, iKey) => {
        if(bShowMatched && aItem.display_type != sDisplayType)
            return;

        if(sShowSelected !== false && ((aItem.display_type == undefined && sShowSelected != 'undefined') || (aItem.display_type != undefined && aItem.display_type != sShowSelected)))
            return;

        if(!(aItem.id || aItem.name) || aExcept.includes(aItem.name) || aExceptTitle.includes(aItem.title))
            return;

        const sDisplayTypeItem = aItem.display_type ? aItem.display_type : sDisplayType;
        if(!componentsMap[sDisplayTypeItem])
            return;

        const ItemType = componentsMap[sDisplayTypeItem];
        return (
            <View key={'menu' +  iKey} className={(bShowVertical) ? 'w-full  ' : ' ' + (sAlignItems == 'stretch' ? 'flex-auto' : '')}>
                <ItemType key={aItem.id ? aItem.id : aItem.name} {...aItem} params={oProps.params} />
            </View>
        );
    });

    if(bShowContent)
        return sItems;

    const oMenu = (
        <View className={sClassName}>{oProps.unitType}{sItems}</View>
    );

    if (bShowVertical){
        return oMenu;
    }
    
    return (
        oMenu
    );
}
