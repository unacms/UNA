import { useState, useMemo } from 'react'
import { appSetting, cd } from 'app/lib/util'
import { View, Pressable } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher'
import { Block, BlockHeader, BlockContent, BlockFooter, BlockName, BlockActions } from 'app/ui/molecules/page-block';
import { useTranslation } from 'react-i18next';
import { CommentsModal, CommentsSection, MenuManage, ActionMenu, CounterMenu, Author, UnitFeed, SmallUnit, prepareData, MainContent, FeedEditForm } from 'app/lib/feed-helpers'
import { Platform } from 'react-native'
import { CardList } from 'app/ui/molecules/card'
import AnimatedBlock from 'app/ui/atoms/animated-block'
import Time from 'app/ui/atoms/time'
import { useRouter } from 'app/lib/hooks/router'
import Link from 'app/ui/atoms/link'
import { Icon } from 'app/ui/atoms/icon'

function DefaultUnit({ data }) {

    const isWeb = Platform.OS === 'web';
    const { t } = useTranslation();
    const router = useRouter()

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
               
                    
                    
                    
                        {(!!data.menu_counters && appSetting('feed', 'counters_menu')) && (
                            <View className="flex-row items-center justify-between">
                                {isWeb ? (
                                    <Link href={url} emulate={false}>
                                        <View className={`${cd('px-sm')} ${cd('py-xs')} u-time-hitarea relative flex-row items-center gap-x-1 rounded-md bg-muted text-muted-foreground web:hover:bg-accent web:hover:text-foreground cursor-pointer whitespace-nowrap`}>
                                            <Icon icon="Clock" width={16} height={16} className="" />
                                            <Time numberOfLines={1} stylesName='inline text-sm leading-5 tracking-tight whitespace-nowrap' ts={data.date} />
                                        </View>
                                    </Link>
                                ) : (
                                    <Link href={url} mode="text">
                                        <Pressable hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className={`${cd('px-sm')} ${cd('py-xs')} flex-row flex-nowrap items-center flex-none rounded-md bg-muted text-muted-foreground`}>
                                            <Icon icon="Clock" width={16} height={16} className="mr-1" />
                                            <Time numberOfLines={1} stylesName='inline text-sm leading-5 tracking-tight whitespace-nowrap' ts={data.date} />
                                        </Pressable>
                                    </Link>
                                )}
                                <CounterMenu data={data.menu_counters} showCommentsModal={showCommentsModal} />
                            </View>
                        )}
                        
                        <View className={`${cd('pt-sm')}`}>
                            <ActionMenu data={data.menu_actions} showCommentsModal={showCommentsModal} />
                        </View>

                
                {commentsData && <CommentsSection url={url} t={t} isCommentsModal={isCommentsModal} showCommentsModal={showCommentsModal} commentsDataInline={commentsData} data={data} isShowMoreComments={isShowMoreComments} />}
            </CardList>
        </AnimatedBlock>
    )
}

export default function UnitFeed_({ data, mode }) {
    return <UnitFeed data={data} mode={mode} SmallUnit={SmallUnit} DefaultUnit={DefaultUnit} />
}
