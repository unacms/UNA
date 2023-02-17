import React from 'react';
//import { useSession, signIn, signOut } from "next-auth/react";
import Menu from '../menu';
import MenuMore from '../atoms/menu-more';

import { View } from 'app/design/view';
import Profile from '../atoms/profile';

export default function ElementAuthor(oProps) {
    const session = false;//const { data: session } = useSession();

    let oAuthor = oProps.data.author;

    const sInfo = (
        <Menu {...oAuthor.author_desc} displayType="link" params={{
            className: 'bx-menu flex-row flex-wrap justify-start items-stretch ',
            classNameItem: {
                link: 'block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline',
                text: 'block'
            }
        }} />
    );

    return (
        <View className=" flex-row items-center gap-3 pt-4 px-4 sm:mt-4 sm:mx-4 sm:rounded-t-lg bg-white dark:bg-gray-900">
            <Profile {...oAuthor.author_unit} displayType="unit" display_size="lg" showInfo={sInfo} />
            {session && <MenuMore {...oProps.data.menu_manage} />}
        </View>
    );
}
