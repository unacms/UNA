import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import Time from 'app/ui/atoms/time'
import Profile from 'app/ui/molecules/profile'
import ProfileHoverCard from 'app/ui/molecules/profile-hover-card'
import {
    memo,
    useState,
    useEffect,
    useCallback,
} from 'react'
import { useCurrentUser } from 'app/context/user'
import {
    appSetting,
    getDataFromCache,
    storageSet,
    isObjectsEqual,
    menuItemsByName,
    visibilityById,
    getAlert,
} from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Platform, StyleSheet } from 'react-native'
import { Button, Modal } from 'app/design/controls'
import Menu from 'app/components/menu'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { fetcher } from 'app/lib/fetcher'
import { getComponent } from 'app/components/registry'
import Card from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/atoms/animated-block'
import { CommentsBrowse, CommentsBrowseShort /*, CommentsParts*/ } from 'app/lib/comments-helpers'
import { Pressable } from 'app/design/view'
import { subscribe } from 'app/ui/atoms/socket'
import { getDataForMenu } from 'app/lib/util'
import Form from 'app/components/elements/form'
import useFetchForm from 'app/lib/hooks/fetch'
import { useTranslation } from 'react-i18next'
import Loading from 'app/ui/atoms/loading'
import * as FeedItems from 'app/lib/feed-items'
import { Icon } from 'app/ui/atoms/icon'
import { SafeMenuTrigger } from 'app/ui/atoms/safe-menu-trigger'
import { stripTags, isWeb } from 'app/lib/util'
import emitter from 'app/context/emitter';


export const FeedEditForm = memo(({ setViewState, viewState, id }) => {
    const { t } = useTranslation()
    const [postData, setPostData] = useState(null)
    const { data: dynamicData, error } = useFetchForm(
        '/api.php?r=bx_timeline/get_edit_form/&params[]=' + id,
        postData
    )

    const onFormSubmit = (formData, d) => {
        setPostData(formData)
    }

    useEffect(() => {
        if (dynamicData?.data?.item) setViewState({ view: '' })
    }),
        [dynamicData]

    return (
        <Modal
            onVisible={true}
            transparent={true}
            headerBorder={true}
            padding=" "
        >
            <View className='p-3 flex-auto'>
                <Form
                    {...viewState.data.form}
                    classContainerName="flex-row flex-wrap w-full items-start justify-between"
                    onFormSubmit={onFormSubmit}
                    exProps={{
                        onClose: () => {
                            setViewState({ view: '' })
                        },
                        item: viewState?.data?.item,
                    }}
                />
            </View>
        </Modal>
    )
})

export const CommentsSection = memo(
    ({
        isCommentsModal,
        commentsDataInline,
        data,
        isShowMoreComments,
        showCommentsModal,
        url,
        t,
    }) => {
        const ShowMoreCmts = (
            <Button variant="text" size="xs" title={t('View more comments...')} />
        )
        return (
            <View className="border-t border-muted/60 px-1 sm:px-2 py-1 sm:py-2 ">
                
                    {isShowMoreComments && (
                        <View className="sm:pb-1 me-auto">
                            {isCommentsModal ? (
                                <Pressable
                                    onPress={() => {
                                        showCommentsModal()
                                    }}
                                >
                                    {ShowMoreCmts}
                                </Pressable>
                            ) : (
                                <Link href={url}>{ShowMoreCmts}</Link>
                            )}
                        </View>
                    )}
                <View className="px-2 ">
                <CommentsBrowseShort
                    contentUrl={url}
                    browseData={commentsDataInline?.data}
                    module={data?.cmts.module}
                    handleReply={isCommentsModal ? showCommentsModal : 'link'}
                /></View>
            </View>
        )
    }
)

export const MainContent = memo(({ url, data, fulltext }) => {
    const bIsTitle =
        data?.content?.title && data?.content?.title?.trim() != ''
            ? true
            : false

    let content_attach = []
    if (data?.content?.images_attach && data?.content?.images_attach?.length > 0) {
        content_attach = content_attach.concat(data.content.images_attach)
    }
    if (data?.content?.videos_attach && data?.content?.videos_attach?.length > 0) {
        content_attach = content_attach.concat(data.content.videos_attach)
    }
    let files_attach = []
    if (data?.content?.files_attach && data?.content?.files_attach.length > 0) {
        files_attach = files_attach.concat(data.content.files_attach)
    }

    const styles = StyleSheet.create(
        Platform.OS !== 'web'
            ? {
                card_image: {
                    borderRadius: 0,
                },
            }
            : {}
    )

    const commonProps = {
        isCompact: false,
        content_attach,
        url,
        data,
        styles,
        bIsTitle,
        fulltext,
    }

    const unitTypes = appSetting('feed', 'units')
    const contentType = data?.type
    const componentName = unitTypes[contentType]

    const ContentComponent = FeedItems[componentName]

    return ContentComponent ? (
        <ContentComponent {...commonProps} />
    ) : (
        <FeedItems.DefaultView
            {...commonProps}
            files_attach={files_attach}
            bIsTimelineContent={
                data?.type?.includes('timeline') || data?.type === 'bx_channels'
            }
        />
    )
})

export function prepareData(data) {
    const url = data?.url?.includes('://') ? data?.url : (data?.url?.startsWith('/') ? data?.url : '/' + data?.url)
    let commentsData = null
    let isShowMoreComments = false
    if (data?.cmts?.data?.length > 0) {
        commentsData = {
            id: 'cmt_list',
            insert: 'before',
            type: 'browse',
            data: data?.cmts,
        }
        if (data?.cmts?.total_count > appSetting('comments', 'count_in_feed')) {
            isShowMoreComments = true
        }
    }

    return { url, commentsData, isShowMoreComments }
}

export const ItemInfo = memo(({ data, t }) => {
    const [showContextList, setShowContextList] = useState(false)
    const owners = data.owners
        ? data.owners.filter(
            (item) => item.author_data?.id != data.context_data?.id
        )
        : []
    const OwnersList = () =>
        owners?.length > 0 ? (
            owners?.length == 1 ? (
                <>

                    <Icon className="text-muted-foreground -mx-0.5 " icon='Dot' size={14} />

                    <Link href={data.owners[0].url} emulate={true}>
                        <Text className=" text-secondary-foreground web:hover:text-accent-foreground font-medium text-xs ">
                            {owners[0].title}
                        </Text>
                    </Link>
                </>
            ) : (
                <>
                    <Icon className="text-muted-foreground -mx-0.5 " icon='Dot' size={14} />
                    <Pressable
                        onPress={() => {
                            setShowContextList(true)
                        }}
                    >
                        <Text className=" bg-muted px-1.5 leading-5 items-center justify-text-center justify-center h-5 rounded-md text-muted-foreground web:hover:text-accent-foreground text-xs font-medium">
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
                        <View className="gap-x-2 mb-2">
                            {owners.map((item, index) => (
                                <Row
                                    className="items-center py-1 pl-2 my-1 border border-border/60  rounded-lg web:hover:bg-primary/10 active:bg-primary/20 "
                                    key={'chk' + index}
                                >
                                    <Link
                                        key={`link-{$index}`}
                                        href={item.url}
                                        emulate={true}
                                    >
                                        <Text className="text-muted-foreground  text-sm">
                                            {' '}
                                            {item.title}
                                        </Text>
                                    </Link>
                                </Row>
                            ))}
                        </View>
                    </Modal>
                </>
            )
        ) : (
            <></>
        )

    const FeedType = () => {
        let l = t('feed_type_' + data.type)
        if (data.type == 'timeline_common_repost') {
            l += ' ' + data.content.owner_name + "'s " + data.content.parse_type
        }
        return (
            l && (
                <>

                    <Icon className="text-secondary-foreground -mx-0.5 " icon='Dot' size={14} />

                    <Text className="text-secondary-foreground font-medium text-xs leading-4 ">
                        {l}
                    </Text>
                </>
            )
        )
    }

    return (
        <>
            <FeedType />
            <OwnersList />
        </>
    )
})

export const MenuManage = ({ id, menu, setViewState }) => {
    const [menuData, setMenuData] = useState(false)

    if (!menu?.object) return null

    if (menu.items)
        return <MenuManage_ id={id} menu={menu} setViewState={setViewState} />

    if (!menuData)
        return (
            <SafeMenuTrigger>
                <Button
                    variant="text"
                    size="sm"
                    startDecorator="Ellipsis"
                    rounded="true"
                    onPress={() => {
                        if (Platform.OS === 'web')
                            setMenuData({
                                ...menu,
                                items: [{ name: 'loader' }],
                            })
                        getDataForMenu(menu, setMenuData)
                    }}
                />
            </SafeMenuTrigger>
        )

    return (
        <MenuManage_
            id={id}
            menu={menuData}
            defaultOpen={true}
            setViewState={setViewState}
        />
    )
}

const MenuManage_ = memo(({ id, menu, setViewState, defaultOpen }) => {
    const { currentUser } = useCurrentUser()
    const handleMenuManageSelect = async (oItem, event) => {
        switch (oItem.name) {
            case 'item-edit':
                const oResultEdit = await fetcher(
                    '/api.php?r=bx_timeline/get_edit_form/&params[]=' + id
                )
                setViewState({ view: 'edited', data: oResultEdit.data })
                break

            case 'item-delete':
                await fetcher(
                    '/api.php?r=bx_timeline/delete/&params[]=' + id
                )
                //setViewState({ view: 'deleted' });
                emitter.emit('feed', { action: 'remove_content', id: id });
                //setLayoutData(getAlert('feed:remove_content', id));// TODO REMOVE AFTER CUT setLayoutData/getAlert
                break
        }
    }

    let oReport = undefined
    const aMenuManageItems = !!currentUser
        ? menu &&
        menuItemsByName(menu?.object, menu?.items, currentUser).map(
            (aItem) => {
                let sTitle = aItem.title
                if (!!aItem.display_type && aItem.display_type == 'element') {
                    const Element = getComponent(
                        'molecule',
                        String(aItem.data.type)
                    )
                    if (!!Element) {
                        sTitle = (
                            <Element
                                mode="dropdown-menu"
                                key={aItem.id ? aItem.id : aItem.name}
                                {...aItem.data}
                            />
                        )
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
        )
        : []

    return (
        aMenuManageItems?.length > 0 && (
            <>
                <View className="flex-none" aria-label="Manage menu">
                    <DropdownMenu
                        mode="popup"
                        items={aMenuManageItems}
                        defaultOpen={defaultOpen}
                        onSelect={handleMenuManageSelect}
                    >
                        <Button
                            variant="text"
                            size="sm"
                            startDecorator="Ellipsis"
                            rounded="true"
                        />
                    </DropdownMenu>
                </View>
                {!!oReport && oReport}
            </>
        )
    )
})

export const ActionMenu = memo(({ data }) => {
    const settings = appSetting('feed', 'actions_menu');

    if (data?.items?.length > 2) {
        for (let i = 2; i < data.items.length; i++)
            if (data.items[i].data)
                data.items[i].data.params = { 'button_show_title_from_size': 'sm' }
            else
                data.items[i].params = { 'button_show_title_from_size': 'sm' }
    }

    const data_other = {...data, items: data?.items.filter(item => item.class != " bx-mi-primary" && item.primary != 1 )};
    const data_primary = {...data, items: data?.items.filter(item => item.class == " bx-mi-primary" || item.primary == 1 )};

    return settings && <Row className="flex-auto justify-between">
        <Menu {...data_primary} displayType="button" params={settings} />
        <Menu {...data_other} displayType="button" params={settings} />
    </Row>
})

export const CounterMenu = memo(({ data }) => {
    const settings = appSetting('feed', 'counters_menu')
    const data_other = {...data, items: data?.items.filter(item => item.class != " bx-mi-primary" && item.primary != 1 )};
    const data_primary = {...data, items: data?.items.filter(item => item.class == " bx-mi-primary" || item.primary == 1 )};

    return settings && <Row className="flex-auto justify-between">
        <Menu {...data_primary} displayType="button" params={settings} />
        <Menu {...data_other} displayType="button" params={settings} />
    </Row>
})

export const VisibilityInfo = memo(({ data }) => {
    const { t } = useTranslation()

    if (data.feed_type == 'owner') return null

    const visibilityData = visibilityById(data.object_privacy_view, t)
    const icon = visibilityData ? visibilityData.icon : ''
    const text = visibilityData ? visibilityData.text : ''
    const isUser = data.object_privacy_view < 0

    return (
        <View className="gap-1 flex-row items-center ">
            {isUser ? (
                <Profile
                    {...data.author_data}
                    displayType="unit_wo_info"
                    displaySize="2xs"
                />
            ) : icon ? (
                <Icon className="text-secondary-foreground py-0.5 " icon={icon} width={14} height={14} />
            ) : null}
            <Text className="text-secondary-foreground text-xs font-semibold leading-[18px]">
                {isUser ? data.author_data.display_name : text}
            </Text>
        </View>

    )
})

export const Author = memo(({ data, url, t }) => {
    const Badges = getComponent('molecule', 'badges')
    const ActionsElements = data.author_actions?.map((item, index) => {
        const Element = getComponent('molecule', String(item.type))
        if (!Element)
            return null
        return (
            <Row className="items-center" key={`action-${item.cid}-${item.iid}`}>
                <Icon className="text-muted-foreground -ml-0.5 -mr-2  " icon='Dot' size={14} />
                <Element
                    params={{
                        button_variant: 'accentlink',
                        button_size: 'sm',
                        hide_icon: true,
                        button_rounded: false,
                        
                    }}

                    {...item}
                />
            </Row>
        )
    })

    const dataIcon =
        data.object_privacy_view < 0 && data.feed_type != 'owner'
            ? data.context_data
            : data.author_data
    const shouldShowVisibilityInfo =
        data.feed_type != 'owner' &&
        (data.object_privacy_view < 0 || !!visibilityById(data.object_privacy_view, t))

    // Create a hover card wrapper function that only wraps avatar/name
    const hoverCardWrapper = (content) => (
        <ProfileHoverCard profileData={dataIcon}>
            {content}
        </ProfileHoverCard>
    );

    const TimestampLink = isWeb ? (
        <Link
            href={url}
            emulate={false}
            size="xs"
            variant="secondary"
        >
            <Time ts={data.date} />
        </Link>
    ) : (
        <Link
            href={url}
            mode="text"
            size="xs"
            variant="secondary"
            hitSlop={{
                top: 8,
                bottom: 8,
                left: 8,
                right: 8,
            }}
        >
            <Time variant="link"
                ts={data.date}
            />
        </Link>
    );

    return (
        <View className="flex-auto min-w-0">
            <Profile
                {...dataIcon}
                displayType="unit"
                displaySize="base"
                showInfo={
                    <Row className="items-center flex-wrap min-h-4 gap-0.5">
                        {TimestampLink}
                        {shouldShowVisibilityInfo && (
                            <>
                                <Icon className="text-muted-foreground -mx-0.5 " icon='Dot' size={12} />
                                <VisibilityInfo data={data} />
                            </>
                        )}
                        <ItemInfo data={data} t={t} />
                    </Row>
                }
                showInfo2={<><Badges badges={data.author_badges} size="3xs" />{ActionsElements}</>}
                hoverCardWrapper={hoverCardWrapper}
            />
        </View>
    )
})

export function SmallUnit({ data }) {
    let url = '/' + data.url

    // Create a hover card wrapper function for avatar only
    const hoverCardWrapper = (content) => (
        <ProfileHoverCard profileData={data.author_data}>
            {content}
        </ProfileHoverCard>
    );

    return (
        <AnimatedBlock>
            <Link href={url} className="w-full" emulate={true}>
                <Card className={' w-full tl-' + data.id}>
                    <View className=" mr-2 xl:mr-3 rounded-full flex-none bg-secondary-500/10">
                        <Profile
                            {...data.author_data}
                            displayType="unit_wo_info"
                            displaySize="base"
                            hoverCardWrapper={hoverCardWrapper}
                        />
                    </View>
                    <View className="flex-auto flex-col my-auto">
                        <Row className="flex-row gap-2">
                            <Text className=" text-sm flex-auto font-medium text-secondary-foreground ">
                                {data.author_data.display_name}
                            </Text>
                            <Time variant="link" className="text-xs flex-none leading-5 "

                                ts={data.date}
                            ></Time>
                        </Row>
                        <Text
                            className="flex-auto text-lg font-bold text-secondary-foreground  "
                            numberOfLines={1}
                        >
                            {data.content.title}
                        </Text>
                        <View className="flex-row w-full items-end content-end">
                            <Text
                                className="flex-auto mr-2  text-base text-muted-foreground  "
                                numberOfLines={1}
                            >
                                {data.plainText}
                                {stripTags(data.content.text)}
                            </Text>
                            <View className="flex-none bg-primary rounded-full my-auto h-min px-1.5">
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

export const UnitFeed = ({ data, mode, DefaultUnit, SmallUnit, feed_type }) => {
    data.mainImage = null
    if (data?.content?.images) {
        data.mainImage = data?.content?.images?.length > 0 ? data.content.images[0] : null
    }
    data.comments = null
    if (data?.cmts?.data?.length > 0) {
        data.comments =
            data.cmts.data[0][Object.keys(data.cmts.data[0])[0]].data
    }
    const sKey = `feed_${data.id}_${data.feed_type}`
    data.showMore = true
    const dataCache = getDataFromCache('li:data', sKey)
    const [datas, setDatas] = useState(dataCache ? dataCache.data : data)

    useEffect(() => {
        storageSet('li:data', sKey, { data: datas, ts: Date.now() })
    }, [datas])

    const onItemEdited = useCallback(
        async (strData) => {
            const editedData = JSON.parse(strData)
            const editedId = editedData?.id
            const currentId = datas?.id

            if (editedId == null || currentId == null) {
                return
            }

            if (editedId.toString() == currentId.toString()) {
                const result = await fetcher(
                    '/api.php?r=' +
                    appSetting('urls', 'feed_item') +
                    '{"params":{"browse":"id","value":' +
                    editedId +
                    '}}'
                )
                if (result.data && !isObjectsEqual(result.data, datas))
                    setDatas(result.data)
            }
        },
        [datas]
    )

    useEffect(() => {
        const sub1 = subscribe('bx_timeline_0', 'edited', onItemEdited);
        return () => {
            sub1();
        };
    }, [])

    return mode == 'small' ? (
        <SmallUnit data={datas} />
    ) : (
        <DefaultUnit data={datas} />
    )
}
