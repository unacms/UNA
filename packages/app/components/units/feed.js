import { useState, useMemo } from 'react'
import { appSetting, cd, cloneObject } from 'app/lib/util'
import { View, Row, Pressable } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher'
import { useTranslation } from 'react-i18next'
import {
    CommentsModal,
    CommentsSection,
    MenuManage,
    ActionMenu,
    CounterMenu,
    Author,
    UnitFeed,
    SmallUnit,
    prepareData,
    MainContent,
    FeedEditForm,
} from 'app/lib/feed-helpers'
import { Platform } from 'react-native'
import { CardList, CardFooter } from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/atoms/animated-block'

function DefaultUnit({ data }) {
    const isWeb = Platform.OS === 'web'
    const { t } = useTranslation()

    const [viewState, setViewState] = useState({ view: '' })
    const [cmtsData, setCmtsData] = useState(false)

    const isCommentsModal =
        appSetting('comments', 'show_modal_in_feed') && isWeb
    const { url, commentsData, isShowMoreComments } = useMemo(
        () => prepareData(data),
        [data]
    )

    const MainContentComponent = useMemo(
        () => <MainContent url={url} data={data} />,
        [url, data]
    )

    const showCommentsModal = async (initFormData) => {
        let menu_actions2 = cloneObject(data.menu_actions)
        menu_actions2.items = menu_actions2.items.filter(
            (x) => x.name !== "item-comment"
        );
        console.log("menu_actions2", menu_actions2)


        let res = await fetcher(
            '/api.php?r=' +
            appSetting('urls', 'cmts') +
            '/&params[]={"module":"' +
            data?.cmts?.module +
            '","object_id":' +
            data?.cmts?.object_id +
            '}'
        )
        res?.data?.form?.data?.inputs?.cmt_text &&
            (res.data.form.data.inputs.cmt_text.autofocus = true)
        setCmtsData({
            title: data.author_data.display_name + "'s post",
            data: (
                <CommentsModal
                    initFormData={initFormData}
                    itemContent={{
                        id: 'block-comments',
                        data: (
                            <>
                                <View className="gap-3 p-3 sm:px-4">
                                    <Author data={data} url={url} t={t} />
                                    {MainContentComponent}
                                    <Row className="gap-2 items-center flex-auto justify-between flex-wrap-reverse">
                                        <ActionMenu
                                            data={menu_actions2}
                                            showCommentsModal={showCommentsModal}
                                        />
                                        {!!data.menu_counters &&
                                            appSetting('feed', 'counters_menu') && (
                                                <CounterMenu
                                                    data={data.menu_counters}
                                                    showCommentsModal={showCommentsModal}
                                                />
                                            )}

                                    </Row>
                                </View>

                            </>
                        ),
                    }}
                    commentsData={res.data}
                />
            ),
        })
    }
    if (isCommentsModal) {
        const commentItem = data.menu_actions.items.find(
            (x) => x.name === 'item-comment'
        )
        if (commentItem?.data) {
            commentItem.data.callback = showCommentsModal
        }
    }

    if (viewState.view == 'deleted') return <></>

    return (
        <AnimatedBlock>
            {viewState.view == 'edited' && (
                <FeedEditForm
                    setViewState={setViewState}
                    id={data.id}
                    viewState={viewState}
                />
            )}
            {isCommentsModal && (
                <Modal
                    outerClickClose={false}
                    onClose={() => setCmtsData(false)}
                    onVisible={!!cmtsData}
                    title={cmtsData.title}
                    padding=""
                >
                    {cmtsData.data}
                </Modal>
            )}
            <CardList>
                <Row className="gap-3 flex-auto mb-3">
                    <Author data={data} url={url} t={t} />
                    <View className="flex-none mb-auto hidden">
                        <MenuManage
                            id={data.id}
                            menu={data?.menu_manage}
                            setViewState={setViewState}
                        />
                    </View>
                </Row>
                <View className="flex-auto mb-2">
                    {MainContentComponent}
                </View>
                <Row className="-mx-1.5">
                {!!data.menu_counters && appSetting('feed', 'counters_menu') && (
                            <CounterMenu
                                data={data.menu_counters}
                                showCommentsModal={showCommentsModal}
                            />
                )}   
                 </Row>
                <Row className=" gap-3 items-center flex-auto justify-between pt-1.5 mt-1 -mx-2 -mb-2  border-t border-border/40">
                    <ActionMenu
                        data={data.menu_actions}
                        showCommentsModal={showCommentsModal}
                    />
                     <MenuManage
                            id={data.id}
                            menu={data?.menu_manage}
                            setViewState={setViewState}
                        />
                 

                </Row>

                {commentsData && (
                    <CommentsSection
                        url={url}
                        t={t}
                        isCommentsModal={isCommentsModal}
                        showCommentsModal={showCommentsModal}
                        commentsDataInline={commentsData}
                        data={data}
                        isShowMoreComments={isShowMoreComments}
                    />
                )}
                
            </CardList>
        </AnimatedBlock>
    )
}

export default function UnitFeed_({ data, mode }) {
    return (
        <UnitFeed
            data={data}
            mode={mode}
            SmallUnit={SmallUnit}
            DefaultUnit={DefaultUnit}
        />
    )
}
