import React from 'react';
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls';
import { View } from 'app/design/view';
import { Icon } from 'app/ui/atoms/icon'

export default function MenuItemButton(oProps) {
    const bUseInternalIcons = true;
    const bShowVertical = oProps.params != undefined && oProps.params.showVertical != undefined && oProps.params.showVertical === true;
    const bTitleOnly = oProps?.params && oProps.params?.showTitleOnly === true;

    const handleClick = () => {
        if(oProps.params?.onclick)
            oProps.params.onclick(event, oProps);
    }

    let oButtonProps = {
        variant: oProps.primary ? 'primary' : 'default',
        onPress: handleClick,
    };

    if(bShowVertical)
        oButtonProps['fullWidth'] = true;

    let sIcon = '';
    if(oProps?.icon && !bTitleOnly) {
        if(bUseInternalIcons)
            sIcon = <Icon icon={oProps.icon} className="flex h-6 w-6"></Icon>;
        else
            sIcon = <Text className="h-6 w-6 text-base">{oProps.icon}</Text>;
    }

    let sContent = '';
    if(sIcon)
        sContent = (
            <View>
                {sIcon}
                {oProps?.title && <Text className='flex'>{oProps.title}</Text>}
            </View>
        );
    else
        oButtonProps['title'] = oProps?.title ? oProps.title : '';

    const sClassName = 'menu-item flex' + (bShowVertical ? ' flex-col w-full ios:pb-2 android:pb-2' : ' flex-row pr-2');
    return (
        <View className={sClassName}>
            <Button {...oButtonProps}>{sContent}</Button>
        </View>
    );
}
