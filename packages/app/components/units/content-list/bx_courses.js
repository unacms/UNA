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
            .filter((aItem) => aItem.primary == true)
            .shift();
        if (!oMenuItemPrimary) {
            oMenuItemPrimary = {
                title: "View",
                onPress: (event) => {
                    handleClick(event, data.url);
                },
            };
        }
        

        if (oMenuItemPrimary) {
            if (oMenuItemPrimary?.data && oMenuItemPrimary.data?.type) {
                const Element = componentsMap[oMenuItemPrimary.data.type];
                if (!!Element) {
                    const oElementParams = {
                        ...oMenuItemPrimary.data,
                        ...{
                            params: {
                                button_rounded: true,
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
                        rounded = {true}
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
                    (aItem) => aItem.primary != true,
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

    if (
        !!cardData?.hidden &&
        props.unitType == "person_friends_recommendations"
    )
        return;

    switch (props.unitType) {
        case 'search':
            return <BaseUnit data={data} popupVisible={popupVisible} setPopupVisible={setPopupVisible} imageSizes={imageSizes} oMenuItemPrimary={oMenuItemPrimary} oMenuItemsMore={oMenuItemsMore} bMenuItemsMoreShow={bMenuItemsMoreShow} />
        default:
            return <BaseUnit data={data} popupVisible={popupVisible} setPopupVisible={setPopupVisible} imageSizes={imageSizes} oMenuItemPrimary={oMenuItemPrimary} oMenuItemsMore={oMenuItemsMore} bMenuItemsMoreShow={bMenuItemsMoreShow} />
    }
}

function BaseUnit({ data, imageSizes, oMenuItemPrimary, oMenuItemsMore, bMenuItemsMoreShow, popupVisible,setPopupVisible  }) {
    const persents = data.percent;
    const buttonCaption = data.pass_title;
    return (
        <>
            <Card margin="m-2" rounded="rounded-2xl bg-gray-400 hover:bg-indigo-400">
                <Link className="course " href={data.url} >
                    <View className="flex-col p-4  flex-auto items-between justify-between h-52 ">
                        <View >
                            <Row className='w-full mb-4 justify-end items-center'>
                                {persents !== undefined  && <View className='flex-auto'>
                                    <Row className='mb-1'>
                                        <Progress value={persents} />
                                    </Row>
                                    <Text className={"text-xs text-white"}>Пройдено {persents}%</Text>
                                </View>}
                                <View className="flex-row  justify-end w-10 items-center h-8">
                                    {(bMenuItemsMoreShow && !!oMenuItemsMore &&
                                        oMenuItemsMore.items.length > 0) && (
                                            <MoreMenu defaultButtonProps={{ variant:"outline",
                                                size:"xs",
                                                startDecorator:"DotsThreeOutline",
                                                rounded:true
                                                }}
                                                oMenuItemsMore={oMenuItemsMore} setPopupVisible={setPopupVisible} data={data} popupVisible={popupVisible} setPopupVisible={setPopupVisible} />
                                        )}
                                </View>
                            </Row>
                            <Text
                                numberOfLines={2}
                                className="text-white text-lg leading-tight tracking-tight font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary group-hover:dark:text-primary-d"
                            >
                                {data.title}
                            </Text>
                        </View>
                        <Row className='gap-x-2 justify-between w-full '>
                            <Row className='gap-x-2 items-end'>
                                {data.counters.map((item, index) => {
                                    return (
                                        <Button key={`counter-${index}`}  bgColor={`bg-white`} variant="outline" title={`${item.progress || item.total} ${item.title}`} size="xs" rounded />
                                    )

                                })}
                            </Row>
                            {/*data.show_pass && <Button variant="primary" title={buttonCaption} size="sm" rounded />*/}
                            <View className="flex-row">
                                    {oMenuItemPrimary}
                            </View>
                        </Row>
                    </View>
                </Link>
            </Card>
        </>
    );
}

