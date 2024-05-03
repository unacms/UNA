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
import MoreMenu from 'app/components/nav/menu-more'

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
        //--- Primary button
        let sPrimary = "join";
        if (props.module == "bx_channels") sPrimary = "subscribe";
        oMenuItemPrimary = data.meta.items
            .filter((aItem) => aItem.name == sPrimary)
            .shift();
        if (!oMenuItemPrimary) {
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
                                button_hide_title_on_small: false,
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
    const friendsLabel = data.members_count > 0 ? tp("members", data?.members_count) : ''

    if (
        !!cardData?.hidden &&
        props.unitType == "person_friends_recommendations"
    )
        return;

    switch (props.unitType) {
        case 'search':
            return getSearch();
        default:
            return getBase();
    }

    function getBase() {
        return (
            <>
                <Redirect ref={redirectdRef} />
                <Card margin="m-2" rounded="rounded-2xl">
                    <Link className="group " href={data.url}>
                        <View className="flex-row sm:flex-col p-1">
                            <View className="aspect-square sm:aspect-video w-1/3 sm:w-full rounded-xl overflow-hidden items-center justify-center">
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
                                <View className="flex-row w-full ">
                                    {oMenuItemPrimary}
                                    {(bMenuItemsMoreShow && !!oMenuItemsMore &&
                                        oMenuItemsMore.items.length > 0) && (
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

    function getSearch() {
        return (
            <>
                <Redirect ref={redirectdRef} />
                <Card margin="m-2" rounded="rounded-2xl">
                    <Link className="group " href={data.url}>
                        <View className="flex-row sm:flex-col p-1">

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
}
