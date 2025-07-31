import { useState, useMemo } from 'react'
import { appSetting } from 'app/lib/util'
import { View } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher'
import { Block, BlockHeader, BlockContent, BlockFooter, BlockName, BlockActions } from 'app/ui/molecules/page-block';
import { useTranslation } from 'react-i18next';
import { CommentsModal, CommentsSection, MenuManage, ActionMenu, CounterMenu, Author, UnitFeed, SmallUnit, prepareData, MainContent, FeedEditForm } from 'app/lib/feed-helpers'
import { Platform } from 'react-native'

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
            title: data.author_data.display_name + "'s post", data: <CommentsModal initFormData={initFormData}
                itemContent={{
                    id: "block-comments", data: <><View className='sm:px-4 sm:pb-3 mt-4'><Author data={data} url={url} t={t} />{MainContentComponent}</View></>
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
        <Block className={"mb-md tl-" + data.id}>
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
            <BlockHeader>
                <BlockName><Author data={data} url={url} t={t} /></BlockName>
                <BlockActions>
                    <MenuManage id={data.id} menu={data?.menu_manage} setViewState={setViewState} />
                </BlockActions>
            </BlockHeader>
            <BlockContent>
                {MainContentComponent}
                {(!!data.menu_counters && appSetting('feed', 'counters_menu')) && <CounterMenu data={data.menu_counters} showCommentsModal={showCommentsModal} />}
            </BlockContent>
            <BlockFooter>
                <ActionMenu data={data.menu_actions} showCommentsModal={showCommentsModal} />
                {commentsData && <CommentsSection url={url} t={t} isCommentsModal={isCommentsModal} showCommentsModal={showCommentsModal} commentsDataInline={commentsData} data={data} isShowMoreComments={isShowMoreComments} />}
            </BlockFooter>
        </Block>
    )
}

export default function UnitFeed_({ data, mode }) {
    return <UnitFeed data={data} mode={mode} SmallUnit={SmallUnit} DefaultUnit={DefaultUnit} />
}
