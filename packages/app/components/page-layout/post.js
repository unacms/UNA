import { View } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { stripTags, LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { Theme } from 'app/design/theme';
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import KbAvoidingView, { KbAvoidingViewScroll } from 'app/ui/atoms/kb-avoiding-view';
import { useWindowDimensions, Platform } from 'react-native'
import { useLocalSearchParams } from 'app/lib/hooks/router'
import { appSetting } from 'app/lib/util';
import Card from 'app/ui/molecules/card';
import { cd } from 'app/lib/util';
import emitter from 'app/context/emitter';

const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from');

export default function PageLayout(props) {
    const isWeb = Platform.OS == 'web';
    const { width: windowWidth, height: windowWHeight } = useWindowDimensions();
    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});
    const [replyId, setReplyId] = useState(false);
    const [scrollToEnd, setScrollToEnd] = useState(false);
    const [formHeight, setFormHeight] = useState(0)

    const localUrl = useLocalSearchParams();
    
    const commentsData = useMemo(() => DataByName(props.data, props.blocks.comments), [props.data, props.blocks.comments]);
    const { colors } = Theme()

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
        .filter(([key, value]) => value.forList && ((windowWidth < LAYOUT_BREAKPOINTS[TABLET_MODE_FROM] && value.forHeader == null) || windowWidth >= LAYOUT_BREAKPOINTS[TABLET_MODE_FROM]))
        .map(([key, value]) => ({
            id: `block_${key}`,
            data: <BlockByName data={props.data} name={value} contentOnly={true} />
        })), [props.blocks, props.data, windowWidth]);

    const headerItems = useMemo(() => {
        return Object.entries(props.blocks)
            .filter(([key, value]) => value.forHeader)
            .map(([key, value]) => ({
                data: <BlockByName data={props.data} name={value} contentOnly={true} />
            }));
    }, [props.blocks, props.data]);

    const viewProps = isWeb ? {
        style: { minHeight: windowWidth < LAYOUT_BREAKPOINTS[TABLET_MODE_FROM] ? windowWHeight : windowWHeight - 64 },
    } : {};

    const handleLayout = useCallback((event) => {
        if (isWeb)
            setFormHeight(event.nativeEvent.layout.height) 
    }, []);

    return (
        <View {...viewProps} className={`sm:${cd('p-lg')} ${appSetting('layout', 'feed_container')}`}>
            <Card>
                <View
                    pointerEvents="box-none"
                    className='w-full flex-1'
                    style={{
                        marginBottom: (isWeb && windowWidth < LAYOUT_BREAKPOINTS[TABLET_MODE_FROM])
                            ? Math.max(8, formHeight)
                            : 0
                    }}
                >
                    <CommentsBrowse
                        scrollProps={
                            {
                                headerHeight: 64,
                                pageData: props.data,
                                headerComponent: headerItems[0].data,
                                isBackButton: true,
                                 padding: 16,
                                 bottomPadding: 0,
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
                <View onLayout={handleLayout} className={`${cd('p-lg')} web:fixed web:sm:relative web:bottom-0 bg-card w-full`}>
                    <CommentsForm handleForm={setAddData} browse={commentsData?.content[0]?.browse} module={commentsData?.content[0]?.browse?.data?.module || commentsData?.module} form={commentsData?.content[0]?.form} formData={formData} requestUrl={commentsData?.content[0]?.url} />
                </View>
            </KbAvoidingView>
            </Card>
        </View>
    );
}