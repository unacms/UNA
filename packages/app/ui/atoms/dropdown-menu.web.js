import { useRef, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { isEmoji } from 'app/lib/util';
import { Text } from 'app/design/typography';
import { Pressable, View } from 'app/design/view';
import React, { memo } from 'react'
import Redirect from 'app/ui/atoms/redirect';
import { Icon } from 'app/ui/atoms/icon'

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



export default function (oProps) {

    const redirectdRef = useRef();
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

