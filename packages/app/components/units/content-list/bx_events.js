import { useState, useMemo, useRef } from 'react'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { getImageSizes, FeedbackHaptics, tp, t, formatDateInterval } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Card from 'app/ui/molecules/card'
import { Button, Modal } from 'app/design/controls'
import Redirect from 'app/ui/atoms/redirect'
import { componentsMap } from 'app/ui/molecules/_map'
import ProfilesList from 'app/ui/molecules/profile_list'
import Time from 'app/ui/atoms/time'
import MoreMenu from 'app/components/nav/menu-more'
import { useTranslation } from 'react-i18next';
import { staticComponents } from 'app/static';
import { callFn } from 'app/lib/functions/call';

export default function Unit(props) {

    const data = props.data;
    const imageSizes = getImageSizes();
    const redirectdRef = useRef();
    const [popupVisible, setPopupVisible] = useState(false);
    const { t } = useTranslation();


    const handleClick = (event, sUrl) => {
        event.preventDefault();

        redirectdRef.current.redirect(sUrl);
    };

    const handleClickMore = (event) => {
        event.preventDefault();

        FeedbackHaptics("Medium");
        setPopupVisible(true);
    };

    const friendsLabel = data.followers_count > 0 ? tp("intrested", data?.followers_count) : ''
    const friendsLabel1 = data.members_count > 0 ? tp("going", data?.followers_count) : ''

    const { oMenuItemPrimary, oMenuItemSecondary } = useMemo(() => {
        return callFn("getUnitMenuItems", [props.unitType, data, handleClick, t, props.module]);
    }, [props.unitType, data, handleClick, t]);

    return (
        <>
            <Redirect ref={redirectdRef} />
            <Card margin="m-2" rounded="rounded-2xl">
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


                                    <View className="mr-2 h-6">
                                        <ProfilesList
                                            data={
                                                data.followers_list
                                            }
                                            showEmpty={false}
                                            maxCount={3}
                                            displaySize="xs"
                                        />
                                    </View>
                                    {
                                        <><Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                            {friendsLabel}
                                        </Text>
                                            {friendsLabel == '' && <Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                                {friendsLabel1}
                                            </Text>
                                            }
                                        </>
                                    }

                                    <Text className=" bg-primary/10  rounded-md  px-1.5 py-1 text-xs flex-none items-center font-semibold text-neutral-600 dark:text-neutral-400">
                                        {data.visibility != "3" ? (
                                            <>Private</>
                                        ) : (
                                            <>Public</>
                                        )}
                                    </Text>
                                </Row>

                                <Row className='mb-3 w-full bg-primary/30 px-2 py-1 rounded-md justify-between'>

                                    {data.date_start && (
                                        <Text className="  text-neutral-600 dark:text-neutral-400 text-xs uppercase font-semibold tracking-tight overflow-hidden  rounded-md flex-none items-center">
                                            {formatDateInterval(data.date_start, data.date_end, t)}
                                        </Text>

                                    )}


                                </Row>
                            </View>
                            <View className="flex-row  sm:flex-col  w-full">
                                    {oMenuItemPrimary}
                                    {!!oMenuItemSecondary && <View className={`${!!oMenuItemPrimary && 'sm:mt-2  ml-2 sm:ml-0'}`}>{oMenuItemSecondary}</View>}
                            </View>
                        </View>
                    </View>
                </Link>
            </Card >
        </>
    );
}
