import { View } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { stripTags, cd } from 'app/lib/util';
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import { Platform } from 'react-native'
import { useLocalSearchParams } from 'app/lib/hooks/router'
import emitter from 'app/context/emitter';
import { useIsDesktop, useWindowHeight } from 'app/context/measure';
import { appSetting } from 'app/lib/util';


export default function PageLayout({ data, blocks, isModal, url }) {
    const isWeb = Platform.OS == 'web';
    const windowWHeight = useWindowHeight();
    const isDesktop = useIsDesktop();
    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});
    const [replyId, setReplyId] = useState(false);
    const [scrollToEnd, setScrollToEnd] = useState(false);
    const [formHeight, setFormHeight] = useState(0);
    const [listWidth, setListWidth] = useState(0)
    //const [containerHeight, setContainerHeight] = useState(0);
    //const [modalFormHeight, setModalFormHeight] = useState(0);

    const localUrl = isModal ? url : useLocalSearchParams().url;
    const commentsData = useMemo(() => DataByName(data, blocks.comments), [data, blocks.comments]);


    // for modal
    const offset = isDesktop ? 100 : 60
    const [height, setHeight] = useState(
        windowWHeight - offset - 100
    )

    useEffect(() => {
        if (localUrl) {
            const hash = localUrl.split('#')[1];
            if (hash) {
                // click on reply
                if (hash.includes('cmt_id=')) {
                    console.log("notifsnotifs", hash)
                    setReplyId(hash);
                    emitter.emit('editor', { action: 'focus', note: "setReplyId", timeout: 800 });
                }
                else {
                    if (hash.includes('cid=')) {

                        //click from notifs
                        setScrollToEnd(hash.replace('cid=', ''));
                    }
                    else {
                        // click on comments
                        setScrollToEnd(true);
                        emitter.emit('editor', { action: 'focus', note: "a", timeout: 800 });
                    }

                }
            }

        }
    }, [localUrl]);

    const aItems = useMemo(() => Object.entries(blocks)
        .filter(([key, value]) => value.forList)
        .map(([key, value]) => ({
            id: `block_${key}`,
            data: <View className={value.name.includes("entity_text_block") ? 'px-4' : ''}><BlockByName isModal={isModal} data={data} name={value} contentOnly={true} /></View>
        })), [blocks, data]);

    const headerItems = useMemo(() => {
        return Object.entries(blocks)
            .filter(([key, value]) => value.forHeader)
            .map(([key, value]) => ({
                data: <View className={value?.name === 'entity_author' ? 'px-3 sm:px-4' : ''}><BlockByName data={data} name={value} contentOnly={true} /></View>
            }));
    }, [blocks, data]);

    const viewProps = isWeb ? {
        style: { minHeight: !isDesktop ? windowWHeight : windowWHeight - 64 },
    } : {};

    const handleLayout = useCallback((event) => {
        if (isWeb)
            setFormHeight(event.nativeEvent.layout.height)
    }, []);

    const handleListLayout = (event) => {

        setListWidth(event.nativeEvent.layout.width - 2)
    }

    const handleLayoutModal = (event) => {
        const h =
            windowWHeight -
            offset -
            event.nativeEvent.layout.height
        setHeight(h)
    }

    if (isModal) {
        return (
            <View className="w-full">
                <View className="w-full " style={{ height: height }}>
                    <CommentsBrowse
                        scrollProps={
                            isModal ? {pageData: null, headerComponent: <></>, isNoContainer: true, headerHeight: 8}: {
                                headerHeight: 64,
                                pageData: data,
                                // headerComponent: headerItems[0].data,
                                isBackButton: true,
                                padding: 16,
                            }
                        }
                        useCustomScrollHandler={true}
                        height={height > 0 ? height : undefined}
                        scrollToIndex={scrollToEnd}
                        addItems={aItems}
                        handleReply={data => setFormData({ ts: Date.now(), text: stripTags(data.cmt_text), parent_id: data.cmt_id, author: data.author_data, cmt_id: data.cmt_id, cmt_object_id: data.cmt_object_id })}
                        browse={commentsData?.content[0]?.browse}
                        addData={addData}
                        module={commentsData?.content[0].browse?.data?.module || commentsData?.module}
                        requestUrl={commentsData?.content[0]?.url}
                        replyId={replyId}
                    />
                </View>
                <View
                    onLayout={handleLayoutModal}
                    className="border-t border-border/80 p-2"
                >
                    <CommentsForm handleForm={setAddData} browse={commentsData?.content[0]?.browse} module={commentsData?.content[0]?.browse?.data?.module || commentsData?.module} form={commentsData?.content[0]?.form} formData={formData} requestUrl={commentsData?.content[0]?.url} />
                </View>
            </View>
        )
    }
    return (
        <View {...viewProps} className="flex-1 w-full h-full sm:h-[calc(100vh-16rem)] ">
            <View className={`max-w-4xl w-full flex-1 bg-card/80 shadow-sm text-card-foreground rounded-2xl py-3 sm:py-4 lg:mt-4 mx-auto `}>
                <View onLayout={handleListLayout} pointerEvents="box-none" className='w-full flex-1' style={{ marginBottom: !isDesktop ? 0 : formHeight }}>
                    <CommentsBrowse
                        scrollProps={
                            {
                                headerHeight: 64,
                                pageData: data,
                                // headerComponent: headerItems[0].data,
                                isBackButton: true,
                                padding: 16,
                            }
                        }
                        scrollToIndex={scrollToEnd}
                        addItems={aItems}
                        handleReply={data => setFormData({ ts: Date.now(), text: stripTags(data.cmt_text), parent_id: data.cmt_id, author: data.author_data, cmt_id: data.cmt_id, cmt_object_id: data.cmt_object_id })}
                        browse={commentsData?.content[0]?.browse}
                        addData={addData}
                        module={commentsData?.content[0].browse?.data?.module || commentsData?.module}
                        requestUrl={commentsData?.content[0]?.url}
                        replyId={replyId}
                    />
                </View>
                <KbAvoidingView>
                    <View onLayout={handleLayout} style={{ width: listWidth + 5 }} className='-ml-[2px] -mr-[2px] border-background border bg-background web:fixed z-50 web:bottom-0  '>
                        <View className='lg:rounded-b-2xl px-4 py-3  lg:mb-4 bg-card shadow-sm ml-[1px] '>
                            <CommentsForm handleForm={setAddData} browse={commentsData?.content[0]?.browse} module={commentsData?.content[0]?.browse?.data?.module || commentsData?.module} form={commentsData?.content[0]?.form} formData={formData} requestUrl={commentsData?.content[0]?.url} />
                        </View>
                    </View>
                </KbAvoidingView>
            </View>
        </View>
    );
}