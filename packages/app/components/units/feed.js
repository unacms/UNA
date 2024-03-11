import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import Time from 'app/ui/atoms/time'
import Profile from 'app/ui/molecules/profile'
import React, { memo, useState, useMemo, useEffect } from 'react'
import { useCurrentUser } from 'app/context/user'
import Html from 'app/ui/atoms/html'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { StyleSheet } from 'react-native'
import { Platform, Image as ImageNative } from 'react-native'
import { Button } from 'app/design/controls'
import Menu from 'app/components/menu'
import { truncateHTML, stripTags, menuItemsByName, FeedbackHaptics, appSetting, linkify2 } from 'app/lib/util'
import dynamic from 'next/dynamic'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { fetcher } from 'app/lib/fetcher'
import Form from 'app/components/elements/form'
import useSWR from 'swr'
import { componentsMap } from 'app/ui/molecules/_map'
import Card from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/molecules/animated-block'
import { useTranslation } from 'react-i18next';
import { CommentsBrowse } from 'app/lib/comments-helpers'
import { Pressable } from 'dripsy'
import { ContentMore } from 'app/ui/molecules/contentmore';

const CommentsSection = React.memo(({ commentsData, data, isShowMoreComments, url, capt }) => (
    <View>
        <CommentsBrowse maxCount={2} browse={commentsData} module={data?.cmts.module} isShort={true} />
        {isShowMoreComments && (
            <View className='px-4 pb-4'>
                <Link href={url}>
                    <Text className='text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-neutral-50 hover:underline font-semibold'>
                        {capt}
                    </Text>
                </Link>
            </View>
        )}
    </View>
));


const ItemInfo = ({ data }) => {
    const OwnersList = () => data.owners?.length > 0 && data.owners.map((item, index) => (
        <React.Fragment key={'owner' + index}>
            <Text className="text-neutral-500"> · </Text>
            <Link href={item.url} emulate={true}>
                <Text className="text-neutral-500 hover:text-linkhover text-ellipsis overflow-hidden font-medium" numberOfLines={1}>
                    {item.title}
                </Text>
            </Link>
        </React.Fragment>
    ));

    const FeedType = () => {
        const { t } = useTranslation();
        const l = t('feed_type_' + data.type);
        return l && (
            <>
                <Text className="text-neutral-500"> · </Text>
                <Text className="text-neutral-500 text-ellipsis overflow-hidden whitespace-nowrap nowrap">
                    {l}
                </Text>
            </>
        );
    };

    return (
        <>
            <FeedType />
            <OwnersList />
        </>
    );
};

function DefaultUnit(data) {


    if (data.type == 'timeline_common_repost') {
        return <></>; //NEED TO FIX
    }
    const { t } = useTranslation();
    const capt = t('View more comments...');
    let { currentUser, setCurrentUser } = useCurrentUser()
    const [viewState, setViewState] = useState({ view: '' })
    const [postData, setPostData] = useState(null)
    const [showFull, setShowFull] = useState(false)
    const [imageAspect, setImageAspect] = useState('aspect-square bg-blue-500/50')

    if (data.sFirstImg) {
        ImageNative.getSize(data.sFirstImg, (width, height) => {
            if (width > height)
                setImageAspect('aspect-video')
        })
    }

    let styles = StyleSheet.create({})

    if (Platform.OS != 'web') {
        styles = StyleSheet.create({
            card_image: {
                borderRadius: 0,
            },
        })
    }

    let url = data.url.includes('://') ? data.url : '/' + data.url
    let bIsTimelineContent = data?.type?.includes('timeline') ? true : false
    let bIsGroupContent = (data.type == 'bx_groups' || data.type == 'bx_events') && data.action == 'added'
    let bIsMarketContent = (data.type == 'bx_market') && data.action == 'added'
    let bIsAddContent = (data.type == 'bx_ads') && data.action == 'added'
    let bIsTitle = data?.content?.title && data?.content?.title?.trim() != ''


    let { data: dynamicData, error } = useSWR(
        postData ? ['/api.php?r=bx_timeline/get_edit_form/&params[]=' + data.id, '', postData] : null,
        fetcher,
        !true ? undefined : { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }
    )

    if (dynamicData?.data?.item) {
        data = dynamicData.data.item
    }

    const onFormSubmit = (formData, d) => {
        setViewState({ view: '' })
        setPostData(formData)
    }

    const handleMenuManageSelect = async (oItem, event) => {
        switch (oItem.name) {
            case 'item-edit':
                const result1 = await fetcher(
                    '/api.php?r=bx_timeline/get_edit_form/&params[]=' + data.id
                )
                setViewState({ view: 'edited', data: result1.data.form })
                break

            case 'item-delete':
                const result = await fetcher(
                    '/api.php?r=bx_timeline/delete/&params[]=' + data.id
                )
                setViewState({ view: 'deleted' })
                break
        }
    }



    const aMenuManageItems = !!currentUser ? data?.menu_manage && menuItemsByName(data.menu_manage?.object, data.menu_manage?.items, currentUser).map(
        (aItem) => {
            return {
                id: aItem.id ? aItem.id : aItem.name,
                name: aItem.name,
                link: aItem.link,
                title: aItem.title,
            }
        }
    ) : []


    let commentsData = null;
    let isShowMoreComments = false;
    if (data?.cmts?.data?.length > 0) {
        commentsData = { id: 'cmt_list', insert: 'before', 'type': 'browse', 'data': data.cmts };
        if (data?.cmts.total_count > data?.cmts?.data?.length) {
            isShowMoreComments = true;
        }
    }

    let linkForAd = (
        <Link href={url}>
            <Text className="mr-auto  bg-primary-100 dark:bg-primary-900 rounded-lg font-semibold px-2 py-1 flex-none flex-auto text-neutral-800 dark:text-neutral-200">
                {data.content.price ? data.content.price.replace("&#36;", "$") : 'Free'}
            </Text>
            <Text
                numberOfLines={2}
                className=" mt-1 text-neutral-950 hover:text-primary dark:text-neutral-50 hover:text-primary-d text-xl tracking-tight font-bold"
            >
                {data.content.title}
            </Text>
        </Link>
    );
    if (data?.content?.register_click) {
        linkForAd = <Pressable onPress={async () => { await fetcher('/api.php?r=' + data.content.register_click) }} >{linkForAd}</Pressable>
    }

    //May be improvement needed
    useEffect(() => {
        (async () => {
            if (data?.content?.register_impression) {
                await fetcher('/api.php?r=' + data.content.register_impression);
            }
        })();
    }, []);

    let content_attach = [];
    if (data.content.images_attach && data.content.images_attach.length > 0) {
        content_attach = content_attach.concat(data.content.images_attach);
    }
    if (data.content.videos_attach && data.content.videos_attach.length > 0) {
        content_attach = content_attach.concat(data.content.videos_attach);
    }

    if (viewState.view == 'deleted')
        return <></>

    const MenuMemo = memo(() => (
        <Menu
            {...data.menu_actions}
            displayType="button"
            params={{
                show_action: true,
                show_counter: true,
                show_combined: true,
            }}
        />

    ));


    return (
        <AnimatedBlock>
            <Card rounded=' rounded-none sm:rounded-2xl ' border=" sm:border border-bdrcard dark:border-bdrcard-d" margin=' mb-2 sm:mb-4 sm:mx-4 ' addClassName='lg:p-2' >
                <View className="flex-auto flex-row items-top p-4">
                    <View className='flex-auto overflow-hidden'>
                        <Profile
                            {...data.author_data}
                            showLink={true}
                            displayType="unit"
                            displaySize="base"
                            showInfo={
                                <Row className="items-center">
                                    <View>
                                        <Link href={url}>
                                            <Time stylesNameAdd=" hover:text-linkhoverneutral" ts={data.date}></Time>
                                        </Link>
                                    </View>
                                    <Row className='  '>
                                        <ItemInfo data={data} />
                                    </Row>
                                </Row>
                            }
                        />
                    </View>
                    <View className="flex-auto justify-end flex-row mb-auto">
                        {data.author_actions.map((item, index) => {
                            const Element = componentsMap[item.type]
                            if (!Element) return

                            return <Element key={`action-${index}`} {...item} />
                        })}
                        {aMenuManageItems?.length > 0 && (
                            <View className="flex-none ml-2">
                                <DropdownMenu
                                    items={aMenuManageItems}
                                    onSelect={handleMenuManageSelect}
                                >
                                    <Button
                                        variant="text"
                                        size="sm"
                                        rounded
                                        startDecorator="DotsThreeOutline"
                                        onPress={() => {
                                            FeedbackHaptics('Medium')
                                        }}
                                    />
                                </DropdownMenu>
                            </View>
                        )}
                    </View>
                </View>

                <View className="flex-col ">
                    {viewState.view == 'edited' && (
                        <View className="w-full">
                            <Form
                                {...viewState.data}
                                classContainerName="flex-row flex-wrap px-2 w-full items-start justify-between"
                                onFormSubmit={onFormSubmit}
                            />
                            <View className="mx-4 mb-4">
                                <Button
                                    title="Cancel"
                                    fullWidth
                                    size="base"
                                    startDecorator="X"
                                    variant="outline"
                                    onPress={() => setViewState({ view: '' })}
                                />
                            </View>
                        </View>
                    )}
                    {bIsMarketContent && (
                        <View className=" flex-col md:flex-row space-x-2 mx-0.5 sm:mx-4 overflow-hidden rounded-lg border border-bdritem dark:border-bdritem-d bg-bgritem dark:bg-bgritem-d p-1">
                            {data.mainImage && (
                                <View className="w-full md:w-1/3  ">
                                    <View
                                        className="w-full aspect-video   "
                                        style={styles.card_image}
                                    >
                                        <Image
                                            {...data.mainImage}
                                            alt={data.title}
                                            view="cover"
                                            className=" rounded u-cover "
                                            sizes="(max-width:768px) 100vw, 500px"
                                        />
                                    </View>
                                </View>
                            )}
                            <View className="flex-auto p-2 my-auto flex-col    ">
                                <Link href={url} className="">
                                    <Text className="mr-auto  bg-primary-100 dark:bg-primary-900 rounded-lg font-semibold px-2 py-1 flex-none flex-auto text-neutral-800 dark:text-neutral-200">
                                        {data.price_recurring > 0 ? data.price_recurring + '$/' + data.duration_recurring : (data.price_single > 0 ? data.price_single + '$' : 'Free')}
                                    </Text>

                                    <Text
                                        numberOfLines={2}
                                        className=" mt-1 text-neutral-950 hover:text-primary dark:text-neutral-50 hover:text-primary-d text-xl tracking-tight font-bold"
                                    >
                                        {data.content.title}
                                    </Text>
                                </Link>
                                {!showFull ? (
                                    <View>
                                        <View className="flex-col gap-y-3 relative">
                                            <Text
                                                className="text-neutral-950 dark:text-neutral-50  text-sm "
                                                numberOfLines={3}
                                            >
                                                {data.content.text}
                                            </Text>
                                        </View>
                                        {!!data.sFirstImg && (
                                            <View
                                                className={
                                                    imageAspect + ' w-full rounded mt-4 overflow-hidden'
                                                }
                                            >
                                                <Image
                                                    src={data.sFirstImg}
                                                    alt={data.title}
                                                    view="cover"
                                                />
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <View className="flex-col relative">
                                        <Html data={data.content.text} />
                                    </View>
                                )}
                            </View>
                        </View>
                    )
                    }
                    {bIsAddContent && (
                        <View className=" flex-col md:flex-row space-x-2 mx-0.5 sm:mx-4 overflow-hidden rounded-lg border border-bdritem dark:border-bdritem-d bg-bgritem dark:bg-bgritem-d p-1">
                            {data.mainImage && (
                                <View className="w-full md:w-1/3  ">
                                    <View
                                        className="w-full aspect-video   "
                                        style={styles.card_image}
                                    >
                                        <Image
                                            {...data.mainImage}
                                            alt={data.title}
                                            view="cover"
                                            className=" rounded u-cover "
                                            sizes="(max-width:768px) 100vw, 500px"
                                        />
                                    </View>
                                </View>
                            )}
                            <View className="flex-auto p-2 my-auto flex-col">
                                {linkForAd}
                                {!showFull ? (
                                    <View>
                                        <View className="flex-col gap-y-3 relative">
                                            <Text
                                                className="text-neutral-950 dark:text-neutral-50  text-sm "
                                                numberOfLines={3}
                                            >
                                                {data.content.text}
                                            </Text>
                                        </View>
                                        {!!data.sFirstImg && (
                                            <View
                                                className={
                                                    imageAspect + ' w-full rounded mt-4 overflow-hidden'
                                                }
                                            >
                                                <Image
                                                    src={data.sFirstImg}
                                                    alt={data.title}
                                                    view="cover"
                                                />
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <View className="flex-col relative">
                                        <Html data={data.content.text} />
                                    </View>
                                )}
                            </View>
                        </View>
                    )
                    }
                    {bIsGroupContent && (
                        <View className=" flex-col md:flex-row space-x-2 mx-0.5 sm:mx-4 overflow-hidden rounded-lg border border-bdritem dark:border-bdritem-d bg-bgritem dark:bg-bgritem-d p-1">
                            {data.mainImage && (
                                <View className="w-full md:w-1/3  ">
                                    <View
                                        className="w-full aspect-video   "
                                        style={styles.card_image}
                                    >
                                        <Image
                                            {...data.mainImage}
                                            alt={data.title}
                                            view="cover"
                                            className=" rounded u-cover "
                                            sizes="(max-width:768px) 100vw, 500px"
                                        />
                                    </View>
                                </View>
                            )}
                            <View className="flex-auto px-2  pb-2 my-auto flex-col    ">
                                <Link href={url} className="">
                                    <Text
                                        numberOfLines={1}
                                        className="  text-neutral-600 dark:text-neutral-400 text-xs uppercase  tracking-tight"
                                    >
                                        {data.content.visibility != '3' ? (
                                            <>PRIVATE</>
                                        ) : (
                                            <>PUBLIC</>
                                        )}
                                        {data.content.members > -1 && (
                                            <> · {data.content.members} MEMBERS </>
                                        )}
                                        {data.content.date_start && (
                                            <>
                                                {' '}
                                                ·{' '}
                                                <Time
                                                    stylesName="text-xs flex-none"
                                                    ts={data.content.date_start}
                                                ></Time>
                                                {data.content.date_end && (
                                                    <>
                                                        -{' '}
                                                        <Time
                                                            stylesName="text-xs flex-none"
                                                            ts={data.content.date_end}
                                                        ></Time>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </Text>
                                    <Text
                                        numberOfLines={2}
                                        className=" mt-1 text-neutral-950 hover:text-primary dark:text-neutral-50 hover:text-primary-d text-xl tracking-tight font-bold"
                                    >
                                        {data.content.title}
                                    </Text>
                                </Link>
                                {!showFull ? (
                                    <View>
                                        <View className="flex-col gap-y-3 relative">
                                            <Text
                                                className="text-neutral-950 dark:text-neutral-50  text-sm "
                                                numberOfLines={2}
                                            >
                                                {data.content.text}
                                            </Text>
                                        </View>
                                        {!!data.sFirstImg && (
                                            <View
                                                className={
                                                    imageAspect + ' w-full rounded mt-4 overflow-hidden'
                                                }
                                            >
                                                <Image
                                                    src={data.sFirstImg}
                                                    alt={data.title}
                                                    view="cover"
                                                />
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <View className="flex-col relative">
                                        <Html data={data.content.text} />
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {viewState.view != 'edited' && (
                        <>
                            {!bIsGroupContent && !bIsMarketContent && !bIsAddContent && (
                                <>
                                    <View className="  flex-col md:flex-row-reverse ">
                                        {data.mainImage && (
                                            <View className="w-full px-0.5 sm:px-4 md:w-64 mb-3 md:mb-auto md:pr-4 ">
                                                <View
                                                    className="w-full aspect-video    "
                                                    style={styles.card_image}
                                                >
                                                    <Image
                                                        {...data.mainImage}
                                                        alt={data.title}
                                                        view="cover"
                                                        className=" u-cover rounded-xl "
                                                        sizes="(max-width:768px) 100vw, 500px"
                                                    />
                                                </View>
                                            </View>
                                        )}
                                        <View className="flex-auto px-4 my-auto flex-col    ">
                                            {bIsTitle && (
                                                <Link href={url} className="">
                                                    <Text
                                                        numberOfLines={2}
                                                        className="  text-neutral-950 hover:text-primary dark:text-neutral-50 hover:text-primary-d text-xl tracking-tight font-bold"
                                                    >
                                                        {data.content.title}
                                                    </Text>
                                                </Link>
                                            )}
                                            {!showFull ? (
                                                <View>
                                                    <View className="flex-col gap-y-3 relative">
                                                        {bIsTimelineContent && (
                                                            <View className={'bg-red-500 ' + data.content.text && content_attach.length > 0 ? 'pb-3' : ''}>
                                                                <ContentMore showLink={data?.content?.images_attach?.length == 0} content={data.content.text} numberOfLines={3} openSmall={false} textClassName="font-default text-base text-neutral-600 dark:text-neutral-400" />
                                                            </View>
                                                        )}
                                                        {!bIsTimelineContent && (
                                                            <Text
                                                                className="text-neutral-950 dark:text-neutral-50 pt-2 text-sm sm:text-base"
                                                                numberOfLines={2}
                                                            >
                                                                {data.content.text}
                                                            </Text>
                                                        )}
                                                    </View>
                                                    {!!data.sFirstImg && (
                                                        <View
                                                            className={
                                                                imageAspect +
                                                                ' w-full rounded mt-4 overflow-hidden'
                                                            }
                                                        >
                                                            <Image
                                                                src={data.sFirstImg}
                                                                alt={data.title}
                                                                view="cover"
                                                            />
                                                        </View>
                                                    )}
                                                </View>
                                            ) : (
                                                <View className="flex-col relative">
                                                    <HtmlMemo tlContent={data.content.text} />
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    {bIsTimelineContent && (
                                        <View className="">
                                            <UnitImages images={data.content.images_attach} />
                                        </View>
                                    )}
                                </>
                            )}
                            <View className="flex-col relative px-0 py-4">
                                <View className=" flex-row    px-4 flex-auto">
                                    <MenuMemo />
                                </View>
                            </View>
                        </>
                    )}
                </View>
                {commentsData && <CommentsSection capt={capt} commentsData={commentsData} data={data} isShowMoreComments={isShowMoreComments} url={url} />}
            </Card>
        </AnimatedBlock>
    )
}

function SmallUnit(data) {
    let url = '/' + data.url
    return (
        <AnimatedBlock>
            <Link href={url} className="w-full" emulate={true}>
                <Card addClassName='group  active:opacity-50 active:translate-y-1 flex-row px-3 py-2 sm:p-3' rounded="rounded-none sm:rounded-2xl" margin=" -mb-[1px] sm:mx-4 sm:mb-2 ">
                    <View className="w-12 h-12 mr-2 rounded-full flex-none bg-secondary-500/10">
                        <Profile
                            {...data.author_data}
                            displayType="unit_wo_info"
                            displaySize="base"
                        />
                    </View>
                    <View className="flex-auto flex-col my-auto ">
                        <View className="flex-row gap-x-2">
                            <Text className="text-xs flex-auto font-semibold text-neutral-800 dark:text-neutral-200">
                                {data.author_data.display_name}
                            </Text>
                            <Time className="text-xs flex-none" ts={data.date}></Time>
                        </View>
                        <Text className="flex-auto text-base  font-bold text-neutral-800 dark:text-neutral-200 sm:group-hover:text-neutral-950 sm:dark:group-hover:text-neutral-50" numberOfLines={1}>
                            {data.content.title}
                        </Text>
                        <View className="flex-row w-full items-end content-end">
                            <Text
                                className="flex-auto mr-2 text-sm text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-neutral-50"
                                numberOfLines={1}
                            >
                                {data.plainText}{stripTags(data.content.text)}
                            </Text>
                            <View className="flex-none bg-primary dark:bg-primary-d rounded-full    my-auto h-min px-1.5">
                                {data.cmts.count > 0 && (
                                    <Text className="text-xs text-white dark:text-black font-medium">
                                        {data.cmts.count}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                </Card>
            </Link>
        </AnimatedBlock>
    )
}

function CarouselMemo({ aImg, b }) {
    const computedData = useMemo(() => {
        const Carousel = React.memo(
            dynamic(() => import('app/ui/molecules/carousel'))
        )
        return <Carousel data={aImg} />
    }, [b])
    return computedData
}

function HtmlMemo({ tlContent }) {
    const computedData = useMemo(() => {
        return <Html data={tlContent} />
    }, [tlContent])
    return computedData
}

function UnitImages(images) {
    if (images?.images?.length == 0)
        return <></>

    let aImg = images?.images.map((obj) => {
        return {
            src: obj.src_orig,
            type: 'image',
        }
    })

    return (
        <View className="w-full ">
            <CarouselMemo aImg={aImg} />
        </View>
    )
}

export default function UnitFeed(props) {
    let data = props.data

    data.mainImage = null
    if (data?.content?.images)
        data.mainImage = data?.content?.images?.length > 0 ? data.content.images[0] : null

    data.comments = null
    if (data?.cmts?.data?.length > 0) {
        data.comments = data.cmts.data[0][Object.keys(data.cmts.data[0])[0]].data
    }

    data.showMore = true
    let unit = props.mode == 'small' ? SmallUnit(data) : DefaultUnit(data)

    return <>{unit}</>
}
