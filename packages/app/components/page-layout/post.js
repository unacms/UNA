import { View } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { useState, useContext, useMemo, useEffect } from 'react';
import { stripTags } from 'app/lib/util';
import { useTheme } from '@react-navigation/native';
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import { useNavigation } from "expo-router";
import { useUpdateCenterHeader } from 'app/lib/native-handlers'
import { useLocalSearchParams } from 'expo-router';
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';

export default function PageLayout(props) {
    
    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});
    const [replyId, setReplyId] = useState(false);
    const localUrl = useLocalSearchParams();
    const commentsData = useMemo(() => DataByName(props.data, props.blocks.comments), [props.data, props.blocks.comments]);
    const { colors } = useTheme();
    const navigation = useNavigation();
    const updateCenterHeader = useUpdateCenterHeader(navigation);

    useEffect(() => {
        if (localUrl?.url) {
            const hash = localUrl.url.split('#')[1];
            if (hash) {
                setReplyId(hash);
            }
        }
    }, [localUrl]);

    const aItems = useMemo(() => Object.entries(props.blocks)
        .filter(([key, value]) => value.forList && value.forHeader == null)
        .map(([key, value]) => ({
            id: `block_${key}`,
            data: <BlockByName data={props.data} name={value} />
        })), [props.blocks, props.data]);

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

    useEffect(() => {
        if (headerItems.length === 0) return; // Exit early if no items
        const timer = setTimeout(() => {
            updateCenterHeader(null, <View className='items-center'>{headerItems[0].data}</View>, true);
        }, 100);

        return () => clearTimeout(timer);
    }, [headerItems]);

    return (
        <View className='flex-1 w-full h-full'>
            <View className="w-full  flex-1 bg-bgrcard dark:bg-bgrcard-d px-3">
                <View className='overflow-hidden flex-1 w-full'>
                    <CommentsBrowse addItems={aItems} handleReply={data => setFormData({ text: stripTags(data.cmt_text), parent_id: data.cmt_id, author: data.author_data, cmt_id: data.cmt_id, cmt_object_id: data.cmt_object_id })} browse={commentsData.content[0].browse} addData={addData} module={commentsData?.content[0].browse?.data?.module || commentsData?.module} requestUrl={commentsData.content[0].url} replyId={replyId} />
                </View>
            </View>
            <KbAvoidingView offset={64}>
                <View className=' border-bdrcard dark:border-bdrcard-d border-t border-bdr dark:border-bdr-d px-3' style={{ backgroundColor: colors.barsBackground }}>
                <CommentsForm handleForm={setAddData} browse={commentsData.content[0].browse} module={commentsData?.content[0].browse?.data?.module || commentsData?.module} form={commentsData.content[0].form} formData={formData} requestUrl={commentsData.content[0].url} />
                </View>
            </KbAvoidingView>
        </View>
    );
}