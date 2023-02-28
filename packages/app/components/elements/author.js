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
                link: 'block text-neo-600 dark:text-neo-400 hover:text-neo-900 dark:hover:text-gray-100 hover:underline',
                text: 'block'
            }
        }} />
    );

    return (
        <View className="mx-auto w-full max-w-5xl flex-row items-center  pt-4 px-4 sm:rounded-t-lg bg-card dark:bg-card-dark border-t  border-bordercolor/10 dark:border-bordercolor-dark/10 sm:border-x">
            <Profile {...oAuthor.author_unit} displayType="unit" displaySize="xl" showInfo={sInfo} />
            {session && <MenuMore {...oProps.data.menu_manage} />}
        </View>
    );
}
