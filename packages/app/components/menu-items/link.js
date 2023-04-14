
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';
import { Icon } from 'app/ui/atoms/icon'

export default function MenuItemLink(oProps) {
    if(!oProps.title && !oProps.icon)
        return;

    const bUseInternalIcons = true;

    const bShowVertical = oProps?.params && oProps.params?.showVertical === true;
    const bShowLink = (oProps?.link && oProps.link != 'javascript:void(0)') || false;
    const bTitleOnly = oProps?.params && oProps.params?.showTitleOnly === true;

    const DisplayLink = (oProps) => {
        const sClassName = 'menu-item ' + ((oProps?.params && oProps.params?.classNameItem && oProps.params.classNameItem?.link) || 'flex' + (bShowVertical ? ' ios:pb-2 android:pb-2' : ' pr-2') + ' max-w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline cursor-pointer');

        return (
            <View className={sClassName}>
                <Link href={oProps.link}>{oProps.content}</Link>
            </View>
        );
    }

    const DisplayText = (oProps) => {
        const sClassName = 'menu-item ' + ((oProps?.params && oProps.params?.classNameItem && oProps.params.classNameItem?.text) || 'flex' + (bShowVertical ? ' ios:pb-2 android:pb-2' : ' pr-2') + ' max-w-full');

        return (
            <View className={sClassName}>{oProps.content}</View>
        );
    }

    let sIcon = undefined;
    if(oProps?.icon && !bTitleOnly) {
        if(bUseInternalIcons)
            sIcon = <Icon icon={oProps.icon} className="flex h-6 w-6 ios:pr-1 android:pr-1"></Icon>;
        else
            sIcon = <Text className="h-6 w-6 ios:pr-1 android:pr-1 text-base">{oProps.icon}</Text>;
    }

    const sClassContent = 'flex flex-row gap-1';

    let sContent = undefined;
    switch(oProps.content_type) {
        case 'time':
            sContent = (
                <View className={sClassContent}>
                    {sIcon}
                    <Time ts={oProps.title}></Time>
                </View>
            );
            break;

        case 'profile':
            sContent = (
                <View className="flex">
                    <Profile {...oProps.data} displayType="unit" displaySize="xs" showInfo="false" />
                </View>
            );
            break;

        case 'text':
        default:
            sContent = (
                <View className={sClassContent}>
                    {sIcon}
                    <Text className="flex text-gray-600 dark:text-gray-400">{oProps.title}</Text>
                </View>
            );
    }

    return bShowLink ? <DisplayLink {...oProps} content={sContent} /> : <DisplayText {...oProps} content={sContent} />;
}
