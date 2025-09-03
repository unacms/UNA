import { View } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { stripTags } from 'app/lib/util';
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import { Platform } from 'react-native'
import { useLocalSearchParams } from 'app/lib/hooks/router'
import emitter from 'app/context/emitter';
import { useIsDesktop, useWindowHeight } from 'app/context/measure';


export default function PageLayout(props) {
    const isWeb = Platform.OS == 'web';
    const windowWHeight = useWindowHeight();
    const isDesktop = useIsDesktop();
    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});
    const [replyId, setReplyId] = useState(false);
    const [scrollToEnd, setScrollToEnd] = useState(false);
    const [formHeight, setFormHeight] = useState(0);
    const [listWidth, setListWidth] = useState(0)

    const localUrl = useLocalSearchParams();
    
    const commentsData = useMemo(() => DataByName(props.data, props.blocks.comments), [props.data, props.blocks.comments]);

    useEffect(() => {
        if (localUrl?.url) {
            const hash = localUrl.url.split('#')[1];
            if (hash) {
                // click on reply
                if (hash.includes('cmt_id=')) {
                    setReplyId(hash);
                    emitter.emit('editor', { action: 'focus', note:"setReplyId", timeout:800});
                }
                else{
                    if (hash.includes('cid=')){
                        //click from notifs
                        setScrollToEnd(hash.replace('cid=', ''));
                    }
                    else{
                        // click on comments
                        setScrollToEnd(true);
                        emitter.emit('editor', { action: 'focus', note:"a", timeout:800});
                    }
                    
                }
            }

        }
    }, [localUrl?.url]);

    const aItems = useMemo(() => Object.entries(props.blocks)
        .filter(([key, value]) => value.forList && ((!isDesktop && value.forHeader == null) || isDesktop))
        .map(([key, value]) => ({
            id: `block_${key}`,
            data: <BlockByName data={props.data} name={value} contentOnly={true} />
        })), [props.blocks, props.data]);

    const headerItems = useMemo(() => {
        return Object.entries(props.blocks)
            .filter(([key, value]) => value.forHeader)
            .map(([key, value]) => ({
                data: <BlockByName data={props.data} name={value} contentOnly={true} />
            }));
    }, [props.blocks, props.data]);

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


    return (
        <View {...viewProps} className={`flex-1 w-full h-full sm:h-[calc(100vh-16rem)] max-w-5xl mx-auto `}>
            <View className="w-full flex-1 bg-card/80 backdrop-blur shadow-sm sm:border border-border/30 web:sm:border-0 web:ring-[1px] web:ring-inset web:ring-border/30 text-card-foreground rounded-2xl lg:mt-4 ">
                <View   onLayout={handleListLayout} pointerEvents="box-none" className='w-full flex-1' style={{ marginBottom: !isDesktop ? 0 : formHeight  }}>
                    <CommentsBrowse
                        scrollProps={
                            {
                                headerHeight: 64,
                                pageData: props.data,
                                headerComponent: headerItems[0].data,
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
            </View>
            <KbAvoidingView>
                <View onLayout={handleLayout} style={{width:listWidth}} className='bg-card ml-[1px] rounded-2xl px-4 py-3 bor web:fixed web:bottom-0   w-full max-w-5xl'>
                   
                    <CommentsForm handleForm={setAddData} browse={commentsData?.content[0]?.browse} module={commentsData?.content[0]?.browse?.data?.module || commentsData?.module} form={commentsData?.content[0]?.form} formData={formData} requestUrl={commentsData?.content[0]?.url} />
                     
                </View>
            </KbAvoidingView>
        </View>
    );
}