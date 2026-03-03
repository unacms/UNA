import { useMemo, memo, useCallback, useState, useEffect } from 'react'
import { Platform, Animated } from 'react-native'
import { menuItemsByName, linkify, FeedbackHaptics, stripTags, appSetting, getDataForMenu, cd } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import Time from 'app/ui/atoms/time'
import Profile from 'app/ui/molecules/profile'
import { ContentMore } from 'app/ui/molecules/contentmore'
import Embed from 'app/ui/molecules/embed'
import Menu from 'app/components/menu'
import { useCurrentUser } from 'app/context/user'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { fetcher } from 'app/lib/fetcher'
import Form from 'app/components/elements/form'
import useFetchForm from 'app/lib/hooks/fetch'
import { useTranslation } from 'react-i18next'
import Link from 'app/ui/atoms/link'
import Carousel from 'app/ui/molecules/carousel'
import { getComponent } from 'app/components/registry'
import { StarsView } from 'app/ui/atoms/stars'
import Loading from 'app/ui/atoms/loading'
import { Icon } from 'app/ui/atoms/icon'
import { usePulseOne } from 'app/lib/hooks/usePulseOnce'
import emitter from 'app/context/emitter';
import { CardList } from 'app/ui/molecules/card'
import { getPageData } from 'app/lib/util';
import FormModal from 'app/ui/molecules/form_modal';

export default function UnitComments(props) {
    const UnitView = props.mode == 'search' ? UnitCommentsSearch : UnitCommentsDefault
    return <UnitView {...props}/>
}

function UnitCommentsSearch(props) {
    const module = props.module.replace("_cmts", '');
    const [pageData, setPageData] = useState(false);

    const keys = Object.keys(props.data);
    const url = props?.data[keys[0]].data.cmt_url;

    const isCommentsModal = appSetting('browse', 'show_in_modal', module) 

    const showCommentsModal = async (initFormData) => {
        const url2 = url;
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
                    <UnitCommentsDefault contentUrl={url} handleReply = {isCommentsModal ? showCommentsModal : 'link'} {...props.data[keys[0]]}/>
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
    let data = props.data
    const items = props.items
    const view = props.view
    let files = props.files
    const maxLevel = props.max_level
    const parent = props.parent

    const module = props.module;
    const objectId = props.data.cmt_object_id;

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
                emitter.emit(`comment_${module}_${objectId}`, { action: 'reply_comment', data: data });
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

    if (!data) return null

    const { data: dynamicData, error } = useFetchForm(
        '/api.php?r=' +
        appSetting('urls', 'cmts') +
        '/&params[]={"module":"' +
        props.module +
        '","object_id":' +
        props.data.cmt_object_id +
        ',"action":"edit","id":' +
        props.data.cmt_id +
        '}',
        postData
    )

    if (dynamicData?.data?.browse?.data?.data[0]['i' + props.data.cmt_id]) {
        data =
            dynamicData?.data?.browse?.data?.data[0]['i' + props.data.cmt_id]
                .data
        files =
            dynamicData?.data?.browse?.data?.data[0]['i' + props.data.cmt_id]
                .files
    }

    const onFormSubmit = useCallback((formData) => {
        setViewState({ view: '' })
        setPostData(formData)
    }, [])

    const cells = useMemo(() => {
        const cellsArray = []
        const effectiveLevel = Math.min(level, maxLevel)
        for (let i = 0; i < effectiveLevel; i++) {
            cellsArray.push(
                <View key={`sp-${level}-${i}`} className="w-8">
                    {lvls[i + 1] && (
                        <View className="mx-auto w-0.5 gap-0.5 -my-3 left-0.5 flex-auto">
                            <View className="mx-auto w-0.5 flex-auto bg-muted rounded-b-full" />
                            <View className="mx-auto w-0.5 h-0.5 flex-none bg-muted rounded-full" />
                            <View className="mx-auto w-0.5 h-0.5 flex-none bg-muted rounded-full" />
                            <View className="mx-auto w-0.5 h-0.5 flex-none bg-muted rounded-full" />

                        </View>
                    )}
                    {i === level - 1 && (
                        <View className=" ml-4 h-8 w-6 border-muted border-l-2 border-b-2 absolute start-px top-0 rounded-bl-lg flex-auto" />
                    )}
                </View>
            )
        }
        return cellsArray
    }, [level, maxLevel, lvls])

    const imageList = useMemo(
        () =>
            files?.map((obj) => ({
                src: obj.file,
                width: obj.width,
                height: obj.height,
                type: 'image',
            })),
        [files]
    )

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


    const Badges = getComponent('molecule', 'badges')

    return (
        <Animated.View style={isSelected ? animatedStyle : {}}>
            <Row className="gap-2">
                {cells}
                <View className="w-9 min-h-9 p-0.5 z-50 flex-0 mt-3">
                    <Profile
                        {...data.author_data}
                        displayType="unit_wo_info"
                        displaySize="sm"
                        showInfo="false"
                    />

                    {items?.length != 0 && view != 'flat' && (
                        <View className="w-0.5 mx-auto top-0.5 -mb-3 rounded-full flex-auto bg-muted"></View>
                    )}
                </View>
                <View className="flex-1 flex-col gap-1 mt-3">
                    <View className="bg-muted/60 rounded-xl px-2.5 py-2 gap-1 ">
                        <View className="flex-row items-center gap-2 ">
                            <Row>
                                <Profile
                                    {...data.author_data}
                                    displayType="unit_wo_image"
                                    displaySize="sm"
                                    showInfo="false"
                                    showInfo2={<Badges badges={data.author_badges} size="2xs" />}
                                />
                                {maxLevel < data.cmt_level &&
                                    appSetting('comments', 'in_reply') &&
                                    parent?.data && (
                                        <Row>
                                            <Text className="text-muted-foreground px-1 text-sm ">
                                                · In reply to
                                            </Text>
                                            <Profile
                                                {...parent.data.author_data}
                                                displayType="unit_wo_image"
                                                displaySize="sm"
                                                showInfo="false"
                                            />
                                        </Row>
                                    )}
                            </Row>
                            {!!data.cmt_mood && (
                                <>
                                    <View>
                                        <View className="text-muted-foreground -mx-0.5 ">
                                            <Icon icon='Dot' size={14} />
                                        </View>
                                    </View>
                                    <StarsView
                                        rating={data.cmt_mood}
                                        starSize={20}
                                    />
                                </>
                            )}

                            <Link href={cmtUrl} size="sm" variant="default" >
                                <Time ts={data.cmt_time}></Time>
                            </Link>
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
                        <View className="">
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
                                <Carousel data={imageList} />
                            </View>
                        )}
                    </View>
                    {(viewState.view != 'edited' && !data.disabled) && (
                        <Row className="gap-1">
                            {!!currentUser && (
                                props.handleReply === 'link' ? (
                                    <View>
                                        <Link href={`${props.contentUrl}#cmt_id=${data.cmt_id}`}>
                                            <Button
                                                align="start"
                                                title={t('Reply')}
                                                size="xs"
                                                rounded
                                                startDecorator="MessageCircle"
                                                variant="text"
                                            />
                                        </Link>
                                    </View>
                                ) : (
                                    <Button
                                        align="start"
                                        title={t('Reply')}
                                        size="xs"
                                        rounded
                                        startDecorator="MessageCircle"
                                        variant="text"
                                        onPress={() => handleReply(data)}
                                    />
                                )
                            )}
                            <View className="flex-row flex-auto gap-1 ">
                                <Menu
                                    {...data.menu_actions}
                                    displayType="element"
                                    showMatched={true}
                                    params={{
                                        show_action: true,
                                        show_counter: false,
                                        show_combined: false,
                                        button_size: 'xs',
                                        button_variant: 'text',
                                        button_rounded: true,
                                    }}
                                />

                                <View className="ml-auto flex-row items-center gap-1">
                                    <Menu
                                        {...data.menu_actions}
                                        displayType="element"
                                        showMatched={true}
                                        params={{
                                            show_action: false,
                                            show_counter: true,
                                            show_combined: false,
                                            button_size: 'xs',
                                            button_variant: 'text',
                                            button_rounded: true,
                                        }}
                                    />

                                    <MenuManage
                                        id={data.id}
                                        menu={data?.menu_manage}
                                        setViewState={setViewState}
                                        module={props.module}
                                        cmt_object_id={props.data.cmt_object_id}
                                        cmt_id={props.data.cmt_id}
                                    />
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
            <Button
                variant="text"
                size="xs"
                rounded
                startDecorator="Ellipsis"
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
                    emitter.emit(`comment_${module}_${cmt_object_id}`, { action: 'remove_content', data: { id: cmt_id } });
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
            })
            : []

        return (
            aMenuManageItems?.length > 0 && (
                <>
                    <DropdownMenu
                        mode = "popup"
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
                    >
                        <Button
                            variant="text"
                            size="xs"
                            startDecorator="Ellipsis"
                            rounded
                        />
                    </DropdownMenu>
                    {!!oReport && oReport}
                </>
            )
        )
    }
)
