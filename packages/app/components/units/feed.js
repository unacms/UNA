import { useState, useMemo } from 'react'
import { appSetting, cd, cloneObject } from 'app/lib/util'
import { View, Row, ScrollView } from 'app/design/view'
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
import { getComponent } from 'app/components/registry';
import { Text } from 'app/design/typography'

function DefaultUnit({ data }) {
    const isWeb = Platform.OS === 'web'
    const { t } = useTranslation()

    const [viewState, setViewState] = useState({ view: '' })
    const [cmtsData, setCmtsData] = useState(false)

    const isCommentsModal =
        appSetting('comments', 'show_modal_in_feed');// && isWeb
    const { url, commentsData, isShowMoreComments } = useMemo(
        () => prepareData(data),
        [data]
    )

    const showCommentsModal = async (initFormData) => {
        let menu_actions2 = cloneObject(data.menu_actions)
        menu_actions2.items = menu_actions2.items.filter(
            (x) => x.name !== "item-comment"
        );

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
                                    <MainContent fulltext={true} url={url} data={data} />
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
    if (data.type == 'timeline_recommendations') {
        const Unit = getComponent('content-list', data.module);
        const contentElement = data.content.data.map((item, index) => {
            return (
                <View className="w-[280px]" key={`item${index}_row`}>
                    <Unit
                        data={item}
                    />
                </View>
            );
        });
        return (
            <AnimatedBlock>
                <Row className="items-center justify-between px-2 my-3">
                    <Text className=" text-card-foreground text-xl font-bold leading-none lg:leading-none tracking-tight ">
                        {t(data.title)}
                    </Text>
                </Row>
                <ScrollView horizontal={true}>
                    <Row className='gap-4 mb-0.5 sm:mb-3 '>{contentElement}</Row>
                </ScrollView>
            </AnimatedBlock>
        )
    }
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

                    onClose={() => setCmtsData(false)}
                    onVisible={!!cmtsData}
                    title={cmtsData.title}
                    padding=""
                >
                    {cmtsData.data}
                </Modal>
            )}
            <CardList border="border-y border-x-none sm:border-x" className="mb-0.5 sm:mb-3">
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
                    <MainContent url={url} data={data} />
                </View>
                <Row className="-mx-1.5">
                    {!!data.menu_counters && appSetting('feed', 'counters_menu') && (
                        <CounterMenu
                            data={data.menu_counters}
                            showCommentsModal={showCommentsModal}
                        />
                    )}
                </Row>
                <Row className=" gap-3 items-center flex-auto justify-between pt-2 mt-1 -mx-1 -mb-1  border-t border-border/40">
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
