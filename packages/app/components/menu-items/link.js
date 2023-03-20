import React from 'react';
import { Text } from 'app/design/typography'
import Link from 'app/ui/atoms/link';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';

export default function MenuItemLink(oProps) {
    if(!oProps.title && !oProps.icon)
        return;

    const bShowVertical = oProps?.params && oProps.params?.showVertical === true;
    const bShowLink = (oProps?.link && oProps.link != 'javascript:void(0)') || false;
    const bShowButton = (!bShowLink && oProps.params?.onclick) || false;
    const bTitleOnly = oProps?.params && oProps.params?.showTitleOnly === true;

    const DisplayLink = (oProps) => {
        const sClassName = 'menu-item ' + ((oProps?.params && oProps.params?.classNameItem && oProps.params.classNameItem?.link) || 'block text-neo-600 dark:text-neo-400 hover:text-neo-900 dark:hover:text-gray-100 hover:underline cursor-pointer');

        return (
            <Link className={sClassName} href={oProps.link}>{oProps.title}</Link>
        );
    }

    const DisplayButton = (oProps) => {
        const handleClick = () => {
            if(oProps.params?.onclick)
                oProps.params.onclick(event, oProps);
        }

        return (
             <Button variant="link" title={oProps.title} onPress={handleClick} />
        );
    }

    const DisplayText = (oProps) => {
        const sClassName = 'menu-item ' + ((oProps?.params && oProps.params?.classNameItem && oProps.params.classNameItem?.text) || 'block');

        return (
            <Text className={sClassName}>{oProps.title}</Text>
        );
    }

    let sTitle = '';
    switch(oProps.content_type) {
        case 'time':
            sTitle = <Time ts={oProps.title}></Time>
            break;
            
        case 'profile':
            sTitle = <Profile {...oProps.data} displayType="minimal" displaySize="xs"  className="" />
            break;

        default:
            sTitle = oProps.title;
    }

    sTitle = (
        <Text className="flex-row gap-1 mx-auto">
            {oProps.icon && !bTitleOnly && <Text className='h-6 w-6 text-base'>{oProps.icon}</Text>}
            {sTitle && <Text className='mr-2'>{sTitle}</Text>}
        </Text>
    );

    return (
        <Text>
            {bShowLink && <DisplayLink {...oProps} title={sTitle} />}
            {bShowButton && <DisplayButton {...oProps} title={sTitle} />}
            {!bShowLink && !bShowButton && <DisplayText {...oProps} title={sTitle} />}
        </Text>
    );
}
