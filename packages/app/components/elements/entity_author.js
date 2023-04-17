import { useRef } from 'react';

import { Button } from 'app/design/controls';
import { View } from 'app/design/view';
import { 
    DropdownMenuRoot, 
    DropdownMenuContentV, 
    DropdownMenuTrigger, 
    DropdownMenuItemV, 
    DropdownMenuItemTitle
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
            className: 'pl-2 py-0.5 bx-menu flex flex-row flex-wrap justify-start items-center gap-2',
            classNameItem: {
                link: 'flex text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline gap-2',
                text: 'flex gap-2'
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
                    <Button id="mm-button" variant="text" rounded="true" startDecorator="DotsThreeOutline" onPress={() => {}} />
                </DropdownMenuTrigger>
                <DropdownMenuContentV>{sMenuManageItems}</DropdownMenuContentV>
            </DropdownMenuRoot>
        </View>
    );

    return (
        <View className="mx-auto w-full max-w-5xl flex-row   justify-between  pt-4 px-4 sm:rounded-t-lg bg-neocard dark:bg-neocard-dark sm:border-t  sm:m-0 border-neoborder dark:border-neoborder-dark sm:border-x">
            <View className="flex-auto "><Profile {...oAuthor.author_unit} displayType="unit" displaySize="base" showInfo={sInfo} /></View>
            {session && sMenuManage}
        </View>
    );
}
