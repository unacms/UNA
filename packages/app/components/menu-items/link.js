import React from 'react';
import Time from '../atoms/time';
import { A, Text } from 'app/design/typography'

export default function MenuItemLink(oProps) {
    if(!oProps.title && !oProps.icon)
        return;

    const bShowLink = (oProps?.link && oProps.link != 'javascript:void(0)') || oProps.params?.onclick || false;
    const bShowVertical = oProps?.params && oProps.params?.showVertical === true;
    const bTitleOnly = oProps?.params && oProps.params?.showTitleOnly === true;

    const DisplayLink = (oProps) => {
        const sClassName = 'menu-item ' + (oProps?.params && oProps.params?.classNameItem || 'block  text hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white') + (!bShowVertical ? ' rounded-lg' : '') + ' cursor-pointer';

        const handleClick = () => {
            if(oProps.params?.onclick)
                oProps.params.onclick(event, oProps);
        }

        return (
            <A className={sClassName} href={oProps.url} onPress={handleClick}>{oProps.title}</A>
        );
    }

    const DisplayText = (oProps) => {
        const sClassName = oProps?.params && oProps.params?.classNameItem || 'menu-item block px-4 py-2';

        return (
            <Text className={sClassName}>{oProps.title}</Text>
        );
    }

    let sTitle = '';
    switch(oProps.content_type) {
        case 'time':
            sTitle = <Time ts={oProps.title}></Time>;
            break;

        default:
            sTitle = oProps.title;
    }

    sTitle = (
        <Text className="flex-row gap-1 mx-auto">
            {oProps.icon && !bTitleOnly && <p className='h-6 w-6 text-base'>{oProps.icon}</p>}
            {sTitle && <Text className='mr-2'>{sTitle}</Text>}
        </Text>
    );

    return (
        <Text>{bShowLink ? <DisplayLink {...oProps} title={sTitle} /> : <DisplayText {...oProps} title={sTitle} />}</Text>
    );
}
