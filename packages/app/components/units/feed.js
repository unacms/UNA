import React, { memo, useState, useEffect, useMemo, useRef } from 'react'
import { View } from 'app/design/view'
import Card from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/molecules/animated-block'
import { useTranslation } from 'react-i18next';
import { CommentsSection, MenuManage, ActionMenu, CounterMenu, Author, UnitFeed, SmallUnit, prepareData, MainContent, FeedEditForm } from 'app/lib/feed-helpers'
import { appSetting } from 'app/lib/util'

function DefaultUnit(data) {
    const { t } = useTranslation();
    const [viewState, setViewState] = useState({ view: '' })

    const { url, commentsData, isShowMoreComments } = useMemo(() => prepareData(data), [data]);

    const MainContentComponent = useMemo(() => (
        <MainContent
            url={url}
            data={data}
        />
    ), [url, data]);

    if (viewState.view == 'deleted')
        return <></>

    if (viewState.view == 'edited')
        return <FeedEditForm setViewState={setViewState} id={data.id} viewState={viewState} />

    // return<View className='w-full h-12 bg-red-500 my-2'><Author data={data} url={url} t={t} /></View>
    return (
        <AnimatedBlock>
            <Card rounded=' rounded-none sm:rounded-2xl ' margin=' mb-[4px] sm:mb-[16px] md:mx-auto ' addClassName={' w-full max-w-2xl px-[12px] sm:px-[16px] pt-[12px] sm:pt-[16px] tl-' + data.id} >
                <View className="flex-auto flex-row items-top">
                    <Author data={data} url={url} t={t} />
                    <View className="flex-auto justify-end flex-row mb-auto ">
                        <MenuManage id={data.id} menu={data?.menu_manage} setViewState={setViewState} />
                    </View>
                </View>

                {MainContentComponent}
                <View className="">
                    {(!!data.menu_counters && appSetting('feed', 'counters_menu')) && <View className='sm:py-[8px] sm:border-b border-bdr dark:border-bdr-d'><CounterMenu data={data.menu_counters}  /></View>}
                    <View className=' py-[8px] mt-[4px] border-t border-bdr dark:border-bdr-d '><ActionMenu data={data.menu_actions} showCommentsModal={false} /></View>
                </View>
                {commentsData && <View className='   '><CommentsSection url={url} t={t} isCommentsModal={false} showCommentsModal={false} commentsDataInline={commentsData} data={data} /></View>}
            </Card>
        </AnimatedBlock>
    )
}

export default function UnitFeed_({ data, mode }) {
    //return useMemo(() => (
    return <UnitFeed data={data} mode={mode} SmallUnit={SmallUnit} DefaultUnit={DefaultUnit} />
    //), [data, mode]);
}
