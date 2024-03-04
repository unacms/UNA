import { useState, useContext, useRef } from 'react'
import { CardData } from 'app/context/card'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import Profile from 'app/ui/molecules/profile'
import { getImageSizes, FeedbackHaptics, tp, t } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Menu from 'app/components/menu'
import Card from 'app/ui/molecules/card'
import { Button, Modal } from 'app/design/controls'
import Redirect from 'app/ui/atoms/redirect'
import { componentsMap } from 'app/ui/molecules/_map'
import ProfilesList from 'app/ui/molecules/profile_list'
import { useTranslation } from 'react-i18next';
import Letter from 'app/ui/atoms/letter'

export default function Unit(props) {
    const { t } = useTranslation();
    const data = props.data;
    const imageSizes = getImageSizes();
    const redirectdRef = useRef();
    const [popupVisible, setPopupVisible] = useState(false);

    const { cardData, setCardData } = useContext(CardData);

    const handleClick = (event, sUrl) => {
        event.preventDefault();

        redirectdRef.current.redirect(sUrl);
    };

    const handleClickMore = (event) => {
        event.preventDefault();

        FeedbackHaptics("Medium");
        setPopupVisible(true);
    };

    let oMenuItemPrimary = undefined;
    let oMenuItemsMore = undefined;
    let bMenuItemsMoreShow = true;
    if (data?.meta) {
        let sPrimary = "",
            sSecondary = "",
            sExclude = "";

        switch (props.unitType) {
            case "person_friends":
                oMenuItemPrimary = {
                    title: t("Message"),
                    icon: "ChatTeardropDots",
                    onPress: (event) => {
                        handleClick(event, "/messenger");
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
    const friendsLabel =
        data.mutual_friends_count > 0
            ? tp("mutual_friends", data?.mutual_friends_count, false)
            : tp("friends", data?.friends_count, false);

    if (
        !!cardData?.hidden &&
        props.unitType == "person_friends_recommendations"
    )
        return;

    return (
        <>
            <Redirect ref={redirectdRef} />
            <Card margin=" mx-2 mb-2 " rounded=" rounded-2xl ">
                <Link className="group " href={data.url}>
                    <View className="flex-col p-1">
                        <View className=" aspect-square w-full rounded-xl overflow-hidden items-center justify-center ">
                            <Image
                                src={data?.image?.src}
                                alt={data.title}
                                view="cover"
                                className=" absolute u-cover rounded-xl"
                                sizes={imageSizes}
                            />
                            {!data?.image?.src && <Letter title={data.fullname}/>}
                        </View>
                        <View className="flex-col p-3 flex-auto items-between h-36 justify-between ">
                            <View>
                                <Text
                                    numberOfLines={1}
                                    className=" text-lg leading-tight tracking-tight font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary group-hover:dark:text-primary-d"
                                >
                                    {data.title}
                                </Text>
                                <Row className="items-center h-6 my-3">
                                    {props.unitType == "person_followers" ||
                                        props.unitType == "person_following" ||
                                        props.unitType ==
                                        "person_following_recommendations" ? (
                                        <>
                                            <View className="mr-2">
                                                <ProfilesList
                                                    data={data.followers_list}
                                                    showEmpty={false}
                                                    maxCount={3}
                                                    displaySize="xs"
                                                />
                                            </View>
                                            <Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                                {data?.followers_count +
                                                    " followers"}
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <View className="mr-2 h-6">
                                                {data.mutual_friends_count > 0 ? (
                                                    <ProfilesList
                                                        data={
                                                            data.mutual_friends_list
                                                        }
                                                        showEmpty={false}
                                                        maxCount={3}
                                                        displaySize="xs"
                                                    />
                                                ) : (
                                                    <ProfilesList
                                                        data={data.friends_list}
                                                        showEmpty={false}
                                                        maxCount={3}
                                                        displaySize="xs"
                                                    />
                                                )}

                                            </View>
                                            {
                                                <Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                                    {friendsLabel}
                                                </Text>
                                            }
                                        </>
                                    )}
                                </Row>
                            </View>
                            <View className="flex-row w-full ">
                                {oMenuItemPrimary}
                                {bMenuItemsMoreShow && !!oMenuItemsMore &&
                                    oMenuItemsMore.items.length > 0 && (
                                        <View className='ml-2'>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className=" my-auto "
                                                startDecorator="DotsThreeOutline"
                                                onPress={(event) =>
                                                    handleClickMore(event)
                                                }
                                            />
                                            <Modal
                                                key="more-popup"
                                                onVisible={popupVisible}
                                                onClose={() => {
                                                    setPopupVisible(false);
                                                }}
                                            >
                                                <View className="gap-y-4">
                                                    <View className="flex-row items-center gap-x-4">
                                                        <Profile
                                                            display_type="unit"
                                                            display_name={
                                                                data.title
                                                            }
                                                            url={data.url}
                                                            url_avatar={
                                                                data?.image?.src
                                                            }
                                                            showInfo={false}
                                                        />
                                                    </View>
                                                    <View>
                                                        <Menu
                                                            displayType="mixed"
                                                            {...oMenuItemsMore}
                                                        />
                                                    </View>
                                                </View>
                                            </Modal>
                                        </View>
                                    )}
                            </View>
                        </View>
                    </View>
                </Link>
            </Card>
        </>
    );
}
