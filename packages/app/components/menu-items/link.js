import React from 'react';
//import { useRouter } from "next/router";
import Time from '../atoms/time';
import { A, Text } from 'app/design/typography'

export default function MenuItemLink(oProps) {
    if(!oProps.title && !oProps.icon)
        return;

    // const oRouter = useRouter()

    const bShowVertical = oProps?.params && oProps.params?.showVertical === true;

    const bTitleOnly = oProps?.params && oProps.params?.showTitleOnly === true;

    const handleClick = () => {
        if(oProps?.link && oProps.link != 'javascript:void(0)') {
            // oRouter.push(oProps.link);
            return;
        }

        if(oProps.params?.onclick)
            oProps.params.onclick(event, oProps);
    }

    let sTitle = '';
    switch(oProps.content_type) {
        case 'time':
            sTitle = <Time ts={oProps.title}></Time>;
            break;

        default:
            sTitle = oProps.title;
    }

    let sItem = '';
    if(bShowVertical) {
        const sClassName = oProps?.params && oProps.params?.classNameItem || 'menu-item block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer';

        sItem = (
            <A className={sClassName} onPress={handleClick}>
                <Text className="flex gap-1 mx-auto">
                    {oProps.icon && !bTitleOnly && <p className='h-6 w-6 text-base'>{oProps.icon}</p>}
                    {sTitle && <Text className='pl-1.5 pr-0.5'>{sTitle}</Text>}
                </Text>
            </A>
        );
    }
    else {
        const sClassName = oProps?.params && oProps.params?.classNameItem || 'menu-item block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white rounded-lg cursor-pointer';

        sItem = (
            <A className={sClassName} onPress={handleClick}>
                <Text className="flex gap-1 mx-auto">
                    {oProps.icon && !bTitleOnly && <p className='h-6 w-6 text-base'>{oProps.icon}</p>}
                    {sTitle && <Text className='pl-1.5 pr-0.5'>{sTitle}</Text>}
                </Text>
            </A>
        );
    }

    return sItem;
}
