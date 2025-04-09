import { View } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { useState, useMemo, useEffect } from 'react';
import { stripTags, LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { Theme } from 'app/design/theme';
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
//import { useLocalSearchParams } from 'expo-router';
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import { useWindowDimensions, Platform } from 'react-native'

export default function PageLayout(props) {
    const isWeb = Platform.OS == 'web';
    const { width: windowWidth, height: windowWHeight } = useWindowDimensions();
    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});
    const [replyId, setReplyId] = useState(false);
    const localUrl = "";//useLocalSearchParams();
    const commentsData = useMemo(() => DataByName(props.data, props.blocks.comments), [props.data, props.blocks.comments]);
    const { colors } = Theme()

    useEffect(() => {
        if (localUrl?.url) {
            const hash = localUrl.url.split('#')[1];
            if (hash) {
                setReplyId(hash);
            }
        }
    }, [localUrl]);

    const aItems = useMemo(() => Object.entries(props.blocks)
        .filter(([key, value]) => value.forList && ((windowWidth < LAYOUT_BREAKPOINTS.lg && value.forHeader == null) || windowWidth >= LAYOUT_BREAKPOINTS.lg))
        .map(([key, value]) => ({
            id: `block_${key}`,
            data: <BlockByName data={props.data} name={value} />
        })), [props.blocks, props.data, windowWidth]);

    /*useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', e => setKeyboardVisible(e.endCoordinates.height));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(0));
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);*/

    const headerItems = useMemo(() => {
        return Object.entries(props.blocks)
            .filter(([key, value]) => value.forHeader)
            .map(([key, value]) => ({
                data: <BlockByName data={props.data} name={value} />
            }));
    }, [props.blocks, props.data]);

    const viewProps = isWeb ? {
        style: { height: windowWidth < LAYOUT_BREAKPOINTS.lg ? windowWHeight : windowWHeight - 64 },
    } : {};


    return (
        <View {...viewProps} className={`${!isWeb && 'h-full flex-1 '} w-full max-w-5xl mx-auto`}>
            <View className="w-full  flex-1 bg-bgrcard dark:bg-bgrcard-d lg:rounded-t-2xl lg:mt-4 px-3 sm:p-4">
                <View className='overflow-hidden flex-1 w-full'>
                    <CommentsBrowse
                        scrollProps={
                            {
                                headerHeight: 64,
                                pageData: props.data,
                                headerComponent: headerItems[0].data,
                                isBackButton: true,
                            }
                        }
                        addItems={aItems}
                        handleReply={data => setFormData({ text: stripTags(data.cmt_text), parent_id: data.cmt_id, author: data.author_data, cmt_id: data.cmt_id, cmt_object_id: data.cmt_object_id })}
                        browse={commentsData.content[0].browse}
                        addData={addData}
                        module={commentsData?.content[0].browse?.data?.module || commentsData?.module}
                        requestUrl={commentsData.content[0].url}
                        replyId={replyId}
                    />
                </View>
            </View>
            <KbAvoidingView offset={64}>
                <View className=' border-bdrcard dark:border-bdrcard-d border-t border-bdr dark:border-bdr-d px-3 ' style={{ backgroundColor: colors.barsBackground }}>
                    <CommentsForm handleForm={setAddData} browse={commentsData.content[0].browse} module={commentsData?.content[0].browse?.data?.module || commentsData?.module} form={commentsData.content[0].form} formData={formData} requestUrl={commentsData.content[0].url} />
                </View>
            </KbAvoidingView>
        </View>
    );
}