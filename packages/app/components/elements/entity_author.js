import { useRef } from 'react';
//import { useSession, signIn, signOut } from "next-auth/react";

import { Button } from 'app/design/controls';
import { View } from 'app/design/view';
import { 
    DropdownMenuRoot, 
    DropdownMenuContentV, 
    DropdownMenuTrigger, 
    DropdownMenuItemV, 
    DropdownMenuItemTitle,
    DropdownMenuItemIcon
} from 'app/design/dropdown';
import Redirect from 'app/ui/atoms/redirect';
import Profile from 'app/ui/molecules/profile';
import Menu from 'app/components/menu';

export default function ElementEntityAuthor(oProps) {
    const session = true;//const { data: session } = useSession();
    const redirectdRef = useRef();

    let oAuthor = oProps.data.author;

    const sInfo = (
        <Menu {...oAuthor.author_desc} displayType="link" params={{
            className: 'bx-menu flex flex-row flex-wrap justify-start items-center web:space-x-2',
            classNameItem: {
                link: 'flex text-neogray-600 dark:text-neogray-400 hover:text-neogray-900 dark:hover:text-gray-100 hover:underline ios:pr-2 android:pr-2',
                text: 'flex ios:pr-2 android:pr-2'
            }
        }} />
    );

    const oMenuManage = oProps.data.menu_manage;
    const aMenuManageExcept = ['more-auto'];

    const handleClick = (sUrl) => {
        redirectdRef.current.redirect(sUrl);
    }

    const sMenuManageItems = Object.keys(oMenuManage.items).map(function(iKey) {
        const aItem = oMenuManage.items[iKey];

        if(aItem.display_type != undefined && aItem.display_type != 'undefined')
            return;

        if(!(aItem.id || aItem.name) || aMenuManageExcept.includes(aItem.name))
            return;

        return (
            <DropdownMenuItemV key={aItem.id ? aItem.id : aItem.name} onSelect={() => handleClick(aItem.link)}>
                <DropdownMenuItemTitle>{aItem.title}</DropdownMenuItemTitle>
            </DropdownMenuItemV>
        );
    });

    const sMenuManage = (
        <View>
            <Redirect ref={redirectdRef} />
            <DropdownMenuRoot>
                <DropdownMenuTrigger>
                    <Button id="mm-button" variant="text" rounded="true" startDecorator="more" onPress={() => {}} />
                </DropdownMenuTrigger>
                <DropdownMenuContentV>{sMenuManageItems}</DropdownMenuContentV>
            </DropdownMenuRoot>
        </View>
    );

    return (
        <View className="mx-auto w-full max-w-5xl flex-row items-center justify-between  pt-4 px-4 sm:rounded-t-lg bg-neocard dark:bg-neocard-dark border-t  border-neoborder/30 dark:border-neoborder-dark/30 sm:border-x">
            <Profile {...oAuthor.author_unit} displayType="unit" displaySize="xl" showInfo={sInfo} />
            {session && sMenuManage}
        </View>
    );
}
