import { useRef, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { isEmoji } from 'app/lib/util';
import { Text } from 'app/design/typography';
import { Pressable, View } from 'app/design/view';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Button, Modal } from 'app/design/controls'
import React, { memo } from 'react'
//import * as DropdownMenu from 'zeego/dropdown-menu'
import Redirect from 'app/ui/atoms/redirect';
import { Icon } from 'app/ui/atoms/icon'
import { FeedbackHaptics } from 'app/lib/util';

export const Menu = memo(({ items, onSelect, setBottomSheetData}) => {

    const onPressMenu = (item, event) => {
        FeedbackHaptics('Medium')
        setBottomSheetData(false);
        onSelect(item, event)
    }

    return (
        <View className='w-full mt-6'>
            {items.map(
                (item, index) =>
                    <View key={item.id} className='mb-2'><Button
                        variant="outline"
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
    const { setBottomSheetData } = useBottomSheetData();


    const showMenu = () => {
        FeedbackHaptics('Medium')
        setBottomSheetData({ title: 'Menu options', showClose: true, snapPoints: ['50%', '50%'], content: <Menu items={oProps.items} onSelect={oProps.onSelect} setBottomSheetData={setBottomSheetData} /> });
    }

    return (
        <Pressable onPress={() => showMenu()}>{oProps.children}</Pressable>
    );
}
