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
        const url2 = (url.startsWith('/') ? url.slice(1) : url) + (initFormData?.cmt_id > 0 ? '#cmt_id=' + initFormData?.cmt_id : '');
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
                <View className="w-[280px]" key={`item${index}_row`}>
                    <Unit data={item} module={data.module} unitType={'context_recommendations'} />
                </View>
            )
        })
        return (
            <AnimatedBlock>
                <CardList className="mb-0.5 sm:mb-3 " padding="p-0.5">
                    <CardHeader className=" px-4 py-3.5 flex-row items-center justify-between">
                        <CardTitle className="text-secondary-foreground">{t(data.title)}</CardTitle>
                        <Link
                            variant="accentghost"
                            size="md"
                            href={data.content.page_url}
                            haptics="Medium"
                        >
                            <Text>
                                {' '}
                                {t('View all')}
                            </Text>
                        </Link>
                    </CardHeader>
                    <CardContent className=" overflow-hidden rounded-b-xl">
                        <Scroll horizontal={true} step={300} className='w-full'><Row className="gap-2 pb-3 px-3">{contentElement}</Row></Scroll>
                    </CardContent>

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
            >
                <Row className="gap-3 flex-auto mb-3">
                    <Skeleton visible={isSkeleton} preset='feed_author'>
                        <Author data={data} url={url} t={t} />
                        <View className="flex-none mb-auto hidden">
                            <MenuManage
                                id={data.id}
                                menu={data?.menu_manage}
                                setViewState={setViewState}
                            />
                        </View>
                    </Skeleton>
                </Row>
                <View className="flex-auto mb-3">
                    <Skeleton visible={isSkeleton} preset='multitext'>
                        <MainContent url={url} data={data} />
                    </Skeleton>
                </View>
                <Row className="border-b border-background -mx-4 px-2.5">
                    {!!data.menu_counters &&
                        appSetting('feed', 'counters_menu') && (
                            <CounterMenu
                                data={data.menu_counters}
                            />
                        )}
                </Row>
                <Row className=" gap-3 items-center flex-auto justify-between pt-2 px-2  -mx-3 lg:-mx-4 -mb-2 border-t border-card">
                    <ActionMenu
                        data={data.menu_actions}
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
