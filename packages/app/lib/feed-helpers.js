import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import Time from 'app/ui/atoms/time'
import Profile from 'app/ui/molecules/profile'
import React, { memo, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useCurrentUser } from 'app/context/user'
import { appSetting, getDataFromCache, storageSet, isObjectsEqual, menuItemsByName, visibilityById, getAlert } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Platform, useWindowDimensions, StyleSheet } from 'react-native'
import { Button, Modal } from 'app/design/controls'
import Menu from 'app/components/menu'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { fetcher } from 'app/lib/fetcher'
 import { getComponent } from 'app/components/registry';
import Card from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/atoms/animated-block'
import { CommentsBrowse, CommentsParts } from 'app/lib/comments-helpers'
import { Pressable } from 'app/design/view';
import { subscribe } from 'app/ui/atoms/socket';
import { LAYOUT_BREAKPOINTS, getDataForMenu } from 'app/lib/util';
import Form from 'app/components/elements/form'
import useFetchForm from 'app/lib/hooks/fetch'
import { useTranslation } from 'react-i18next';
import Loading from 'app/ui/atoms/loading'
import * as FeedItems from 'app/lib/feed-items'
import { Icon } from 'app/ui/atoms/icon'
import { SafeMenuTrigger } from 'app/ui/atoms/safe-menu-trigger';
import  { useLayoutData } from 'app/context/layout';
import { stripTags } from 'app/lib/util'

export const CommentsModal = memo(({ commentsData, initFormData, itemContent, closeOnPost }) => {
    const windowDimensions = useWindowDimensions();
    const offset = windowDimensions.width > LAYOUT_BREAKPOINTS.lg ? 100 : 60;
    const [height, setHeight] = useState(windowDimensions.height - offset - 100);
    const aItems = [itemContent];
    const CommentsPartsData = CommentsParts(commentsData, aItems, height, initFormData, true, closeOnPost);

    const handleLayout = (event) => {
        const h = windowDimensions.height - offset - event.nativeEvent.layout.height;
        setHeight(h)
    };

    return (
        <View className='w-full h-full'>
            <View className='w-full ' style={{ height: height }}>
                {CommentsPartsData[0]}

            </View>
            <View onLayout={handleLayout} className=' w-full px-4 border-t border-bdr dark:border-bdr-d' >
                {CommentsPartsData[1]}
            </View>
        </View>
    );
});

export const FeedEditForm = memo(({ setViewState, viewState, id }) => {
    const { t } = useTranslation();
    const [postData, setPostData] = useState(null);
    /*const { data: dynamicData, error } = useSWR(
        postData ? ['/api.php?r=bx_timeline/get_edit_form/&params[]=' + id, '', postData] : null,
        fetcher,
        !true ? undefined : { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }
    )*/
    const { data: dynamicData, error } = useFetchForm('/api.php?r=bx_timeline/get_edit_form/&params[]=' + id, postData);

    const onFormSubmit = (formData, d) => {
        setPostData(formData)
    }

    useEffect(() => {
        if (dynamicData?.data?.item)
            setViewState({ view: '' })
    }), [dynamicData]

    return (
        <Modal
            onVisible={true}
            transparent={true}
            headerBorder={true}
            padding=' '
        >
            <Form
                {...viewState.data.form}
                classContainerName="flex-row flex-wrap w-full items-start justify-between"
                onFormSubmit={onFormSubmit}
                exProps={{
                    onClose: () => { setViewState({ view: '' }) },
                    item: viewState?.data?.item
                }}
            />
        </Modal>
    )
});

export const CommentsSection = memo(({ isCommentsModal, commentsDataInline, data, isShowMoreComments, showCommentsModal, url, t }) => {
    const ShowMoreCmts = (<Text className='mx-auto text-neutral-600 dark:text-neutral-400 hover:text-primary dark:hover:text-primary-d px-3 py-2 mb-2 mr-auto bg-neutral-500/10 hover:bg-primary-500/20 rounded-full text-sm font-medium'>
        {t('View more comments')}
    </Text>);
    return (
        <View className=' border-t pt-4 border-bdr dark:border-bdr-d  '>
            {isShowMoreComments && (
                <View className='px-4 mb-2'>
                    {isCommentsModal ? <Pressable onPress={() => { showCommentsModal() }} >
                        {ShowMoreCmts}
                    </Pressable> : <Link href={url}>{ShowMoreCmts}</Link>}
                </View>
            )}
            <CommentsBrowse maxCount={appSetting('comments', 'count_in_feed')} contentUrl={url} browse={commentsDataInline} module={data?.cmts.module} isShort={true}  {...(isCommentsModal && { handleReply: showCommentsModal })} />

        </View>
    )
});

export const MainContent = memo(({ url, data, fulltext }) => {

    const bIsTitle = data?.content?.title && data?.content?.title?.trim() != '' ? true : false

    let content_attach = [];
    if (data.content.images_attach && data.content.images_attach.length > 0) {
        content_attach = content_attach.concat(data.content.images_attach);
    }
    if (data.content.videos_attach && data.content.videos_attach.length > 0) {
        content_attach = content_attach.concat(data.content.videos_attach);
    }
    let files_attach = [];
    if (data.content.files_attach && data.content.files_attach.length > 0) {
        files_attach = files_attach.concat(data.content.files_attach);
    }

    const styles = StyleSheet.create(
        Platform.OS !== 'web'
            ? {
                card_image: {
                    borderRadius: 0,
                },
            }
            : {}
    );

    const commonProps = {
        isCompact: false,
        content_attach,
        url,
        data,
        styles,
        bIsTitle,
        fulltext
    };

    const unitTypes = appSetting('feed', 'units');
    const contentType = data?.type;
    const componentName = unitTypes[contentType];

    const ContentComponent = FeedItems[componentName];


    return ContentComponent ? (
        <ContentComponent {...commonProps} />
    ) : (
        <FeedItems.DefaultView
            {...commonProps}
            files_attach={files_attach}
            bIsTimelineContent={data?.type?.includes('timeline') || data?.type === 'bx_channels'}
        />
    );
});

export function prepareData(data) {
    const url = data.url.includes('://') ? data.url : '/' + data.url

    let commentsData = null;
    let isShowMoreComments = false;
    if (data?.cmts?.data?.length > 0) {
        commentsData = { id: 'cmt_list', insert: 'before', 'type': 'browse', 'data': data.cmts };
        if (data?.cmts.total_count > appSetting('comments', 'count_in_feed')) {
            isShowMoreComments = true;
        }
    }

    return { url, commentsData, isShowMoreComments }
}

export const ItemInfo = memo(({ data, t }) => {
    const [showContextList, setShowContextList] = useState(false);
    const owners = data.owners ? data.owners.filter((item) => item.author_data?.id != data.context_data?.id) : [];
    const OwnersList = () => owners?.length > 0 ? owners?.length == 1 ? <>
        <Text className="text-neutral-400 dark:text-neutral-600 text-sm"> · </Text>
        <Link href={data.owners[0].url} emulate={true}>
            <Text className=" bg-primary/10 hover:bg-primary/20 p-1.5 rounded-md text-primary dark:text-primary-d hover:text-linkhover text-xs ">
                {owners[0].title}
            </Text>
        </Link></> : <><Text className="text-neutral-400 dark:text-neutral-600 px-1">·</Text>
        <Pressable onPress={() => { setShowContextList(true) }} >
            <Text className=" bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded-md text-primary dark:text-primary-d hover:text-linkhover text-sm font-medium">
                {owners[0].title} + {owners.length - 1}
            </Text>
        </Pressable>
        <Modal
            onVisible={showContextList}
            onClose={() => {
                setShowContextList(false)
            }}
            transparent={true}
            headerBorder={true}
            title="Posted to"
        >
            <View className='gap-x-2 mb-2'>{
                owners.map((item, index) => (
                    <Row className='items-center py-1 pl-2 my-1 border border-bdr dark:border-bdr-d rounded-lg hover:bg-primary/10 active:bg-primary/20 dark:hover:bg-primary-d/10 dark:active:bg-primary-d/20' key={'chk' + index}>
                        <Link key={`link-{$index}`} href={item.url} emulate={true}>
                            <Text className="text-neutral-700 dark:text-neutral-200 text-sm"> {item.title}</Text>
                        </Link>
                    </Row>
                ))}</View>
        </Modal></> : <></>;

    const FeedType = () => {
        let l = t('feed_type_' + data.type);
        if (data.type == 'timeline_common_repost') {
            l += ' ' + data.content.owner_name + "'s " + data.content.parse_type;
        }
        return l && (
            <>
                <Text className=" text-neutral-400 dark:text-neutral-600 text-xs leading-4 text-center px-1">·</Text>
                <Text className=" text-neutral-600 dark:text-neutral-400 text-sm leading-5 text-center font-medium tracking-tight ">
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
});

export const MenuManage = ({ id, menu, setViewState }) => {
    const [menuData, setMenuData] = useState(false);

    if (!menu.object)
        return null;

    if (menu.items)
        return <MenuManage_ id={id} menu={menu} setViewState={setViewState} />

    if (!menuData)
        return (
            <SafeMenuTrigger>
                <Button
                    variant="text"
                    size="sm"
                    rounded

                    startDecorator="Ellipsis"
                    onPress={() => {
                        if (Platform.OS === 'web')
                            setMenuData({ ...menu, items: [{ 'name': 'loader' }] });
                        getDataForMenu(menu, setMenuData);
                    }}
                /></SafeMenuTrigger>
        );

    return <MenuManage_ id={id} menu={menuData} defaultOpen={true} setViewState={setViewState} />
}

const MenuManage_ = memo(({ id, menu, setViewState, defaultOpen }) => {
    const { currentUser, setCurrentUser } = useCurrentUser()
    const { setLayoutData } = useLayoutData()
    const handleMenuManageSelect = async (oItem, event) => {
        switch (oItem.name) {
            case 'item-edit':
                const oResultEdit = await fetcher(
                    '/api.php?r=bx_timeline/get_edit_form/&params[]=' + id
                )
                setViewState({ view: 'edited', data: oResultEdit.data })
                break

            case 'item-delete':
                const oResultDeleted = await fetcher(
                    '/api.php?r=bx_timeline/delete/&params[]=' + id
                )
                setViewState({ view: 'deleted' })
                setLayoutData(getAlert('feed:remove_content', id));
                break
        }
    }

    let oReport = undefined;
    const aMenuManageItems = !!currentUser ? menu && menuItemsByName(menu?.object, menu?.items, currentUser).map(
        (aItem) => {
            let sTitle = aItem.title;
            if (!!aItem.display_type && aItem.display_type == 'element') {
                const Element = getComponent('molecule', String(aItem.data.type));
                if (!!Element) {
                    sTitle = <Element mode="dropdown-menu" key={aItem.id ? aItem.id : aItem.name}   {...aItem.data} />
                }
            }

            if (aItem.name == 'loader') {
                sTitle = <Loading size="small" />
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
            <View className="flex-none ml-2 x">
                <DropdownMenu items={aMenuManageItems} defaultOpen={defaultOpen} onSelect={handleMenuManageSelect}>
                    <Button
                        variant="text"
                        size="sm"
                        rounded
                        startDecorator="Ellipsis"
                    />
                </DropdownMenu>
            </View>
            {!!oReport && oReport}
        </>
    );
});

export const ActionMenu = memo(({ data }) => {
    const settings = appSetting('feed', 'actions_menu');
    return settings && <Menu
        {...data}
        displayType="button"
        params={settings}
    />
});

export const CounterMenu = memo(({ data }) => {
    const settings = appSetting('feed', 'counters_menu');
    return settings && <Menu
        {...data}
        displayType="button"
        params={settings}
    />
});

export const VisibilityInfo = memo(({ data }) => {
    const { t } = useTranslation();

    if (data.feed_type == 'owner')
        return null;

    const visibilityData = visibilityById(data.object_privacy_view, t);
    const icon = visibilityData ? visibilityData.icon : ''
    const text = visibilityData ? visibilityData.text : ''
    const isUser = data.object_privacy_view < 0;

    return (
        <Row className="text-neutral-600 dark:text-neutral-400 items-center">
            <Text className="text-neutral-400 dark:text-neutral-600 text-sm leading-6 mx-1">·</Text>
            {isUser ? <Profile {...data.author_data} displayType="unit_wo_info" displaySize="xxs" /> : (icon ? <Icon icon={icon} width={16} height={16} /> : null)}
            <Text className="text-neutral-600 dark:text-neutral-400 text-sm font-medium leading-6 text-center tracking-tight ml-1">{isUser ? data.author_data.display_name : text}</Text>
        </Row>
    );
});

export const Author = memo(({ data, url, t }) => {
    const Badges = getComponent('molecule', 'badges')
    const ActionsElements = data.author_actions.map((item, index) => {
        const Element = getComponent('molecule', String(item.type));
        if (!Element) return null; // Explicitly return null for no component
        return (
            <Element
                params={{ button_variant: 'link', button_size: 'sm', hide_icon: true, padding: ' ' }}
                key={`action-${index}`}
                {...item}
            />
        );
    });

    const dataIcon = data.object_privacy_view < 0 && data.feed_type != 'owner' ? data.context_data : data.author_data;

    return (
        <View className='flex-auto'>
            <Profile
                {...dataIcon}

                displayType="unit"
                displaySize="lg"
                showInfo={
                    <Row className=" flex-wrap items-center">
                        <Link href={url}>
                            <Time className='leading-5.5' ts={data.date}></Time>
                        </Link>

                        <VisibilityInfo data={data} />
                        <ItemInfo data={data} t={t} />
                        
                    </Row>
                }
                showInfo2={<Badges badges={data.author_badges} />}
                showActions={ActionsElements}
            />
        </View>
    )
});


export function SmallUnit({data}) {
    let url = '/' + data.url
    return (
        <AnimatedBlock>
            <Link href={url} className="w-full" emulate={true}>
                 <Card rounded=' rounded-none sm:rounded-2xl ' margin=' mb-1 sm:mb-3 p-4 border-y border-x-none sm:border-x flex-row' border='border-y border-x-none sm:border-x border-bdrcard dark:border-bdrcard-d shadow-sm' addClassName={' w-full tl-' + data.id} >
                    <View className=" mr-2  xl:mr-3 rounded-full flex-none bg-secondary-500/10">
                        <Profile
                            {...data.author_data}
                            displayType="unit_wo_info"
                            displaySize="bg"
                        />
                    </View>
                    <View className="flex-auto flex-col my-auto">
                        <View className="flex-row gap-x-2 sm:gap-x-3 ">
                            <Text className=" text-sm flex-auto font-medium text-neutral-800 dark:text-neutral-200">
                                {data.author_data.display_name}
                            </Text>
                            <Time className=" text-sm flex-none " ts={data.date}></Time>
                        </View>
                        <Text className="flex-auto text-lg  font-bold text-neutral-800 dark:text-neutral-200 sm:group-hover:text-neutral-950 sm:dark:group-hover:text-neutral-50" numberOfLines={1}>
                            {data.content.title}
                        </Text>
                        <View className="flex-row w-full items-end content-end">
                            <Text
                                className="flex-auto mr-2  text-base text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-950 dark:group-hover:text-neutral-50"
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
};

export const UnitFeed = ({ data, mode, DefaultUnit, SmallUnit, feed_type }) => {
    data.mainImage = null
    if (data?.content?.images)
        data.mainImage = data?.content?.images?.length > 0 ? data.content.images[0] : null

    data.comments = null
    if (data?.cmts?.data?.length > 0) {
        data.comments = data.cmts.data[0][Object.keys(data.cmts.data[0])[0]].data
    }
    const sKey = `feed_${data.id}_${data.feed_type}`;
    data.showMore = true;
    const dataCache = getDataFromCache('li:data', sKey)
    const [datas, setDatas] = useState(dataCache ? dataCache.data : data);

    useEffect(() => {
        storageSet('li:data', sKey, { data: datas, ts: Date.now() });
    }, [datas]);

    const onItemEdited = useCallback(async (strData) => {
        const data = JSON.parse(strData);
        if (data.id.toString() == datas.id.toString()) {
            const result = await fetcher(
                '/api.php?r=' + appSetting("urls", "feed_item") + '{"params":{"browse":"id","value":' + data.id + '}}'
            )
            if (result.data && !isObjectsEqual(result.data, datas))
                setDatas(result.data);
        }
    }, [datas]);

    useEffect(() => {
        subscribe('bx_timeline_0', 'edited', onItemEdited);
    }, []);

    return  mode == 'small' ? <SmallUnit data={datas}/> : <DefaultUnit data={datas}/>
};
