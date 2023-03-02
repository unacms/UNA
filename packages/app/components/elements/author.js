import React from 'react';
import { Platform } from 'react-native';
//import { useSession, signIn, signOut } from "next-auth/react";

import { A, Text } from 'app/design/typography';
import { View } from 'app/design/view';
import { 
    DropdownMenuRoot, 
    DropdownMenuContentV, 
    DropdownMenuTrigger, 
    DropdownMenuItemV, 
    DropdownMenuItemTitle,
    DropdownMenuItemIcon
} from 'app/design/dropdown';

import Menu from '../menu';
import Profile from '../atoms/profile';

export default function ElementAuthor(oProps) {
    const session = true;//const { data: session } = useSession();

    let oAuthor = oProps.data.author;

    const sInfo = (
        <Menu {...oAuthor.author_desc} displayType="link" params={{
            className: 'bx-menu flex-row flex-wrap justify-start items-stretch ',
            classNameItem: {
                link: 'block text-neo-600 dark:text-neo-400 hover:text-neo-900 dark:hover:text-gray-100 hover:underline',
                text: 'block'
            }
        }} />
    );

    const oMenuManage = oProps.data.menu_manage;
    const aMenuManageExcept = ['more-auto'];

    const sMenuManageItems = Object.keys(oMenuManage.items).map(function(iKey) {
        const aItem = oMenuManage.items[iKey];

        if(aItem.display_type != undefined && aItem.display_type != 'undefined')
            return;

        if(!(aItem.id || aItem.name) || aMenuManageExcept.includes(aItem.name))
            return;

        return (
            <DropdownMenuItemV key={aItem.id ? aItem.id : aItem.name}>
                <A href={aItem?.link && aItem.link != 'javascript:void(0)' ? aItem.link : ''}>
                    <DropdownMenuItemTitle>{aItem.title}</DropdownMenuItemTitle>
                </A>
            </DropdownMenuItemV>
        );
    });

    const sMenuManage = (
        <DropdownMenuRoot>
            <DropdownMenuTrigger>
                <A id="mm-button" type="button" className="group inline-flex items-center p-1.5 text-xs font-medium text-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-700 bg-transparent active:bg-gray-200 active:shadow-inner hover:text-gray-900 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:text-gray-300 dark:hover:text-white">
                    {Platform.OS == 'web' && 
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5  group-active/button:scale-150 duration-200">
                        <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM15.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
                    </svg>
                    }
                </A>
            </DropdownMenuTrigger>
            <DropdownMenuContentV>{sMenuManageItems}</DropdownMenuContentV>
        </DropdownMenuRoot>
    );

    return (
        <View className="mx-auto w-full max-w-5xl flex-row items-center justify-between  pt-4 px-4 sm:rounded-t-lg bg-card dark:bg-card-dark border-t  border-bordercolor/10 dark:border-bordercolor-dark/10 sm:border-x">
            <Profile {...oAuthor.author_unit} displayType="unit" displaySize="xl" showInfo={sInfo} />
            {session && sMenuManage}
        </View>
    );
}
