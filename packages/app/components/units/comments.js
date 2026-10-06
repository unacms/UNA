import { useMemo, memo, useCallback, useState, useEffect } from 'react'
import { Platform, Animated } from 'react-native'
import { menuItemsByName, FeedbackHaptics, appSetting, getDataForMenu, attachmentKindByName } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { NeoButton, NeoButtonLink, Modal } from 'app/design/controls'
import Time from 'app/ui/atoms/time'
import Profile from 'app/ui/molecules/profile/profile'
import { ContentMore } from 'app/ui/molecules/content/content-more'
import Embed from 'app/ui/molecules/content/embed'
import Menu from 'app/components/menu'
import { useCurrentUser } from 'app/context/user'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { fetcher } from 'app/lib/fetcher'
import Form from 'app/components/elements/form'
import useFetchForm from 'app/lib/hooks/use-fetch-form'
import { useTranslation } from 'react-i18next'
import Link from 'app/ui/atoms/link'
import { toUnaDisplayImageItem } from 'app/lib/image-helpers'
import Carousel from 'app/ui/molecules/content/carousel'
import FileCard from 'app/ui/molecules/content/file-card'
import { components } from 'app/components/registry'
import { StarsView } from 'app/ui/atoms/stars'
import Loading from 'app/ui/atoms/loading'
import { Icon } from 'app/ui/atoms/icon'
import { usePulseOne } from 'app/lib/hooks/use-pulse-once'
import emitter, { EVENTS } from 'app/context/emitter';
import { CardList } from 'app/ui/molecules/page/card'
import { getPageData } from 'app/lib/util';
import FormModal from 'app/ui/molecules/dialogs/form-modal';

function isSystemRootComment(item) {
    return item?.data?.author_data?.module === 'system' && item?.data?.cmt_level === 0
}

export default function UnitComments(props) {
    const UnitView = props.mode == 'search'
        ? UnitCommentsSearch
        : (isSystemRootComment(props) && components['unit']['activity']) || UnitCommentsDefault
    return <UnitView {...props} />
}

function UnitCommentsSearch(props) {
    const module = props.module.replace("_cmts", '');
    const [pageData, setPageData] = useState(false);

    const keys = Object.keys(props.data);
    const url = props?.data[keys[0]].data.cmt_url;

    const isCommentsModal = appSetting('browse', 'show_in_modal', module)

    const showCommentsModal = async (initFormData) => {
        const url2 = url;
        setPageData({ data: 'loading', url: url, url2: url2 });
        const sResponse = await getPageData(url2, false);
        if (sResponse.data !== pageData.data) {
            setPageData({ data: sResponse.data, url: url, url2: url2 });
        }
    }

    return (
        <>
            <FormModal pageData={pageData.data} setPageData={setPageData} modalView='content_page' url={pageData.url2} />
            <CardList
                border="border-y border-x-none sm:border-x"
                className="mb-0.5 sm:mb-3"
            >
                <UnitComments contentUrl={url} handleReply={isCommentsModal ? showCommentsModal : 'link'} {...props.data[keys[0]]} module={props.module} />
            </CardList>
        </>
    )
}

function UnitCommentsDefault(props) {
    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()
    const [viewState, setViewState] = useState({ view: '' })
    const [postData, setPostData] = useState(null)

    const level = props.level || 0
    const lvls = props.lvls || []
    const hasData = !!props.data
    let data = props.data || {}
    const items = props.items
    const view = props.view
    let files = props.files
    const maxLevel = props.max_level
    const parent = props.parent

    const module = props.module;
    const objectId = data.cmt_object_id;
    const commentId = data.cmt_id;

    const cmtUrl = data.cmt_url

    const handleReply = useCallback(
        (data, isNoReaction) => {
            if (!isNoReaction) {
                FeedbackHaptics('Medium')
            }
            if (props.handleReply) {
                props.handleReply(data)
            }
            else {
                emitter.emit(EVENTS.commentThread(module, objectId), { action: 'reply_comment', data: data });
            }
        },
        [props.handleReply]
    )

    useEffect(() => {
        if (props.replyId == 'cmt_id=' + data.cmt_id) {
            handleReply(data, true)
        }
    }, [props.replyId])

    const isSelected = props.selectedId == data.cmt_id

    const { animatedStyle } = usePulseOne({ pulseDurationMs: 500, pulses: 3, autoStart: true, minOpacity: 0.2 });

    const editFormUrl = hasData
        ? '/api.php?r=' +
        appSetting('urls', 'cmts') +
        '/&params[]={"module":"' +
        props.module +
        '","object_id":' +
        objectId +
        ',"action":"edit","id":' +
        commentId +
        '}'
        : ''
    const { data: dynamicData } = useFetchForm(editFormUrl, postData)

    const onFormSubmit = useCallback((formData) => {
        setViewState({ view: '' })
        setPostData(formData)
    }, [])

    if (hasData && dynamicData?.data?.browse?.data?.data[0]['i' + commentId]) {
        data =
            dynamicData?.data?.browse?.data?.data[0]['i' + commentId]
                .data
        files =
            dynamicData?.data?.browse?.data?.data[0]['i' + commentId]
                .files
    }

    const cells = useMemo(() => {
        const cellsArray = []
        const effectiveLevel = Math.min(level, maxLevel)
        for (let i = 0; i < effectiveLevel; i++) {
            cellsArray.push(
                <View key={`sp-${level}-${i}`} className="w-8">
                    {lvls[i + 1] && (
                        <View className="mx-auto w-0.5 gap-0.5 -mt-3  flex-auto">
                            <View className="mx-auto w-0.5 flex-auto bg-muted rounded-b-full" />
                            <View className="mx-auto w-0.5 h-0.5 flex-none bg-muted rounded-full" />
                            <View className="mx-auto w-0.5 h-0.5 flex-none bg-muted rounded-full" />
                            <View className="mx-auto w-0.5 h-0.5 flex-none bg-muted rounded-full" />

                        </View>
                    )}
                    {i === level - 1 && (
                        <View className=" ml-4 -inset-s-px h-7 w-6 border-muted mt-px border-l-2 border-b-2 absolute top-0 rounded-bl-lg flex-auto" />
                    )}
                </View>
            )
        }
        return cellsArray
    }, [level, maxLevel, lvls])

    // UNA sends every comment file here: images and videos go to the carousel, the rest to a file list.
    const { imageList, fileList } = useMemo(() => {
        const media = []
        const other = []
        for (const file of files || []) {
            const kind = file?.is_image ? 'image' : attachmentKindByName(file?.file_name)
            if (kind === 'image') {
                const item = toUnaDisplayImageItem(file)
                if (item) media.push(item)
            } else if (kind === 'video' && file?.file) {
                media.push({ src: file.file, type: 'video' })
            } else if (file?.file) {
                other.push(file)
            }
        }
        return { imageList: media, fileList: other }
    }, [files])

    if (!hasData) return null

    if (viewState.view == 'deleted') return <></>

    if (viewState.view == 'edited')
        return (
            <Modal
                title={t('Edit comment')}
                onVisible={true}
                onClose={() => {
                    setViewState({ view: '' })
                }}
                transparent={true}
                headerBorder={true}
            >
                <View className="p-2">
                    <Form
                        {...viewState.data}
                        classContainerName="flex-row flex-wrap w-full  items-start justify-between"
                        onFormSubmit={onFormSubmit}
                    />
                </View>
            </Modal>
        )


    const Badges = components['molecule']['badges'];


    const isShowReply = data?.menu_actions?.items?.find(
        (x) => x.name === 'item-reply'
    )

    return (
        <Animated.View style={isSelected ? animatedStyle : {}}>
            <Row className="gap-2">
                {cells}
                <View className="w-8 min-h-8 z-50 mt-2.5">
                    <View className="w-8 my-0.5 shadow-xs rounded-full">
                        <Profile
                            {...data.author_data}
                            displayType="unit_wo_info"
                            displaySize="sm"
                            showInfo="false"
                        /></View>

                    {items?.length != 0 && view != 'flat' && (
                        <View className="w-0.5 mx-auto top-0.5  rounded-full flex-auto bg-muted"></View>
                    )}
                </View>
                <View className=" flex-col mt-2 flex-1">
                    <View className="bg-muted/50 rounded-xl py-2 px-3 gap-0.5 me-auto max-w-full">
                        <View className="flex-row items-center gap-3 justify-between ">
                            <Row className="gap-3 items-center pr-8">
                                <Profile
                                    {...data.author_data}
                                    displayType="unit_wo_image"
                                    displaySize="sm"
                                    showInfo="false"
                                    showInfo2={<Badges badges={data.author_badges} size="3xs" />}
                                />
                                {maxLevel < data.cmt_level &&
                                    appSetting('comments', 'in_reply') &&
                                    parent?.data && (
                                        <Row className="items-center gap-1">
                                            <Text className="text-secondary-foreground -ml-2 text-xs ">
                                                in reply to
                                            </Text>
                                            <Profile
                                                {...parent.data.author_data}
                                                displayType="unit_wo_image"
                                                displaySize="xs"
                                                showInfo="false"
                                            />
                                        </Row>
                                    )}
                                <Link href={cmtUrl} size="xs" variant="secondary" >
                                    <Time ts={data.cmt_time} className="text-secondary-foreground"></Time>
                                </Link>
                            </Row>
                            {!!data.cmt_mood && (
                                <>

                                    <View className="text-muted-foreground">
                                        <Icon icon='Dot' size={14} />
                                    </View>

                                    <StarsView
                                        rating={data.cmt_mood}
                                        starSize={20}
                                    />
                                </>
                            )}

                            <View className="flex-none absolute -inset-e-1">
                                <MenuManage
                                    id={data.id}
                                    menu={data?.menu_manage}
                                    setViewState={setViewState}
                                    module={props.module}
                                    cmt_object_id={objectId}
                                    cmt_id={commentId}
                                /></View>
                        </View>
                        {view == 'flat' && data.cmt_parent_id > 0 && (
                            <View className="   border border-border/60 rounded-md p-2 my-1">
                                <View className="flex-row items-baseline">
                                    <View>
                                        <Text className="text-xs text-muted-foreground">
                                            In Reply to{' '}
                                        </Text>
                                    </View>
                                    <View className=" "></View>
                                </View>
                                <ContentMore
                                    content={data.cmt_parent.data.cmt_text}
                                    numberOfLines={2}
                                    numberOfSymbols={200}
                                    openSmall={false}
                                    customClassName="u-vanilla-html-small"
                                />
                            </View>
                        )}
                        <View className="max-w-full">
                            <ContentMore
                                content={data.cmt_text}
                                numberOfLines={3}
                                numberOfSymbols={360}
                                openSmall={false}
                                showLess={true}
                                customClassName="u-vanilla-html-small"
                            />
                            {!!data.embed && (
                                <View>
                                    <Embed data={data.embed} size="small" />
                                </View>
                            )}
                        </View>
                        {viewState.view != 'edited' && imageList?.length > 0 && (
                            <View className="max-w-xs w-full">
                                {/* max-w-xs: tiles never need more than 320px of image */}
                                <Carousel data={imageList} maxWidth={320} />
                            </View>
                        )}
                        {viewState.view != 'edited' && fileList.length > 0 && (
                            <View className="max-w-xs w-full gap-1">
                                {fileList.map((file) => (
                                    <FileCard key={file.file_id} href={file.file} name={file.file_name} size={file.file_size} compact />
                                ))}
                            </View>
                        )}
                    </View>
                    {(viewState.view != 'edited' && !data.disabled) && (
                        <Row className="gap-2">
                            {(!!currentUser && isShowReply) && (
                                props.handleReply === 'link' ? (
                                    <View>
                                        <NeoButtonLink
                                            href={`${props.contentUrl}#cmt_id=${data.cmt_id}`}
                                            style="borderless"
                                            controlSize="mini"
                                            borderShape="capsule"
                                            align="start"
                                            image="MessageCircle"
                                            label={t('Reply')}
                                        />
                                    </View>
                                ) : (
                                    <NeoButton
                                        style="borderless"
                                        controlSize="mini"
                                        borderShape="capsule"
                                        align="start"
                                        image="MessageCircle"
                                        label={t('Reply')}
                                        haptics={false}
                                        onPress={() => handleReply(data)}
                                    />
                                )
                            )}
                            <View className="flex-row flex-auto gap-2 ">
                                {data.menu_actions?.items?.length > 0 && <Menu
                                    {...data.menu_actions}
                                    displayType="element"
                                    showMatched={true}
                                    params={{
                                        show_action: true,
                                        show_counter: false,
                                        show_combined: false,
                                        button_size: 'xs',
                                        button_variant: 'link',
                                        button_rounded: true,
                                    }}
                                />}

                                <View className="ml-auto flex-row items-center gap-1">
                                    {data.menu_actions?.items?.length > 0 && <Menu
                                        {...data.menu_actions}
                                        displayType="element"
                                        showMatched={true}
                                        params={{
                                            show_action: false,
                                            show_counter: true,
                                            show_combined: false,
                                            button_size: 'xs',
                                            button_variant: 'link',
                                            button_rounded: true,
                                        }}
                                    />}
                                </View>
                            </View>
                        </Row>
                    )}
                </View>
            </Row>
        </Animated.View>
    )
}

const MenuManage = ({
    id,
    menu,
    setViewState,
    module,
    cmt_object_id,
    cmt_id,
}) => {
    const [menuData, setMenuData] = useState(false)
    const { t } = useTranslation()

    if (!menu?.object) return null

    if (menu.items)
        return (
            <MenuManage_
                id={id}
                menu={menu}
                setViewState={setViewState}
                module={module}
                cmt_object_id={cmt_object_id}
                cmt_id={cmt_id}
            />
        )

    if (!menuData)
        return (
            <NeoButton
                style="borderless"
                controlSize="mini"
                borderShape="circle"
                image="Ellipsis"
                accessibilityLabel={t('More options')}
                onPress={() => {
                    if (Platform.OS === 'web')
                        setMenuData({ ...menu, items: [{ name: 'loader' }] })
                    getDataForMenu(menu, setMenuData)
                }}
            />
        )

    return (
        <MenuManage_
            id={id}
            menu={menuData}
            defaultOpen={true}
            setViewState={setViewState}
            module={module}
            cmt_object_id={cmt_object_id}
            cmt_id={cmt_id}
        />
    )
}

const MenuManage_ = memo(
    ({
        id,
        menu,
        setViewState,
        defaultOpen,
        module,
        cmt_object_id,
        cmt_id,
    }) => {
        let { currentUser, setCurrentUser } = useCurrentUser()
        const { t } = useTranslation()

        //const refReport = useRef(null);
        //const [reportTitle, setReportTitle] = useState(null);
        const handleManageMenuSelect = async (oItem, event) => {
            switch (oItem.name) {
                case 'item-edit':
                    const result1 = await fetcher(
                        '/api.php?r=' +
                        appSetting('urls', 'cmts') +
                        '/&params[]={"module":"' +
                        module +
                        '","object_id":' +
                        cmt_object_id +
                        ',"action":"edit","id":' +
                        cmt_id +
                        '}'
                    )
                    setViewState({ view: 'edited', data: result1.data.form })
                    break

                case 'item-delete':
                    const result = await fetcher(
                        '/api.php?r=' +
                        appSetting('urls', 'cmts') +
                        '/&params[]={"module":"' +
                        module +
                        '","object_id":' +
                        cmt_object_id +
                        ',"action":"remove","id":' +
                        cmt_id +
                        '}'
                    )
                    emitter.emit(EVENTS.commentThread(module, cmt_object_id), { action: 'remove_content', data: { id: cmt_id } });
                    //setViewState({ view: 'deleted' })
                    // props.handleDelete()
                    break

                /* case 'item-report':
                 refReport.current.report(event);
                 break;*/
            }
        }

        let oReport = undefined
        // const aMenuManageItems = menuItemsByName('comments_manage_menu', data.menu_manage.items, currentUser).map(
        const aMenuManageItems = !!currentUser
            ? menu &&
            menuItemsByName(
                'comments_manage_menu',
                menu?.items,
                currentUser
            ).map((aItem) => {
                let sTitle = aItem.title
                if (!!aItem.display_type && aItem.display_type == 'element') {
                    const Element = components['molecule'][String(aItem.data.type)]
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
            })
            : []

        return (
            aMenuManageItems?.length > 0 && (
                <>
                    <DropdownMenu
                        mode="popup"
                        defaultOpen={defaultOpen}
                        items={aMenuManageItems.map((aItem) => {
                            return {
                                id: aItem.id ? aItem.id : aItem.name,
                                name: aItem.name,
                                link: aItem.link,
                                title: aItem.title,
                            }
                        })}
                        onSelect={handleManageMenuSelect}
                        buttonProps={{
                            style: 'borderless',
                            controlSize: 'mini',
                            borderShape: 'circle',
                            image: 'Ellipsis',
                            accessibilityLabel: t('More options'),
                        }}
                    />
                    {!!oReport && oReport}
                </>
            )
        )
    }
)
