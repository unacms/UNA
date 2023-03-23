import React from 'react';
import { Platform } from 'react-native';
//import { useSession, signIn, signOut } from "next-auth/react";

import { Button } from 'app/design/controls';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import { 
    DropdownMenuRoot, 
    DropdownMenuContentV, 
    DropdownMenuTrigger, 
    DropdownMenuItemV, 
    DropdownMenuItemTitle,
    DropdownMenuItemIcon
} from 'app/design/dropdown';
import Link from 'app/ui/atoms/link';
import Profile from 'app/ui/molecules/profile';
import Menu from 'app/components/menu';

export default function ElementEntityAuthor(oProps) {
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
                <Link href={aItem.link}>
                    <DropdownMenuItemTitle>{aItem.title}</DropdownMenuItemTitle>
                </Link>
            </DropdownMenuItemV>
        );
    });

    const sMenuManage = (
        <DropdownMenuRoot>
            <DropdownMenuTrigger>
                <Button id="mm-button" variant="text" rounded="true" startDecorator="more" onPress={() => {}} />
            </DropdownMenuTrigger>
            <DropdownMenuContentV>{sMenuManageItems}</DropdownMenuContentV>
        </DropdownMenuRoot>
    );

    return (
        <View className="mx-auto w-full max-w-5xl flex-row items-center justify-between  pt-4 px-4 sm:rounded-t-lg bg-card dark:bg-card-dark border-t  border-neoborder/30 dark:border-neoborder-dark/30 sm:border-x">
            <Profile {...oAuthor.author_unit} displayType="unit" displaySize="xl" showInfo={sInfo} />
            {session && sMenuManage}
        </View>
    );
}
