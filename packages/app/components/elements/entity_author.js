import { menuItemsByName } from 'app/lib/util';
import { Button } from 'app/design/controls';
import { View } from 'app/design/view';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Profile from 'app/ui/molecules/profile';
import Menu from 'app/components/menu';

export default function ElementEntityAuthor(oProps) {
    let oAuthor = oProps.data.author;

    const sInfo = (
        <Menu {...oAuthor.author_desc} displayType="link" params={{
            className: ' bx-menu flex-col gap-2',
            classNameItem: {
                link: 'flex text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline gap-2',
                text: 'flex gap-2'
            }
        }} />
    );

    const aMenuManageItems = menuItemsByName('bx_posts_item_manange', oProps.data.menu_manage.items).map((aItem) => {
        return {
            id: aItem.id ? aItem.id : aItem.name,
            link: aItem.link,
            title: aItem.title
        };
    });

    return (
        <View 
            className={ false ? "mx-auto w-full max-w-5xl flex-row   justify-between  pt-4 px-4 sm:rounded-t-lg bg-neocard dark:bg-neocard-dark sm:border-t  sm:m-0 border-neoborder dark:border-neoborder-dark sm:border-x" : " w-full items-center flex-row justify-between  "}>
            <View className="flex-auto "><Profile {...oAuthor.author_unit} displayType="unit" displaySize="base" showInfo={sInfo} /></View>
            <View>
                <DropdownMenu variant="vertical" items={aMenuManageItems}>
                    <Button id="mm-button" variant="text" rounded="true" startDecorator="DotsThreeOutline" onPress={() => {}} />
                </DropdownMenu>
            </View>
        </View>
    );

}