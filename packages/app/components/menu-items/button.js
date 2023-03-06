import React from 'react';
import Link from '../../ui/atoms/link';
import { View } from 'app/design/view'

export default function MenuItemButton(oProps) {
    const bShowVertical = oProps.params != undefined && oProps.params.showVertical != undefined && oProps.params.showVertical === true;

    let sClassName = 'group inline-flex items-center py-2.5 px-5 shadow-sm hover:shadow active:opacity-80 active:shadow-none text-sm focus:outline-none font-medium text-gray-700 bg-white border focus:z-10 focus:ring-4 focus:ring-gray-200  border-gray-200 hover:border-gray-300 rounded-lg hover:bg-gray-100 bg-transparent hover:text-gray-900  focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 dark:focus:text-white';
    if(bShowVertical)
        sClassName += ' w-full justify-center';

    return (
        <View className="menu-item whitespace-nowrap">
            <Link href={oProps.link && oProps.link != 'javascript:void(0)' ? oProps.link : ''} className={sClassName}>{oProps.title ? oProps.title : 'Unsupported'}</Link>
        </View>
    );
}
