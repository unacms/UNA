import React from 'react';
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls';
import { View } from 'app/design/view';
import { Icon } from 'app/components/svg';

export default function MenuItemButton(oProps) {
    const bUseInternalIcons = true;
    const bShowVertical = oProps.params != undefined && oProps.params.showVertical != undefined && oProps.params.showVertical === true;
    const bTitleOnly = oProps?.params && oProps.params?.showTitleOnly === true;

    let sClassName = 'menu-item whitespace-nowrap'
    if(bShowVertical)
        sClassName += ' w-full';

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
            <>
                {sIcon}
                {oProps?.title && <Text>{oProps.title}</Text>}
            </>
        );
    else
        oButtonProps['title'] = oProps?.title ? oProps.title : '';

    return (
        <View className={sClassName}>
            <Button {...oButtonProps}>{sContent}</Button>
        </View>
    );
}
