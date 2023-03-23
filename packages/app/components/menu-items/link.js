import React from 'react';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';
import { Icon } from 'app/components/svg';

export default function MenuItemLink(oProps) {
    if(!oProps.title && !oProps.icon)
        return;

    const bUseInternalIcons = true;

    const bShowVertical = oProps?.params && oProps.params?.showVertical === true;
    const bShowLink = (oProps?.link && oProps.link != 'javascript:void(0)') || false;
    const bTitleOnly = oProps?.params && oProps.params?.showTitleOnly === true;

    const DisplayLink = (oProps) => {
        const sClassName = 'menu-item ' + ((oProps?.params && oProps.params?.classNameItem && oProps.params.classNameItem?.link) || 'flex ios:pr-2 android:pr-2 text-neo-600 dark:text-neo-400 hover:text-neo-900 dark:hover:text-gray-100 hover:underline cursor-pointer');

        return (
            <View className={sClassName}>
                <Link href={oProps.link}>
                    <Text>{oProps.title}</Text>
                </Link>
            </View>
        );
    }

    const DisplayText = (oProps) => {
        const sClassName = 'menu-item ' + ((oProps?.params && oProps.params?.classNameItem && oProps.params.classNameItem?.text) || 'flex ios:pr-2 android:pr-2');

        return (
            <View className={sClassName}>
                <Text>{oProps.title}</Text>
            </View>
        );
    }

    let sTitle = undefined;
    switch(oProps.content_type) {
        case 'time':
            sTitle = <Time ts={oProps.title}></Time>
            break;

        case 'profile':
            sTitle = <Profile {...oProps.data} displayType="unit" displaySize="xs" showInfo="false" />
            break;

        case 'text':
        default:
            sTitle = <Text className="flex">{oProps.title}</Text>
    }

    let sIcon = undefined;
    if(oProps?.icon && !bTitleOnly) {
        if(bUseInternalIcons)
            sIcon = <Icon icon={oProps.icon} className="flex h-6 w-6 ios:pr-1 android:pr-1"></Icon>;
        else
            sIcon = <Text className="h-6 w-6 ios:pr-1 android:pr-1 text-base">{oProps.icon}</Text>;
    }

    sTitle = (
        <View className="flex flex-row web:space-x-1">{sIcon}{sTitle}</View>
    );

    return bShowLink ? <DisplayLink {...oProps} title={sTitle} /> : <DisplayText {...oProps} title={sTitle} />;
}
