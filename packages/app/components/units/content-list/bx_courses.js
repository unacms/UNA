import { useState, useContext, useRef } from 'react'
import { useCardData } from 'app/context/card'
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
import Progress from 'app/ui/atoms/progress'
import { useTranslation } from 'react-i18next';
import MoreMenu from 'app/components/nav/menu-more'

export default function Unit(props) {
    const { t } = useTranslation();
    const data = props.data;
    const imageSizes = getImageSizes();

    const [popupVisible, setPopupVisible] = useState(false);

    const { cardData } = useCardData();

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
            return <BaseUnit data={data} imageSizes={imageSizes} oMenuItemPrimary={oMenuItemPrimary} oMenuItemsMore={oMenuItemsMore} bMenuItemsMoreShow={bMenuItemsMoreShow} />
        default:
            return <BaseUnit data={data} imageSizes={imageSizes} oMenuItemPrimary={oMenuItemPrimary} oMenuItemsMore={oMenuItemsMore} bMenuItemsMoreShow={bMenuItemsMoreShow} />
    }
}

function BaseUnit({ data, imageSizes, oMenuItemPrimary, oMenuItemsMore, bMenuItemsMoreShow }) {
    const persents = 56
    const buttonCaption = "Продолжить";
    const m_counter = [5, 10];
    const l_counter = [10, 40];
    return (
        <>
            <Card margin="m-2" rounded="rounded-2xl">
                <Link className="course " href={data.url} >
                    <View className="flex-col p-4  flex-auto items-between justify-between h-52 ">
                        <View >
                        <Row className='w-full mb-4'>
                            <View className='w-4/5'>
                                <Row className='mb-2'>
                                    <Progress value={persents} />   
                                </Row>
                                <Text className={"text-xs"}>Пройдено {persents}%</Text>
                            </View>
                            <View className="flex-row w-full ">
                                {(bMenuItemsMoreShow && !!oMenuItemsMore &&
                                    oMenuItemsMore.items.length > 0) && (
                                        <MoreMenu oMenuItemsMore={oMenuItemsMore} data={data} popupVisible={popupVisible} setPopupVisible={setPopupVisible} />
                                    )}
                            </View>
                        </Row>
                        <Text
                            numberOfLines={2}
                            className=" text-lg leading-tight tracking-tight font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary group-hover:dark:text-primary-d"
                        >
                            {data.title}
                        </Text>
                        </View>
                        <Row className='gap-x-2 justify-between w-full '>
                            <Row className='gap-x-2 items-end'>
                                <Button variant="outline" title={`${m_counter[0]}/${m_counter[1]} modules`} size="xs" rounded />
                                <Button variant="outline" title={`${l_counter[0]}/${l_counter[1]} lessons`} size="xs" rounded />
                            </Row>
                            <Button variant="primary" title={buttonCaption} size="sm" rounded />
                        </Row>
                    </View>
                </Link>
            </Card>
        </>
    );
}

