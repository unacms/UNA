import { useState, useMemo, useRef } from 'react'
import { useCardData } from 'app/context/card'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { getImageSizes, tp } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Card from 'app/ui/molecules/card'
import Redirect from 'app/ui/atoms/redirect'
import ProfilesList from 'app/ui/molecules/profile_list'
import { useTranslation } from 'react-i18next';
import { callFn } from 'app/lib/functions/call';
import Profile from 'app/ui/molecules/profile'

export default function Unit(props) {
    const { t } = useTranslation();
    const data = props.data;
    const imageSizes = getImageSizes();
    const redirectdRef = useRef();
    const [popupVisible, setPopupVisible] = useState(false);

    const { cardData } = useCardData();

    const handleClick = (event, sUrl) => {
        event.preventDefault();

        redirectdRef.current.redirect(sUrl);
    };

    const friendsLabel = data.members_count > 0 ? tp("members", data?.members_count) : ''

    const { oMenuItemPrimary, oMenuItemSecondary } = useMemo(() => {
        return callFn("getUnitMenuItems", [props.unitType, data, handleClick, t, props.module]);
    }, [props.unitType, data, handleClick, t]);

    console.log("props.unitType", props.unitType)

    switch (props.unitType) {
        case 'list':
            return getList();
        default:
            return getBase();
    }

    function getBase() {
        return (
            <>
                <Redirect ref={redirectdRef} />
                <Card margin="mb-px sm:mx-2 sm:mb-4" rounded="rounded-2xl">
                    <Link className="group " href={data.url}>
                        <View className="flex-row sm:flex-col p-1">
                            <View className="aspect-square sm:aspect-video w-1/3 sm:w-full rounded-xl overflow-hidden items-center justify-center bg-neutral-500/20">
                                <Image
                                    {...data.cover}
                                    alt={data.title}
                                    view="cover"
                                    className="absolute u-cover rounded-xl"
                                    sizes={imageSizes}
                                />

                            </View>
                            <View className="flex-col p-3  flex-auto items-between justify-between ">
                                <View>
                                    <Text
                                        numberOfLines={1}
                                        className=" text-lg leading-tight tracking-tight font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary group-hover:dark:text-primary-d"
                                    >
                                        {data.title}
                                    </Text>
                                    <Row className="items-center h-6 my-3">


                                        <View className="mr-2  h-6">
                                            <ProfilesList
                                                data={
                                                    data.members_list
                                                }
                                                showEmpty={false}
                                                maxCount={3}
                                                displaySize="xs"
                                            />

                                        </View>
                                        {
                                            <Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                                {friendsLabel}
                                            </Text>
                                        }

                                        <Text className=" bg-primary/10  rounded-md  px-1.5 py-1 text-xs flex-none items-center font-semibold text-neutral-600 dark:text-neutral-400">
                                            {data.visibility != "3" ? (
                                                <>Private</>
                                            ) : (
                                                <>Public</>
                                            )}
                                        </Text>
                                    </Row>
                                </View>
                                <View className="flex-row  sm:flex-col  w-full">
                                    {oMenuItemPrimary}
                                    {!!oMenuItemSecondary && <View className={`${!!oMenuItemPrimary && 'sm:mt-2  ml-2 sm:ml-0'}`}>{oMenuItemSecondary}</View>}
                                </View>
                            </View>
                        </View>
                    </Link>
                </Card>
            </>
        );
    }

    function getList() {
        return (
            <Link href={data.url} emulate={true}>
                <View
                    className=" sm:px-1 flex-row  web:duration-200 rounded-xl active:opacity-50 hover:bg-bgritem dark:hover:bg-bgritem-d items-center "
                >
                    <View className="p-1.5">
                        <Profile
                            url_avatar={data?.image?.src}
                            displayType="unit_wo_info"
                            displaySize="sm"
                            display_name={data.title}
                        /></View>


                    <View className="flex-row justify-between flex-auto items-center">
                        <Text numberOfLines={2} className="text-sm  px-1.5 leading-tight font-semibold text-neutral-800 dark:text-neutral-200">
                            {data.title}
                        </Text>

                        
                    </View>

                </View>
            </Link>

        );
    }
}
