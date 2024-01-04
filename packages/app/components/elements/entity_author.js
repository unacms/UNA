import { menuItemsByName, FeedbackHaptics } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { Button } from 'app/design/controls';
import { View, Row } from 'app/design/view';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'

export default function ElementEntityAuthor(oProps) {
    let { currentUser, setCurrentUser } = useCurrentUser();

    const sInfo = (
        <Time ts={oProps.data.entry_date}></Time>
    );

    const aMenuManageItems = !!currentUser ? oProps?.data?.menu_manage && menuItemsByName(oProps.data.menu_manage?.object, oProps.data.menu_manage?.items).map((aItem) => {
        return {
            id: aItem.id ? aItem.id : aItem.name,
            link: '/' + aItem.link,
            title: aItem.title
        };
    }) : [];

    return (
        <View className={false ? "mx-auto w-full max-w-5xl flex-row   justify-between  pt-4 px-4  sm:rounded-t-lg bg-bgrcard dark:bg-bgrcard-d sm:border-t  sm:m-0 border-bdr dark:border-bdr-d sm:border-x" : " w-full items-center flex-row justify-between  "}>
            <View className={oProps.data.text ? '' : 'flex-auto'}><Profile {...oProps.data.author_data} displayType="unit" displaySize="base" showInfo={sInfo} /></View>
            { oProps.data.text && (
                <View className='flex-auto overflow-hidden text-ellipsis w-1/2 lg:w-auto px-4'>
                    <Link href={oProps.data.url}>
                        <Text className=" lg:text-center overflow-hidden text-ellipsis text-lg font-bold font-bold  text-neutral-900 dark:text-neutral-50 overflow" numberOfLines={2}>
                            {oProps.data.text}
                        </Text>
                    </Link>
                </View>
                )
            }
            <View>
                { aMenuManageItems.length > 0 &&
                    <DropdownMenu items={aMenuManageItems}>
                        <Button variant="text" rounded="true" startDecorator="DotsThreeOutline" onPress={() => { FeedbackHaptics('Medium'); }} />
                    </DropdownMenu>
                }
            </View>
        </View>
    );
}