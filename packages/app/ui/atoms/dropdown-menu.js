import { useRef, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { isEmoji } from 'app/lib/util';
import { Text } from 'app/design/typography';
import { Pressable, View } from 'app/design/view';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Button, Modal } from 'app/design/controls'
import React, { memo } from 'react'
import Redirect from 'app/ui/atoms/redirect';
import { Icon } from 'app/ui/atoms/icon'
import { FeedbackHaptics } from 'app/lib/util';

import { 
    DropdownMenuRoot, 
    DropdownMenuContentV, 
    DropdownMenuContentH, 
    DropdownMenuTrigger, 
    DropdownMenuItemV, 
    DropdownMenuItemH, 
    DropdownMenuItemTitle,
    DropdownMenuItemIcon,
    DropdownMenuItemNoPad
} from 'app/design/dropdown';




const Menu = memo(({ items, onSelect, setBottomSheetData}) => {

    const onPressMenu = (item, event) => {
        FeedbackHaptics('Medium')
        setBottomSheetData(false);
        onSelect(item, event)
    }

    return (
        <View className='w-full mt-0 mb-2'>
            {items.map(
                (item, index) =>
                    <View key={item.id} className='mb-0'><Button
                        variant="text"
                        size="base"
                        fullWidth
                        onPress={(event) => onPressMenu(item, event)}
                        align="start"
                        title={item.title}
                    /></View>

            )}
        </View>
    );
});

export default function (oProps) {

    const isWeb = Platform.OS == 'web'
    if (isWeb)
        return <DropdownMenuWeb {...oProps} />
    else
        return <DropdownMenuMobile {...oProps} />

    
}

function DropdownMenuMobile(oProps) {
    const { setBottomSheetData } = useBottomSheetData();

    const showMenu = () => {
        console.log("aaaa");
        FeedbackHaptics('Medium')
        setBottomSheetData({ title: 'Menu options', showClose: true, snapPoints: ['10%', '50%'], content: <Menu items={oProps.items} onSelect={oProps.onSelect} setBottomSheetData={setBottomSheetData} /> });
    }

    return (
        <Pressable onPress={() => showMenu()}>{oProps.children}</Pressable>
    );
}


function DropdownMenuWeb(oProps) {

        const redirectdRef = useRef();
    
        /*if (!DropdownMenu) {
            return null; // or return a loading spinner
        }
    */
        const bWeb = Platform.OS === 'web';
    
        const handleSelect = (oItem) => {
            redirectdRef.current.redirect('' + oItem.link);
        }
    
        const sVariant = !!oProps?.variant ? oProps.variant : 'vertical';
        const onSelect = oProps?.onSelect ? oProps.onSelect : handleSelect;
    
        const DmContent = (sVariant == 'vertical' || sVariant == 'nopad') ? DropdownMenuContentV : DropdownMenuContentH;
        const DmItem = sVariant == 'vertical' ? DropdownMenuItemV : (sVariant == 'nopad' ? DropdownMenuItemNoPad : DropdownMenuItemH);   
    
    
        const aDmItems = oProps.items.map((oItem) => {
            let sIcon = undefined;
            if(!!oItem?.icon) {
                if(isEmoji(oItem.icon))
                    sIcon = (
                        <Text className={oItem?.class_item_icon}>{oItem.icon}</Text>
                    );
                else
                    sIcon = (
                        <Icon className={oItem?.class_item_icon} icon={oItem.icon} />
                    );
            }
    
            return (
                <DmItem key={oItem.id} onSelect={(event) => !!oItem?.onClick ? oItem?.onClick(oItem, event) : onSelect(oItem, event)} {...(bWeb ? {className: oItem?.class_item} : {})}>
                    {!!sIcon && <DropdownMenuItemIcon>{sIcon}</DropdownMenuItemIcon>}
                    {!!oItem?.title && <DropdownMenuItemTitle {...(bWeb ? {className: oItem?.class_item_title} : {})}>{oItem.title}</DropdownMenuItemTitle>}
                    {(false && bWeb && oItem.indicator && !oItem.indicator.variant) && <DropdownMenuItemSubtitle>{ oItem.indicator }</DropdownMenuItemSubtitle>}
                    {(false && bWeb && oItem.indicator && oItem.indicator.variant) && <DropdownMenuItemSubtitleRed>{ oItem.indicator.text }</DropdownMenuItemSubtitleRed>}
                </DmItem>
            );
        });
    
        return (
            <View >
                <Redirect ref={redirectdRef} />
                <DropdownMenuRoot>
                    <DropdownMenuTrigger data-state='open'><Pressable onPress={() => {}}>{oProps.children}</Pressable></DropdownMenuTrigger>
                    <DmContent>{aDmItems}</DmContent>
                </DropdownMenuRoot>
            </View>
        );
}

