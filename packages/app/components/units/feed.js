import { useState, useMemo } from 'react'
import { appSetting } from 'app/lib/util'
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useTranslation } from 'react-i18next'
import {
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

import {
    CardList,
    CardHeader,
    CardTitle,
    CardContent,
} from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/atoms/animated-block'
import { getComponent } from 'app/components/registry'
import Scroll from 'app/ui/molecules/scroll'
import Link from 'app/ui/atoms/link'
import { getPageData } from 'app/lib/util';
import FormModal from 'app/ui/molecules/form_modal';
import { Skeleton } from 'app/ui/atoms/skeleton';

function DefaultUnit({ data }) {
    const isSkeleton = data?.skeleton;
    const { t } = useTranslation()
    const [pageData, setPageData] = useState(false);
    const [viewState, setViewState] = useState({ view: '' })

    const isCommentsModal = appSetting('browse', 'show_in_modal', 'bx_timeline') // && isWeb
    const { url, commentsData, isShowMoreComments } = useMemo(
        () => prepareData(data),
        [data]
    )

    const showCommentsModal = async (initFormData) => {
        const url2 = (url.startsWith('/') ? url.slice(1) : url) + (initFormData?.cmt_id > 0 ? '#cmt_id=' + initFormData?.cmt_id : '#cmts');
        setPageData({ data: 'loading', url: url, url2: url2 });
        const sResponse = await getPageData(url2, false);
        if (sResponse.data !== pageData.data) {
            setPageData({ data: sResponse.data, url: url, url2: url2 });
        }
    }

    if (isCommentsModal) {
        const commentItem = data?.menu_actions?.items?.find(
            (x) => x.name === 'item-comment'
        )
        if (commentItem?.data) {
            commentItem.data.callback = showCommentsModal
        }

        const commentItem1 = data?.menu_counters?.items?.find(
            (x) => x.name === 'item-comment'
        )
        if (commentItem1?.data) {
            commentItem1.data.callback = showCommentsModal
        }
    }

    if (viewState.view == 'deleted') return null

    if (data.type == 'timeline_recommendations') {
        const Unit = getComponent('content-list', data.module);
        const contentElement = data.content.data.map((item, index) => {
            return (
                <View className="w-[320px] gap-x-4" key={`item${index}_row`}>
                    <Unit data={item} module={data.module} unitType={'context_recommendations'} />
                </View>
            )
        })
        return (
            <AnimatedBlock>
                <CardList className="mb-0.5 sm:mb-4" padding="py-2 overflow-hidden">
                    <CardHeader className=" px-3 lg:px-4 pt-2 sm:pt-3 flex-row items-center justify-between">
                        <CardTitle className="text-secondary-foreground">{t(data.title)}</CardTitle>
                        
                    </CardHeader>
                    <View className="overflow-hidden px-px ">
                        <Scroll horizontal={true} step={300} className='w-full'><Row className="gap-3 bg-background/60 mt-3 p-3">{contentElement}</Row></Scroll>
                    </View>
                    <View className="p-2 ">
                    <Link
                            variant="primary"
                            size="sm"
                            href={data.content.page_url}
                            haptics="Medium"
                            className="text-center w-full"
                        >
                            <Text>
                                {' '}
                                {t('View all')}
                            </Text>
                        </Link></View>

                </CardList>
            </AnimatedBlock>
        );
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
            <FormModal pageData={pageData.data} setPageData={setPageData} modalView='content_page' url={pageData.url2} />
            <CardList
                border="border-y border-x-none sm:border-x"
                className="mb-0.5 sm:mb-3"
                padding="p-0"
               
            >
                <Row className="gap-3 p-3 lg:p-4 flex-auto">
                    <Skeleton visible={isSkeleton} preset='feed_author'>
                        <Author data={data} url={url} t={t} />
                        <View className="flex-none mb-auto">
                            <MenuManage
                                id={data.id}
                                menu={data?.menu_manage}
                                setViewState={setViewState}
                            />
                        </View>
                    </Skeleton>
                </Row>
                <View className="flex-auto px-3.5 lg:px-4 ">
                    <Skeleton visible={isSkeleton} preset='multitext'>
                        <MainContent url={url} data={data} />
                    </Skeleton>
                </View>
                {!!data.menu_counters?.items?.length && <>
                
                    <View className="flex-auto px-1 lg:px-2 ">
                        {appSetting('feed', 'counters_menu') && (
                            <CounterMenu
                                data={data.menu_counters}
                            />
                        )}
                    </View>
                </>}

                <Row className="gap-2 items-center flex-auto justify-between p-1.5 lg:p-2.5  ">
                    <ActionMenu
                        data={data.menu_actions}
                    />
                    <View className="flex-none hidden">
                        <MenuManage
                            id={data.id}
                            menu={data?.menu_manage}
                            setViewState={setViewState}
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
