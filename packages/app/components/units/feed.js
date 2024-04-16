import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import Time from 'app/ui/atoms/time'
import Profile from 'app/ui/molecules/profile'
import React, { memo, useState, useEffect, useContext, useRef } from 'react'
import { useCurrentUser } from 'app/context/user'
import { Text } from 'app/design/typography'
import { View, Row, ScrollView } from 'app/design/view'
import { StyleSheet } from 'react-native'
import { Platform, Image as ImageNative } from 'react-native'
import { Button, Modal } from 'app/design/controls'
import Menu from 'app/components/menu'
import { stripTags, menuItemsByName, FeedbackHaptics } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { fetcher } from 'app/lib/fetcher'
import Form from 'app/components/elements/form'
import useSWR from 'swr'
import { componentsMap } from 'app/ui/molecules/_map'
import Card from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/molecules/animated-block'
import { useTranslation } from 'react-i18next';
import { CommentsBrowse, CommentsParts } from 'app/lib/comments-helpers'
import { Pressable } from 'app/design/view';
import { ContentMore } from 'app/ui/molecules/contentmore';
import { BottomSheetData } from 'app/context/bottomsheet';
import { useWindowDimensions } from 'react-native'
import Carousel from 'app/ui/molecules/carousel'

const CommentsModal = ({ commentsData, initFormData, itemContent }) => {
    const windowDimensions = useWindowDimensions();
    const isWeb = Platform.OS == 'web' ? true : false;
    const aItems = [itemContent];
    const CommentsPartsData = CommentsParts(commentsData, aItems, windowDimensions.height * 0.95 - 136, initFormData);
    return (
        <View className='flex-1 w-full '>
            <View className={'w-full flex-auto ' + (isWeb ? '' : ' h-16')}>
                {CommentsPartsData[0]}
            </View>
            <View className={(isWeb ? '' : 'absolute bottom-0 ') + ' w-full'} >
                {CommentsPartsData[1]}
            </View>
        </View>
    );
}

const CommentsSection = React.memo(({ isCommentsModal, commentsDataInline, data, isShowMoreComments, showCommentsModal, url, t }) => {

    const ShowMoreCmts = (<Text className='text-neutral-600 dark:text-neutral-400 hover:text-primary dark:hover:text-primary-d text-sm font-semibold'>
        {t('View more comments...')}
    </Text>);
    return (
        <View className='border-t border-bdr/50 dark:border-bdr-d/50 pt-4 mt-4'>
            <CommentsBrowse maxCount={2} browse={commentsDataInline} module={data?.cmts.module} isShort={true} handleReply={showCommentsModal} />
            {isShowMoreComments && (
                <View className='bg-bgritem dark:bg-bgritem-d hover:bg-primary/10 dark:hover:bg-primary-d/10 px-3 py-1  rounded-lg'>
                    {isCommentsModal ? <Pressable onPress={() => { showCommentsModal() }} >
                        {ShowMoreCmts}
                    </Pressable> : <Link href={url}>{ShowMoreCmts}</Link>}
                </View>
            )}
        </View>
    )
});

const ItemInfo = ({ data, t }) => {

    const OwnersList = () => data.owners?.length > 0 && data.owners.map((item, index) => (
        <React.Fragment key={'owner' + index}>
            <Text className="text-neutral-500/50 text-sm"> · </Text>
            <Link href={item.url} emulate={true}>
                <Text className=" bg-primary-500/10 px-1 rounded text-neutral-600 dark:text-neutral-400 hover:text-linkhover text-sm font-medium">
                    {item.title}
                </Text>
            </Link>
        </React.Fragment>
    ));

    const FeedType = () => {
        const l = t('feed_type_' + data.type);
        return l && (
            <>
                <Text className=" text-neutral-500/50 text-sm"> · </Text>
                <Text className="  text-neutral-600 dark:text-neutral-400 text-sm font-medium text-center  ">
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

const LinkContent = ({ url, data }) => (
    <Link href={url}>
        <Text className="mr-auto  bg-primary-100 dark:bg-primary-900 rounded-lg font-semibold px-2 py-1 flex-none flex-auto text-neutral-800 dark:text-neutral-200">
            {data.content.price ? data.content.price.replace("&#36;", "$") : 'Free'}
        </Text>
        <Text
            numberOfLines={2}
            className=" mt-1 text-neutral-950 hover:text-primary dark:text-neutral-50 hover:text-primary-d text-2xl tracking-tight font-bold"
        >
            {data.content.title}
        </Text>
    </Link>
);

const MenuManage = ({ id, menu, setViewState }) => {
    let { currentUser, setCurrentUser } = useCurrentUser()

    const refReport = useRef(null);
    const [reportTitle, setReportTitle] = useState(null);

    const handleMenuManageSelect = async (oItem, event) => {
        switch (oItem.name) {
            case 'item-edit':
                const oResultEdit = await fetcher(
                    '/api.php?r=bx_timeline/get_edit_form/&params[]=' + id
                )
                setViewState({ view: 'edited', data: oResultEdit.data.form })
                break

            case 'item-delete':
                const oResultDeleted = await fetcher(
                    '/api.php?r=bx_timeline/delete/&params[]=' + id
                )
                setViewState({ view: 'deleted' })
                break

            case 'item-report':
                refReport.current.report(event);
                break;
        }
    }

    let oReport = undefined;
    const aMenuManageItems = !!currentUser ? menu && menuItemsByName(menu?.object, menu?.items, currentUser).map(
        (aItem) => {
            let sTitle = aItem.title;
            if (!!aItem.display_type && aItem.display_type == 'element') {
                const Element = componentsMap[aItem.data.type];
                if (!!Element) {
                    sTitle = aItem.data?.action ? aItem.data?.action.title : 'Report';
                    if (!!reportTitle)
                        sTitle = reportTitle;

                    oReport = (
                        <View className="w-0 invisible">
                            <Element key={aItem.id ? aItem.id : aItem.name} ref={refReport} onChangeTitle={setReportTitle} {...aItem.data} />
                        </View>
                    );
                }
            }

            return {
                id: aItem.id ? aItem.id : aItem.name,
                name: aItem.name,
                link: aItem.link,
                title: sTitle,
            }
        }
    ) : []

    return aMenuManageItems?.length > 0 && (
        <>
            <View className="flex-none ml-2">
                <DropdownMenu items={aMenuManageItems} onSelect={handleMenuManageSelect}>
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
            {!!oReport && oReport}
        </>
    );
};

function DefaultUnit(data) {

    if (data.type == 'timeline_common_repost') {
        return <></>; //NEED TO FIX
    }
    const { t } = useTranslation();
    const [viewState, setViewState] = useState({ view: '' })
    const [postData, setPostData] = useState(null)
    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);
    const cmtsData = data.cmts_list;
    const styles = StyleSheet.create(
        Platform.OS !== 'web'
            ? {
                card_image: {
                    borderRadius: 0,
                },
            }
            : {}
    );
    const url = data.url.includes('://') ? data.url : '/' + data.url
    const bIsTimelineContent = data?.type?.includes('timeline') || data?.type == 'bx_channels' ? true : false
    const bIsGroupContent = (data.type == 'bx_groups' || data.type == 'bx_events') && data.action == 'added'
    const bIsMarketContent = (data.type == 'bx_market') && data.action == 'added'
    const bIsAddContent = (data.type == 'bx_ads') && data.action == 'added'
    const bIsTitle = data?.content?.title && data?.content?.title?.trim() != '' ? true : false
    const { data: dynamicData, error } = useSWR(
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

    let commentsData = null;
    let isShowMoreComments = false;
    if (data?.cmts?.data?.length > 0) {
        commentsData = { id: 'cmt_list', insert: 'before', 'type': 'browse', 'data': data.cmts };
        if (data?.cmts.total_count > data?.cmts?.data?.length) {
            isShowMoreComments = true;
        }
    }

    const linkForAd = data?.content?.register_click ? (
        <Pressable onPress={async () => { await fetcher('/api.php?r=' + data.content.register_click) }}>
            <LinkContent url={url} data={data} />
        </Pressable>
    ) : (
        <LinkContent url={url} data={data} />
    );

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



    const MainContent = () => bIsMarketContent
        ? <MarketView isCompact={false} content_attach={content_attach} url={url} data={data} styles={styles} bIsTitle={bIsTitle} bIsTimelineContent={bIsTimelineContent} />
        : bIsAddContent
            ? <AdView isCompact={false} content_attach={content_attach} url={url} data={data} styles={styles} bIsTitle={bIsTitle} bIsTimelineContent={bIsTimelineContent} />
            : bIsGroupContent
                ? <GroupView isCompact={false} content_attach={content_attach} url={url} data={data} styles={styles} bIsTitle={bIsTitle} bIsTimelineContent={bIsTimelineContent} />
                : <DefaultView isCompact={false} content_attach={content_attach} url={url} data={data} styles={styles} bIsTitle={bIsTitle} bIsTimelineContent={bIsTimelineContent} />;


    const isCommentsModal = data.cmts_list ? true : false;

    const showCommentsModal = async (initFormData) => {
        setBottomSheetData({ title: data.author_data.display_name + "'s post", showClose: true, isListView: true, content: <CommentsModal initFormData={initFormData} itemContent={{ id: "block-comments", data: <><View className='pb-4'><Author /></View><MainContent /></> }} commentsData={cmtsData} />, snapPoints: ['95%', '95%'] });
    }

    if (viewState.view == 'deleted')
        return <></>
        
    if (isCommentsModal && data.menu_actions?.items[0].data?.callback)
        data.menu_actions.items[0].data.callback = showCommentsModal

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

    const Author = ({ }) => (
        <View className='flex-auto overflow-hidden '>
            <Profile
                {...data.author_data}
                showLink={true}
                displayType="unit"
                displaySize="base"
                showInfo={
                    <Row className="flex-wrap items-center text-sm">
                        <Link href={url}>
                            <Time stylesNameAdd=" hover:text-linkhover  align-center text-center" ts={data.date}></Time>
                        </Link>
                        <ItemInfo data={data} t={t} />
                    </Row>
                }
            />
        </View>
    );

    return (
        <AnimatedBlock>
            <Card rounded=' rounded-none sm:rounded-2xl ' border=" sm:border border-bdrcard dark:border-bdrcard-d" margin=' mb-2 sm:mb-4 sm:mx-4 ' addClassName=' p-3 sm:p-6  ' >
                <View className="flex-auto flex-row items-top pb-3 sm:pb-6">
                    <Author />
                    <View className="flex-auto justify-end flex-row mb-auto">
                        {data.author_actions.map((item, index) => {
                            const Element = componentsMap[item.type]
                            if (!Element) return
                            return <Element key={`action-${index}`} {...item} />
                        })}
                        <MenuManage id={data.id} menu={data?.menu_manage} setViewState={setViewState} />
                    </View>
                </View>
                <View className="flex-col ">
                    {viewState.view == 'edited' ? (
                        <Modal
                            title={t("Edit post")}
                            onVisible={true}
                            onClose={() => {
                                setViewState({ view: '' })
                            }}
                            presentation='overFullScreen'

                            transparent={true}
                            headerBorder={true}
                        >

                            <Form
                                {...viewState.data}
                                classContainerName="flex-row flex-wrap px-2 w-full items-start justify-between"
                                onFormSubmit={onFormSubmit}
                            />

                        </Modal>
                    ) : (
                        <>
                            <MainContent />
                            <View className="pt-4 sm:pt-6 ">
                                <MenuMemo showCommentsModal={showCommentsModal} />
                            </View>
                        </>
                    )}
                </View>
                {commentsData && <CommentsSection url={url} t={t} isCommentsModal={isCommentsModal} showCommentsModal={showCommentsModal} commentsDataInline={commentsData} data={data} isShowMoreComments={isShowMoreComments} />}
            </Card>
        </AnimatedBlock>
    )

    function GroupView({ data, styles, url, isCompact }) {
        const pref = isCompact ? '' : 'md:';
        return (<View className={isCompact ? " flex-row space-x-2 mx-4 overflow-hidden rounded-lg border border-bdritem dark:border-bdritem-d bg-bgritem dark:bg-bgritem-d p-1" : " flex-col md:flex-row space-x-2 mx-0.5 sm:mx-4 overflow-hidden rounded-lg border border-bdritem dark:border-bdritem-d bg-bgritem dark:bg-bgritem-d p-1"}>
            {data.mainImage && (
                <View className={isCompact ? "w-64" : "w-full md:w-1/3 "}>
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
            <View className="flex-auto px-2  pb-2 my-auto flex-col">
                <Link href={url} className="">
                    <Text
                        numberOfLines={1}
                        className="  text-neutral-600 dark:text-neutral-400 text-xs uppercase  tracking-tight overflow-hidden"
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
                                ·{' '}
                                <Time
                                    stylesName="text-xs flex-none"
                                    ts={data.content.date_start}
                                ></Time>
                                {data.content.date_end && (
                                    <>
                                        {' - '}
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
                        className=" mt-1 text-neutral-950 hover:text-primary dark:text-neutral-50 hover:text-primary-d text-2xl tracking-tight font-bold"
                    >
                        {data.content.title}
                    </Text>
                </Link>
                <View>
                    <View className="flex-col relative">
                        <Text
                            className="text-neutral-950 dark:text-neutral-50 pb-4 text-sm "
                            numberOfLines={2}
                        >
                            {data.content.text}
                        </Text>
                    </View>
                </View>
            </View>
        </View>);
    }

    function AdView({ data, styles }) {
        return <View className=" flex-col md:flex-row space-x-2 mx-0.5 sm:mx-4 overflow-hidden rounded-lg border border-bdritem dark:border-bdritem-d bg-bgritem dark:bg-bgritem-d p-1">
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
                <View>
                    <View className="flex-col relative">
                        <Text
                            className="text-neutral-950 dark:text-neutral-50 pb-4  text-sm "
                            numberOfLines={3}
                        >
                            {data.content.text}
                        </Text>
                    </View>

                </View>
            </View>
        </View>
    }
    function MarketView({ data, styles }) {
        return <View className=" flex-col md:flex-row space-x-2 mx-0.5 sm:mx-4 overflow-hidden rounded-lg border border-bdritem dark:border-bdritem-d bg-bgritem dark:bg-bgritem-d p-1">
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
                        className=" mt-1 text-neutral-950 hover:text-primary dark:text-neutral-50 hover:text-primary-d text-2xl tracking-tight font-bold"
                    >
                        {data.content.title}
                    </Text>
                </Link>
                <View>
                    <View className="flex-col relative">
                        <Text
                            className="text-neutral-950 dark:text-neutral-50 pb-4 text-sm "
                            numberOfLines={3}
                        >
                            {data.content.text}
                        </Text>
                    </View>

                </View>
            </View>
        </View>
    }

    function DefaultView({ data, styles, bIsTitle, bIsTimelineContent, content_attach, url, isCompact }) {
        return <>
            <View className={isCompact ? "flex-row-reverse" : " flex-col md:flex-row-reverse "}>
                {data.mainImage && (
                    <View className={isCompact ? "px-4 w-64 mb-auto pr-4" : "w-full px-4 sm:px-6 md:w-64 mb-3 md:mb-auto md:pr-4 "}>
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
                <View className="flex-auto my-auto flex-col">
                    {bIsTitle && (
                        <Link href={url} className="">
                            <Text
                                numberOfLines={2}
                                className="  text-neutral-950 hover:text-primary dark:text-neutral-50 hover:text-primary-d text-2xl tracking-tight font-bold"
                            >
                                {data.content.title}
                            </Text>
                        </Link>
                    )}
                    <View>
                        <View className="flex-col  relative ">
                            {bIsTimelineContent && (
                                <View className={' ' + data.content.text && content_attach.length > 0 ? ' pb-4 ' : ''}>
                                    <ContentMore showLink={data?.content?.images_attach?.length == 0} content={data.content.text} numberOfLines={3} openSmall={false} textClassName="font-default text-base text-neutral-600 dark:text-neutral-400" />
                                </View>
                            )}
                            {!bIsTimelineContent && (
                                <Text
                                    className="text-neutral-600 dark:text-neutral-400 pt-4 text-sm sm:text-base"
                                    numberOfLines={2}
                                >
                                    {data.content.text}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </View>
            {bIsTimelineContent && (
                <View className="">
                    <UnitImages images={data.content.images_attach} />
                </View>
            )}
        </>

    }
}

function SmallUnit(data) {
    let url = '/' + data.url
    return (
        <AnimatedBlock>
            <Link href={url} className="w-full" emulate={true}>
                <Card addClassName='  group active:opacity-50 active:translate-y-1 flex-row p-3 sm:p-6 ' rounded=" rounded-none sm:rounded-2xl " margin=" -mb-[1px] sm:mx-4 sm:mb-2 ">
                    <View className=" mr-2 xl:mr-3 rounded-full flex-none bg-secondary-500/10">
                        <Profile
                            {...data.author_data}
                            displayType="unit_wo_info"
                            displaySize="base"
                        />
                    </View>
                    <View className="flex-auto flex-col my-auto ">
                        <View className="flex-row gap-x-3 sm:gap-x-4">
                            <Text className="text-base flex-auto font-semibold text-neutral-800 dark:text-neutral-200">
                                {data.author_data.display_name}
                            </Text>
                            <Time className="text-xs flex-none" ts={data.date}></Time>
                        </View>
                        <Text className="flex-auto text-lg  font-bold text-neutral-800 dark:text-neutral-200 sm:group-hover:text-neutral-950 sm:dark:group-hover:text-neutral-50" numberOfLines={1}>
                            {data.content.title}
                        </Text>
                        <View className="flex-row w-full items-end content-end">
                            <Text
                                className="flex-auto mr-2 text-base text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-950 dark:group-hover:text-neutral-50"
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

/*
function CarouselMemo({ aImg, b }) {
    const computedData = useMemo(() => {
        return <><Carousel data={data} /></>
    }, [b, aImg])
    return computedData
}*/

function UnitImages(images) {

    if (!images?.images || images?.images?.length == 0)
        return <></>

    let aImg = images?.images.map((obj) => {
        return {
            src: obj.src_orig ? obj.src_orig : obj.src,
            width: obj.width,
            height: obj.height,
            type: 'image',
        }
    })

    return (
        <View className="w-full px-0.5 sm:px-4">
            <Carousel data={aImg} />
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
