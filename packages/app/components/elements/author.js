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
            classNameItem: 'menu-item block  dark:hover:text-white '
        }} />
    );

    return (
        <View className="relative flex-row items-center gap-3 pt-4 px-4 sm:mt-4 sm:mx-4 sm:rounded-t-lg sm:border-x sm:border-t border-gray-300/80 bg-white dark:bg-gray-900 dark:border-gray-800/50">
            <Profile {...oAuthor.author_unit} displayType="unit" display_size="lg" showInfo={sInfo} />
            {session && <MenuMore {...oProps.data.menu_manage} />}
        </View>
    );
}
