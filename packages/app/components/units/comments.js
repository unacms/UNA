import { useMemo, useRef, memo, useCallback } from 'react'
import { Platform } from 'react-native'
import { menuItemsByName, linkify, FeedbackHaptics } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button } from 'app/design/controls'
import Html from 'app/ui/atoms/html'
import Time from 'app/ui/atoms/time'
import Profile from 'app/ui/molecules/profile'
import { ContentMore } from 'app/ui/molecules/contentmore'
import Embed from 'app/ui/molecules/embed'
import Menu from 'app/components/menu'
import { useCurrentUser } from 'app/context/user'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import React from 'react'
import { fetcher } from 'app/lib/fetcher'
import { useState, useEffect } from 'react'
import Form from 'app/components/elements/form'
//import useSWR from "swr";
import useFetchForm from 'app/lib/hooks/fetch'
import { useTranslation } from 'react-i18next'
import Link from 'app/ui/atoms/link'
import { stripTags, appSetting, getDataForMenu } from 'app/lib/util'
import Carousel from 'app/ui/molecules/carousel'
import { getComponent } from 'app/components/registry'
import { StarsView } from 'app/ui/atoms/stars'
import { Modal } from 'app/design/controls'
import Loading from 'app/ui/atoms/loading'
import { Animated, StyleSheet } from 'react-native'
import { Theme } from 'app/design/theme'
import { cd } from 'app/lib/util'
import { Icon } from 'app/ui/atoms/icon'
import { usePulseOne }  from 'app/lib/hooks/usePulseOnce'

export default function UnitComments(props) {
    const { t } = useTranslation()
    let { currentUser } = useCurrentUser()
    const [viewState, setViewState] = useState({ view: '' })
    const [postData, setPostData] = useState(null)

    let level = props.level || 0
    let lvls = props.lvls || []
    let data = props.data
    let items = props.items
    let view = props.view
    let files = props.files
    let maxLevel = props.max_level
    let parent = props.parent

    const handleReply = useCallback(
        (data, isNoReaction) => {
            if (!isNoReaction) FeedbackHaptics('Medium')
            props.handleReply(data)
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
                <View key={`sp-${level}-${i}`} className="w-10">
                    {lvls[i + 1] && (
                        <View className="ml-4 w-0.5 flex-auto bg-muted" />
                    )}
                    {i === level - 1 && (
                        <View className=" ml-4 h-8 w-8 border-muted border-l-2 border-b-2 absolute  rounded-bl-3xl flex-auto" />
                    )}
                </View>
            )
        }
        return cellsArray
    }, [level, maxLevel, lvls])

    const imageList = useMemo(
        () =>
            files.map((obj) => ({
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
            <Row className={`${cd('gap-sm')}`}>
                {cells}
                <View className="w-9 z-50 flex-0 mt-3">
                    <Profile
                        {...data.author_data}
                        displayType="unit_wo_info"
                        displaySize="sm"
                        showInfo="false"
                    />

                    {items.length != 0 && view != 'flat' && (
                        <View className="w-0.5 ml-4 top-0.5 flex-auto bg-muted"></View>
                    )}
                </View>
                <View className="flex-1 flex-col gap-0.5 mt-3">
                <View className="bg-muted/60 flex-1 rounded-xl px-2.5 py-2 gap-1">
                    <View className="flex-row items-center justify-between gap-1 ">
                        <Profile
                            {...data.author_data}
                            displayType="unit_wo_image"
                            displaySize="sm"
                            showInfo="false"
                            showInfo2={<Badges badges={data.author_badges} size="xs" />}
                        />

                        <Link href={data.cmt_url} size="sm" variant="ghost" emulate={true}>
                            <Time ts={data.cmt_time}></Time>
                        </Link>
                        {!!data.cmt_mood && (
                            <>
                                <View>
                                <View className="text-muted -mx-1">
                        <Icon icon='Dot' size={16}  />
                    </View>  
                                </View>
                                <StarsView
                                    rating={data.cmt_mood}
                                    starSize={20}
                                />
                            </>
                        )}
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
                                    {false && (
                                        <Text className="text-muted-foreground px-1 text-sm whitespace-nowrap text-ellipsis overflow-hidden">
                                            {' '}
                                            {stripTags(parent?.data?.cmt_text)}
                                        </Text>
                                    )}
                                </Row>
                            )}
                    </View>
                    {view == 'flat' && data.cmt_parent_id > 0 && (
                        <View className="   border border-border/80 rounded-md p-2 my-1">
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
                                numberOfLines={1}
                                openSmall={false}
                                textClassName=" text-base text-muted-foreground"
                            />
                        </View>
                    )}
                    <View className="">
                        <Html
                            htmlStyles={{ fontSize: 16 }}
                            customClassName="u-vanilla-html-small"
                            data={linkify(data.cmt_text)}
                        />
                        {!!data.embed && (
                            <View>
                                <Embed data={data.embed} size="small" />
                            </View>
                        )}
                    </View>
                    {viewState.view != 'edited' && imageList.length > 0 && (
                        <View className="max-w-xs w-full">
                            <Carousel data={imageList} />
                        </View>
                    )}
                   
                   
                </View>
                {(viewState.view != 'edited' && !data.disabled) && (
                        <Row className="gap-1">
                            {!!currentUser &&
                            !!props.handleReply &&
                            !props.module.includes('_reviews') ? (
                                
                                    <Button
                                        align="start"
                                        title={t('Reply')}
                                        size="xs"
                                        rounded
                                        startDecorator="MessageCircle"
                                        variant="text"
                                        onPress={() => handleReply(data)}
                                    />
                                
                            ) : (
                                <View></View>
                            )}
                            {!!currentUser &&
                            !props.handleReply &&
                            !props.module.includes('_reviews') ? (
                                <View className=" ">
                                    <Link
                                        href={
                                            props.contentUrl +
                                            '#cmt_id=' +
                                            data.cmt_id
                                        }
                                    >
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
                                <View></View>
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

    if (!menu.object) return null

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
                    setViewState({ view: 'deleted' })
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
