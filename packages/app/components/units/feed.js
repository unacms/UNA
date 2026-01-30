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


function Skeleton({ }) {
    return <><View className="flex-row gap-x-2 mb-2">
        <View className="relative flex-row">
            <View className="h-10 w-10 aspect-square overflow-hidden bg-muted/60 mx-auto rounded-full">
                <View className="w-[50%] z-20 aspect-square bg-muted  mx-auto rounded-full mt-[15%] "></View>
                <View className="w-[80%] translate-y-0.5 aspect-square bg-muted mx-auto rounded-t-full "></View>
            </View>
        </View>
        <View className="flex-col gap-y-1.5 flex-auto my-auto">
            <View className="w-full  flex-row justify-between">
                <View className="h-3  w-24 bg-muted/60 rounded-full"></View>
                <View className="h-3  w-6 bg-muted/60 rounded-full"></View>
            </View>
            <View className="h-3  w-16 bg-muted/60 rounded-full"></View>
        </View>
    </View>

        <View className="h-3 my-1 w-full bg-muted/60 rounded-full"></View>
        <View className="h-3 my-1 w-full bg-muted/60 rounded-full"></View>
        <View className="h-3 my-1 w-full bg-muted/60 rounded-full"></View>
        <View className="h-3 my-1 w-3/4 bg-muted/60 rounded-full"></View></>
}

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
                {isSkeleton ? <Skeleton /> : <>
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
                    <View className="flex-auto mb-2 px-0.5">
                        <MainContent url={url} data={data} />
                    </View>
                    <Row className="border-b border-background -mx-4 -mb-1 px-3">
                        {!!data.menu_counters &&
                            appSetting('feed', 'counters_menu') && (
                                <CounterMenu
                                    data={data.menu_counters}
                                />
                            )}
                    </Row>
                    <Row className=" gap-3 items-center flex-auto justify-between pt-2 px-2 lg:px-2.5 mt-1 -mx-3 lg:-mx-4 -mb-1.5 border-t border-card">
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
                </>}
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
