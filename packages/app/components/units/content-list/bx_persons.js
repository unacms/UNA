import { useState, useContext, useRef, useMemo, memo } from 'react'
import { useCardData } from 'app/context/card'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { getImageSizes, tp } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import MoreMenu from 'app/components/nav/menu-more'
import Card from 'app/ui/molecules/card'
import { Button } from 'app/design/controls'
import Redirect from 'app/ui/atoms/redirect'
import { componentsMap } from 'app/ui/molecules/_map'
import ProfilesList from 'app/ui/molecules/profile_list'
import { useTranslation } from 'react-i18next';
import Letter from 'app/ui/atoms/letter'
import { fetcher } from 'app/lib/fetcher';

const ProfilesListCnt = memo(({ data }) => (
    <ProfilesList
        data={data}
        showEmpty={false}
        maxCount={3}
        displaySize="xs"
    />
));

function getMenuItemConfigs(unitType, data, handleClick, t, setPopupVisible) {
    let oMenuItemPrimary = undefined;
    let oMenuItemsMore = undefined;
    let bMenuItemsMoreShow = true;
    if (data?.meta) {
        let sPrimary = "",
            sSecondary = "",
            sExclude = "";

        switch (unitType) {
            case "person_friends":
                oMenuItemPrimary = {
                    title: t("Message"),
                    icon: "ChatTeardropDots",
                    onPress: (event) => {
                        event.preventDefault();

                        (async () => {
                            let request_url = '/api.php?r=bx_messenger/get_convo_url/Services&params[]=' + JSON.stringify({'recipient': data.author_data.id});
                            const sResponse = await fetcher(request_url);
                            handleClick(event, sResponse.data);
                        })();
                    },
                };
                break;

            case "person_friends_recommendations":
                sPrimary = "befriend";
                break;

            case "person_friends_suggestion":
                sPrimary = "befriend";
                bMenuItemsMoreShow = false;
                break;

            case "browse_friend_requests":
                sPrimary = "befriend";
                break;

            case "person_friend_requested":
                sPrimary = "unfriend";
                break;

            case "person_following_recommendations":
                sPrimary = "subscribe";
                break;

            case "person_followers":
                sPrimary = "subscribe";
                sSecondary = "unsubscribe";
                break;

            case "person_following":
                sPrimary = "unsubscribe";
                break;

            default:
                oMenuItemPrimary = {
                    title: "View",
                    onPress: (event) => {
                        handleClick(event, data.url);
                    },
                };
        }

        if (!oMenuItemPrimary) {
            sExclude = sPrimary;
            oMenuItemPrimary = data.meta.items
                .filter((aItem) => aItem.name == sPrimary)
                .shift();
            if (!oMenuItemPrimary) {
                sExclude = sSecondary;
                oMenuItemPrimary = data.meta.items
                    .filter((aItem) => aItem.name == sSecondary)
                    .shift();
            }
        }

        if (!!oMenuItemPrimary) {
            if (oMenuItemPrimary?.data && oMenuItemPrimary.data?.type) {
                const Element = componentsMap[oMenuItemPrimary.data.type];
                if (!!Element) {
                    const oElementParams = {
                        ...oMenuItemPrimary.data,
                        ...{
                            primary: true,
                            params: {
                                button_rounded: false,
                                button_full_width: true,
                                on_done: (sAction, oData) => {
                                    //--- Do something after the primary action was performed.
                                },
                            },
                        },
                    };

                    oMenuItemPrimary = (
                        <Element
                            key={
                                oMenuItemPrimary.id
                                    ? oMenuItemPrimary.id
                                    : oMenuItemPrimary.name
                            }
                            {...oElementParams}
                        />
                    );
                }
            } else
                oMenuItemPrimary = (
                    <Button
                        variant="primary"
                        size="sm"
                        title={oMenuItemPrimary.title}
                        className=" my-auto "
                        startDecorator={
                            oMenuItemPrimary?.icon
                                ? oMenuItemPrimary.icon
                                : false
                        }
                        fullWidth={true}
                        onPress={oMenuItemPrimary?.onPress}
                    />
                );
        }

        //--- More menu
        oMenuItemsMore = {
            ...data.meta,
            ...{
                items: data.meta.items.filter(
                    (aItem) => aItem.name != sPrimary,
                ),
                params: {
                    showVertical: true,
                    button_size: "base",
                    button_full_width: true,
                    button_rounded: false,
                    on_do: (sAction) => {
                        setPopupVisible(false);
                    },
                },
            },
        };
    }
    return { oMenuItemPrimary: oMenuItemPrimary, oMenuItemsMore: oMenuItemsMore, bMenuItemsMoreShow: bMenuItemsMoreShow };
}

function ImageSection({ data, imageSizes }) {
    return (
        <View className=" aspect-square  sm:w-full rounded-xl overflow-hidden items-center justify-center">
            <Image
                src={data?.image?.src}
                alt={data.title}
                view="cover"
                className="absolute u-cover rounded-xl"
                sizes={imageSizes}
            />
            {!data?.image?.src && <Letter title={data.fullname} id={data.author_data.id} />}
        </View>
    );
}

export default function Unit(props) {
    const { t } = useTranslation();
    const data = props.data;
    const imageSizes = getImageSizes();
    const redirectdRef = useRef();
    const { cardData } = useCardData();
    const [popupVisible, setPopupVisible] = useState(false);

    const friendsLabel = data.mutual_friends_count > 0
        ? tp("mutual_friends", data?.mutual_friends_count, false)
        : tp("friends", data?.friends_count, false);

    const handleClick = (event, sUrl) => {
        event.preventDefault();
        redirectdRef.current.redirect(sUrl);
    };

 

    const { oMenuItemPrimary, oMenuItemsMore, bMenuItemsMoreShow } = useMemo(() => {
        return getMenuItemConfigs(props.unitType, data, handleClick, t, setPopupVisible);
    }, [props.unitType, data, handleClick, t]);

    const isFollowers = props.unitType == "person_followers" || props.unitType == "person_following" || props.unitType == "person_following_recommendations" ? true : false;

    if (!!cardData?.hidden && props.unitType == "person_friends_recommendations")
        return;

    return (
        <>
            <Redirect ref={redirectdRef} />
            <Card margin=" mb-[1px] sm:m-2 " border=" border-none shadow-none sm:shadow "  rounded=" sm:rounded-2xl ">
                <Link className="group " href={data.url}>
                    <View className="flex-row  sm:flex-col p-4 sm:p-1 h-32 sm:h-full">
                        <ImageSection data={data} imageSizes={imageSizes} />
                        <View className="flex-col pl-4 sm:p-3 sm:h-32 flex-auto items-between justify-between ">
                            <View className='flex-auto mb-auto'>
                                <Text numberOfLines={1} className=" mb-2 text-lg leading-tight tracking-tight font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-primary group-hover:dark:text-primary-d">
                                    {data.title}
                                </Text>
                                <Row className="items-center  mb-2">
                                    <View className="mr-2">
                                        <ProfilesListCnt data={isFollowers ? data.followers_list : (data.mutual_friends_count > 0 ? data.mutual_friends_list : data.friends_list)} />
                                    </View>
                                    <Text className="truncate text-sm leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                        {isFollowers ? data?.followers_count + " followers" : friendsLabel}
                                    </Text>
                                </Row>
                            </View>
                            <View className="flex-row w-full  ">
                                {oMenuItemPrimary}
                                {bMenuItemsMoreShow && !!oMenuItemsMore &&
                                    oMenuItemsMore.items.length > 0 && (
                                        <MoreMenu oMenuItemsMore={oMenuItemsMore} data={data} popupVisible={popupVisible} setPopupVisible={setPopupVisible}/>
                                    )}
                            </View>
                        </View>
                    </View>
                </Link>
            </Card>
        </>
    );
}
