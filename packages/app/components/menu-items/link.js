import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';
import { Icon } from 'app/ui/atoms/icon'

export default function MenuItemLink(oProps) {
    if(!oProps.title && !oProps.icon)
        return;

    const oIconAliases = {
        'item-comment': 'ChatTeardropDots',
        'item-share': 'ShareFat'
    };

    const bShowVertical = oProps?.params && oProps.params?.showVertical === true;
    const bShowLink = (oProps?.link && oProps.link != 'javascript:void(0)') || false;
    const bTitleOnly = oProps?.params && oProps.params?.showTitleOnly === true;
    const oIconset = oProps?.params && !!oProps.params?.iconset ? oProps.params.iconset : {};

    const DisplayLink = (oProps) => {
        const sClassName = 'menu-item ' + ((oProps?.params && oProps.params?.classNameItem && oProps.params.classNameItem?.link) || 'flex max-w-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:underline cursor-pointer');

        return (
            <View className={sClassName}>
                <Link href={oProps.link}>{oProps.content}</Link>
            </View>
        );
    }

    const DisplayText = (oProps) => {
        const sClassName = 'menu-item ' + ((oProps?.params && oProps.params?.classNameItem && oProps.params.classNameItem?.text) || 'flex max-w-full');

        return (
            <View className={sClassName}>{oProps.content}</View>
        );
    }

    const sClassContent = 'flex flex-row items-center';

    let sIcon = '';
    if(!bTitleOnly) {
        if(!!oIconAliases[oProps.name])
            sIcon = oIconAliases[oProps.name];
        else if(!!oIconset[oProps.name])
            sIcon = oIconset[oProps.name];
    }

    let sContent = undefined;
    switch(oProps.content_type) {
        case 'time':
            sContent = (
                <View className={sClassContent}>
                    {!!sIcon && <Icon icon={sIcon} />}
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
                    {!!sIcon && <Icon icon={sIcon} />}
                    <Text className=" mx-auto px-2 py-0.5 rounded-full bg-bgritem dark:bg-bgritem-d flex text-sm text-neutral-600 dark:text-neutral-400">{oProps.title}</Text>
                </View>
            );
    }

    return bShowLink ? <DisplayLink {...oProps} content={sContent} /> : <DisplayText {...oProps} content={sContent} />;
}
