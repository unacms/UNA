import { useState, useMemo } from 'react'
import { appSetting, cd } from 'app/lib/util'
import { View } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher'
import { Block, BlockHeader, BlockContent, BlockFooter, BlockName, BlockActions } from 'app/ui/molecules/page-block';
import { useTranslation } from 'react-i18next';
import { CommentsModal, CommentsSection, MenuManage, ActionMenu, CounterMenu, Author, UnitFeed, SmallUnit, prepareData, MainContent, FeedEditForm } from 'app/lib/feed-helpers'
import { Platform } from 'react-native'
import { CardList } from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/atoms/animated-block'

function DefaultUnit({ data }) {

    const isWeb = Platform.OS === 'web';
    const { t } = useTranslation();

    const [viewState, setViewState] = useState({ view: '' })
    const [cmtsData, setCmtsData] = useState(false)

    const isCommentsModal = appSetting('comments', 'show_modal_in_feed') && isWeb;
    const { url, commentsData, isShowMoreComments } = useMemo(() => prepareData(data), [data]);

    const MainContentComponent = useMemo(() => (
        <MainContent
            url={url}
            data={data}
        />
    ), [url, data]);

    const showCommentsModal = async (initFormData) => {
        let res = await fetcher('/api.php?r=' + appSetting("urls", "cmts") + '/&params[]={"module":"' + data?.cmts?.module + '","object_id":' + data?.cmts?.object_id + '}');
        res?.data?.form?.data?.inputs?.cmt_text && (res.data.form.data.inputs.cmt_text.autofocus = true);
        setCmtsData({
            title: data.author_data.display_name + "'s post", 
            data: <CommentsModal initFormData={initFormData}
                itemContent={{
                    id: "block-comments", data: <><View className=' p-3 lg:p-4 gap-3 lg:gap-4 '><Author data={data} url={url} t={t} />{MainContentComponent}</View></>
                }}
                commentsData={res.data} />
        })
    }
    if (isCommentsModal) {
        const commentItem = data.menu_actions.items.find(x => x.name === "item-comment");
        if (commentItem?.data) {
            commentItem.data.callback = showCommentsModal;
        }
    }

    if (viewState.view == 'deleted')
        return <></>

    return (
        <AnimatedBlock>
            {viewState.view == 'edited' && <FeedEditForm setViewState={setViewState} id={data.id} viewState={viewState} />}
            {isCommentsModal && <Modal
                outerClickClose={false}
                onClose={() => setCmtsData(false)}
                onVisible={!!cmtsData}
                title={cmtsData.title}
                padding=''
            >
                {cmtsData.data}
            </Modal>}
            <CardList>
                <View className="flex-auto flex-row gap-3 mb-4">
                    <Author data={data} url={url} t={t} />
                    <View className="flex-none mb-auto">
                        <MenuManage id={data.id} menu={data?.menu_manage} setViewState={setViewState} />
                    </View>
                </View>
                <View className='mb-4'>
                {MainContentComponent}
                </View>
                <View className=' w-full justify-between flex-row flex-wrap-reverse gap-2'>
                    
                    <View className='flex-none '>
                        <ActionMenu data={data.menu_actions} showCommentsModal={showCommentsModal} />
                    </View>
                    <View className='flex-none flex justify-center'>
                        {(!!data.menu_counters && appSetting('feed', 'counters_menu')) && <CounterMenu data={data.menu_counters} showCommentsModal={showCommentsModal} />}
                    </View>
                </View>
                {commentsData && <CommentsSection url={url} t={t} isCommentsModal={isCommentsModal} showCommentsModal={showCommentsModal} commentsDataInline={commentsData} data={data} isShowMoreComments={isShowMoreComments} />}
            </CardList>
        </AnimatedBlock>
    )
}

export default function UnitFeed_({ data, mode }) {
    return <UnitFeed data={data} mode={mode} SmallUnit={SmallUnit} DefaultUnit={DefaultUnit} />
}
