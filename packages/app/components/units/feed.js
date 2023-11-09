import Image from '../../ui/atoms/image'
import Link from '../../ui/atoms/link'
import Time from '../../ui/atoms/time'
import Profile from '../../ui/molecules/profile'
import { useState, useMemo } from 'react'
import { useCurrentUser } from 'app/context/user'
import Html from '../../ui/atoms/html'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { StyleSheet } from 'react-native'
import { Platform, Image as ImageNative } from 'react-native'
import { Button } from 'app/design/controls'
import Menu from '../menu'
import { truncateHTML, stripTags, menuItemsByName, FeedbackHaptics, appSetting, linkify2 } from 'app/lib/util'
import dynamic from 'next/dynamic'
import React from 'react'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { fetcher } from '../../lib/fetcher'
import Form from 'app/components/elements/form'
import useSWR from 'swr'
import { componentsMap } from 'app/ui/molecules/_map'
import Card from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/molecules/animated-block'
import { useTranslation } from 'react-i18next';
import { CommentsBrowse } from 'app/lib/comments-helpers'

function DefaultUnit(data) {
    const { t } = useTranslation();
    
    if ( data.type == 'timeline_common_repost'){
        return <></>; //NEED TO FIX
    }

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

    let url = '/' + data.url
    let bIsTimelineContent = data?.type?.includes('timeline') ? true : false
    let bIsGroupContent = (data.type == 'bx_groups' || data.type == 'bx_events') && data.action == 'added'
    let bIsMarketContent = (data.type == 'bx_market') &&  data.action == 'added'
    let bIsAddContent = (data.type == 'bx_ads') &&  data.action == 'added'
    let bIsTitle = data?.content?.title && data?.content?.title?.trim() != ''
    let sShort = truncateHTML(data.content.text, 380)
    let sLong = truncateHTML(data.content.text, 10000000)

    let bIsLong = data?.content?.text && stripTags(sShort.trim()) != stripTags(sLong.trim())

    //TODO EDIT TIMELINE
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

    const ItemInfo = ({ data }) => {

        let inList = <></>
        if (data.owners?.length > 0){
            inList = <>
                <Text className="text-neutral-500  text-xs"> in </Text>
                {
                    data.owners.map((item, index) => {
                        return (
                            <Link key = {'owner' + index} href={item.url} emulate={true}>
                                <Text className="text-neutral-500  text-xs">{item.title}</Text>
                            </Link>
                        );
                    })
                }
            </>
        }

        let l = t('feed_type_' + data.type)
        
            if (l != ' ')
                return (
                    <View className="ml-1">
                        <Text className="text-neutral-500  text-xs">
                        {l}
                        </Text>
                        {inList}
                    </View> 
                )
        
        return <>{inList}</>
    }

    const aMenuManageItems = !!currentUser ? data?.menu_manage && menuItemsByName(data.menu_manage?.object, data.menu_manage?.items).map(
            (aItem) => {
            return {
                id: aItem.id ? aItem.id : aItem.name,
                name: aItem.name,
                link: aItem.link,
                title: aItem.title,
            }
            }
        ) : []

    if (viewState.view == 'deleted') 
        return <></>

    let tlContent = '';
  
    if (bIsTimelineContent) {
        tlContent = data.content.text //truncateHTML(data.content.text, 380);
        if (data?.content?.images_attach?.length == 0) {
            let link = linkify2(data.content.text)
            if (link) {
                tlContent = tlContent + '<br><div class="bx-embed-link" source="' + link + '">' + link + '</div>'
            }
        }
    }

    let commentsData = null;
    let isShowMoreComments = false;
    if (data?.cmts?.data?.length > 0){
        commentsData = {id:'cmt_list', insert: 'before', 'type': 'browse', 'data': data.cmts};
        if (data?.cmts.total_count > data?.cmts?.data?.length){
            isShowMoreComments = true;
        }
    }

    return (
        <AnimatedBlock>
            <Card rounded='  ' margin=' mb-2 sm:mb-4 sm:mx-4 '>
                <View className="flex-auto flex-row items-top px-4 py-3.5">
                    <Profile
                        {...data.author_data}
                        showLink={true}
                        displayType="unit"
                        displaySize="base"
                        showInfo={
                        <Row className="items-center">
                            <Link href={url}>
                            <Time className="" ts={data.date}></Time>
                            </Link>
                            <ItemInfo data={data} />
                        </Row>
                        }
                    />
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
                    { bIsMarketContent && (
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
                            <Text  className="mr-auto  bg-primary-100 dark:bg-primary-900 rounded-lg font-semibold px-2 py-1 flex-none flex-auto text-neutral-800 dark:text-neutral-200">
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
                    { bIsAddContent && (
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
                            <Text  className="mr-auto  bg-primary-100 dark:bg-primary-900 rounded-lg font-semibold px-2 py-1 flex-none flex-auto text-neutral-800 dark:text-neutral-200">
                                {data.price > 0 ? data.price  + '$' : 'Free'}
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
                        {!bIsGroupContent && !bIsMarketContent  && !bIsAddContent && (
                            <>
                            <View className="  flex-col md:flex-row-reverse ">
                                {data.mainImage && (
                                <View className="w-full px-0.5 sm:px-4 md:w-2/5 mb-3  md:mb-auto md:pr-4 ">
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
                                        <View>
                                            <HtmlMemo tlContent={tlContent} />
                                            {data.showMore && !showFull && bIsLong && (
                                            <View className=" items-start w-full border-b py-2 border-bdr dark:border-bdr-d ">
                                                <Button
                                                title="More"
                                                onPress={(e) => {
                                                    setShowFull(true)
                                                    e.preventDefault()
                                                }}
                                                startDecorator="ArrowFatLineDown"
                                                size="xs"
                                                solid
                                                rounded
                                                variant="outline"
                                                />
                                            </View>
                                            )}
                                        </View>
                                        )}
                                        {!bIsTimelineContent && (
                                        <Text
                                            className="text-neutral-950 dark:text-neutral-50 pt-2 text-sm sm:text-base"
                                            numberOfLines={3}
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
                                    <Html data={data.content.text} />
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
                        <View className="flex-col relative px-0 py-3.5">
                            <View className=" flex-row    px-4 flex-auto">
                            <Menu
                                {...data.menu_actions}
                                displayType="button"
                                params={{
                                show_action: true,
                                show_counter: true,
                                show_combined: true,
                                }}
                            />
                            </View>
                        </View>
                    </>
                    )}
                </View>
                { !!commentsData && (
                    <View>
                        <CommentsBrowse browse={commentsData}  module={data?.cmts.module} isShort={true}  />
                        { isShowMoreComments && <View className='px-4 pb-4'><Link href={url}><Text className='text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-neutral-50 hover:underline font-semibold'>{t('View more comments...')}</Text></Link></View> }
                    </View>
                    )
                }
            </Card>
        </AnimatedBlock>
    )
}

function SmallUnit(data) {
    let url = '/' + data.url
    return (
        <AnimatedBlock>	
            <Link href={url} className="w-full" emulate={true}>
                <Card addClassName='group  active:opacity-50 active:translate-y-1  flex-row px-3 py-2 sm:p-3  ' margin=" mb-[1px] sm:mx-4 sm:mb-2 ">
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
            dynamic(() => import('../../ui/molecules/carousel'))
        )
        return <Carousel data={aImg} />
    }, [b])
    return computedData
}

function HtmlMemo({ tlContent }) {
    const computedData = useMemo(() => {
        return <Html data={tlContent} />
    }, [])
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
    let unit = props.mode == 'small' ?  SmallUnit(data) : DefaultUnit(data)

    return <>{unit}</>
}
