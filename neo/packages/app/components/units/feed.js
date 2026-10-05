import { useState, useMemo, useCallback } from 'react'
import { appSetting } from 'app/lib/util'
import { View, Row } from 'app/design/view'
import { useTranslation } from 'react-i18next'
import { NeoButtonLink } from 'app/design/controls'

import {
    CommentsSection,
    MenuManage,
    ActionMenu,
    CounterMenu,
    Author,
    AuthorActions,
    UnitFeed,
    SmallUnit,
    prepareData,
    MainContent,
    FeedEditForm,
} from 'app/components/elements/feed-item-parts'

import { CardList, CardHeader, CardTitle } from 'app/ui/molecules/page/card';
import AnimatedBlock from 'app/ui/atoms/animated-block'
import { components } from 'app/components/registry'
import Scroll from 'app/ui/molecules/page/scroll'
import { useOpenModalByUrl } from 'app/context/jotai/modal';
import { isFeedModalHash, getFeedModalHistoryUrl } from 'app/ui/molecules/dialogs/form-modal';
import { Skeleton } from 'app/ui/atoms/skeleton';

function TimelineRecommendations({ data }) {
    const { t } = useTranslation()
    const Unit = components['content-list'][data.module]

    return (
        <AnimatedBlock>
            <CardList className="mb-0.5 sm:mb-4" padding="py-2 overflow-hidden">
                <CardHeader className=" px-3 lg:px-4 pt-2 sm:pt-3 flex-row items-center justify-between">
                    <CardTitle className="text-secondary-foreground">{t(data.title)}</CardTitle>
                </CardHeader>
                <View className="overflow-hidden px-px ">
                    <Scroll horizontal={true} step={300} className='w-full'>
                        <Row className="gap-3 bg-background/60 mt-3 p-3">
                            {data.content.data.map((item, index) => (
                                <View className="w-[320px] gap-x-4" key={item.id ?? index}>
                                    <Unit data={item} module={data.module} unitType={'context_recommendations'} />
                                </View>
                            ))}
                        </Row>
                    </Scroll>
                </View>
                <View className="p-2">
                    <NeoButtonLink
                        href={data.content.page_url}
                        label={t('View all')}
                        style="link"
                        controlSize="small"
                        width="fill"
                        haptics="Medium"
                    />
                </View>
            </CardList>
        </AnimatedBlock>
    )
}

/**
 * Copy of a UNA menu with `callback` set on its `item-comment` entry. A copy,
 * not an in-place edit: `data` is the query cache object, shared by every
 * render and reader of the feed.
 */
function withCommentCallback(menu, callback) {
    if (!menu?.items?.some((x) => x.name === 'item-comment' && x.data)) return menu
    return {
        ...menu,
        items: menu.items.map((x) =>
            x.name === 'item-comment' && x.data
                ? { ...x, data: { ...x.data, callback } }
                : x
        ),
    }
}

function DefaultUnit({ data }) {
    if (data.type == 'timeline_recommendations') {
        return <TimelineRecommendations data={data} />
    }

    return <DefaultFeedUnit data={data} />
}

function DefaultFeedUnit({ data }) {
    const isSkeleton = data?.skeleton;
    const { t } = useTranslation()
    const [viewState, setViewState] = useState({ view: '' })
    const openModalByUrl = useOpenModalByUrl();

    const isCommentsModal = appSetting('browse', 'show_in_modal', 'bx_timeline') // && isWeb
    const { url, commentsData, isShowMoreComments } = useMemo(
        () => prepareData(data),
        [data]
    )

    const showCommentsModal = useCallback((initFormData) => {
        const url2 = (url.startsWith('/') ? url.slice(1) : url) + (initFormData?.cmt_id > 0 ? '#cmt_id=' + initFormData?.cmt_id : '#cmts');
        // #cmts (scroll + focus the comment form) is only for the click, not for reopening after reload
        openModalByUrl(url2, isFeedModalHash() ? getFeedModalHistoryUrl(url2.replace(/#cmts$/, '')) : '');
    }, [url, openModalByUrl])

    const menuActions = useMemo(
        () => isCommentsModal ? withCommentCallback(data?.menu_actions, showCommentsModal) : data?.menu_actions,
        [isCommentsModal, data?.menu_actions, showCommentsModal]
    )
    const menuCounters = useMemo(
        () => isCommentsModal ? withCommentCallback(data?.menu_counters, showCommentsModal) : data?.menu_counters,
        [isCommentsModal, data?.menu_counters, showCommentsModal]
    )

    if (viewState.view == 'deleted') return null

    return (
        <AnimatedBlock>
            {viewState.view == 'edited' && (
                <FeedEditForm
                    setViewState={setViewState}
                    id={data.id}
                    viewState={viewState}
                />
            )}
            <CardList
                border="border-y border-x-none sm:border-x"
                className="mb-0.5 sm:mb-3"
                padding="px-0"
               
            >
                <Row className="gap-3 p-4 pb-3 flex-auto">
                    <Skeleton visible={isSkeleton} preset='feed_author'>
                        <Author data={data} url={url} t={t} />
                        <Row className="flex-none mb-auto items-center gap-1">
                            <AuthorActions data={data} />
                            <MenuManage
                                id={data.id}
                                menu={data?.menu_manage}
                                setViewState={setViewState}
                                data={data}
                            />
                        </Row>
                    </Skeleton>
                </Row>
                <View className="flex-auto px-4 ">
                    <Skeleton visible={isSkeleton} preset='multitext'>
                        <MainContent url={url} data={data} />
                    </Skeleton>
                </View>
                {!!menuCounters?.items?.length && <>
                
                    <View className="flex-auto px-4 ">
                        {appSetting('feed', 'counters_menu') && (
                            <CounterMenu
                                data={menuCounters}
                            />
                        )}
                    </View>
                </>}

                <Row className="gap-2 items-center flex-auto justify-between p-4 pt-3  ">
                    <ActionMenu
                        data={menuActions}
                    />
                    <View className="flex-none hidden">
                        <MenuManage
                            id={data.id}
                            menu={data?.menu_manage}
                            setViewState={setViewState}
                            data={data}
                        /></View>
                </Row>
                {commentsData && (
                    <View className="">
                        <CommentsSection
                            url={url}
                            t={t}
                            isCommentsModal={isCommentsModal}
                            showCommentsModal={showCommentsModal}
                            commentsDataInline={commentsData}
                            data={data}
                            isShowMoreComments={isShowMoreComments}
                        />
                    </View>
                )}
            </CardList>
        </AnimatedBlock>
    )
}

function SearchUnit({ data }) {
    return <View className="@lg/list:p-1.5"><UnitFeed_ data={{ ...data, cmts: {} }} /></View>
}

export default function UnitFeed_({ data, mode }) {
    const UnitView = mode == 'search' ? SearchUnit : UnitFeed
    return (
        <UnitView
            data={data}
            mode={mode}
            SmallUnit={SmallUnit}
            DefaultUnit={DefaultUnit}
        />
    )
}
