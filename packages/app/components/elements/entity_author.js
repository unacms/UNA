import { menuItemsByName, FeedbackHaptics } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { Button } from 'app/design/controls';
import { View } from 'app/design/view';
import Time from 'app/ui/atoms/time';
//import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Profile from 'app/ui/molecules/profile';
import dynamic from 'next/dynamic'

export default function ElementEntityAuthor(oProps) {
    let { currentUser, setCurrentUser } = useCurrentUser();

    const sInfo = (
        <Time ts={oProps.data.entry_date}></Time>
    );

    const aMenuManageItems = !!currentUser ? oProps?.data?.menu_manage && menuItemsByName(oProps.data.menu_manage?.object, oProps.data.menu_manage?.items).map((aItem) => {
        return {
            id: aItem.id ? aItem.id : aItem.name,
            link: aItem.link,
            title: aItem.title
        };
    }) : [];

    const DropdownMenu = dynamic(() => import('app/ui/atoms/dropdown-menu'), {
        ssr: false,
    })

    return (
        <View className={ false ? "mx-auto w-full max-w-5xl flex-row   justify-between  pt-4 px-4 sm:rounded-t-lg bg-neocard dark:bg-neocard-dark sm:border-t  sm:m-0 border-neoborder dark:border-neoborder-dark sm:border-x" : " w-full items-center flex-row justify-between  "}>
            <View className="flex-auto "><Profile {...oProps.data.author_data} displayType="unit" displaySize="base" showInfo={sInfo} /></View>
            <View>
            {aMenuManageItems.length > 0 && 
                <DropdownMenu items={aMenuManageItems}>
                    <Button id="mm-button" variant="text" rounded="true" startDecorator="DotsThreeOutline" onPress={() => {FeedbackHaptics('Medium');}} />
                </DropdownMenu>
            }
            </View>
        </View>
    );
}