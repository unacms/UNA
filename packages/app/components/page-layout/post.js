import { View } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { useCurrentUser } from 'app/context/user';
import { useState, useContext, useMemo, useEffect } from 'react';
import { stripTags } from 'app/lib/util';
import { useTheme } from '@react-navigation/native';
import { Platform } from 'react-native'
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import { KeyboardAvoidingView } from 'react-native';
import { useNavigation, useRouter } from "expo-router";
import { updateCenterHeader } from 'app/lib/native-handlers'
import { Dimensions, Keyboard } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function PageLayout(props) {
    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});
    const [isKeyboardVisible, setKeyboardVisible] = useState(0);
    const [replyId, setReplyId] = useState(false);
    const { currentUser } = useCurrentUser();
    const localUrl = useLocalSearchParams();
    const commentsData = useMemo(() => DataByName(props.data, props.blocks.comments), [props.data, props.blocks.comments]);
    const { colors } = useTheme();
    const navigation = useNavigation();
    const routerExpo = useRouter();

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

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', e => setKeyboardVisible(e.endCoordinates.height));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(0));
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            const headerItems = Object.entries(props.blocks)
                .filter(([key, value]) => value.forHeader)
                .map(([key, value]) => ({
                    data: <BlockByName data={props.data} name={value} />
                }));
            if (headerItems.length > 0) {
                updateCenterHeader(null, <View style={{ width: Dimensions.get('window').width - 65 }} className='items-center'>{headerItems[0].data}</View>, true, navigation, routerExpo, colors, null, null, currentUser);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [props.blocks, props.data, colors, navigation, routerExpo, currentUser]);

    return (
        <View className='flex-1 w-full h-full'>
            <View className="w-full h-full flex-1 bg-bgrcard dark:bg-bgrcard-d px-3">
                <View className='overflow-hidden h-full w-full'>
                    <CommentsBrowse addItems={aItems} handleReply={data => setFormData({ text: stripTags(data.cmt_text), parent_id: data.cmt_id, author: data.author_data })} browse={commentsData.content[0].browse} addData={addData} module={commentsData?.content[0].browse?.data?.module || commentsData?.module} requestUrl={commentsData.content[0].url} replyId={replyId} />
                </View>
            </View>
            <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View className='border-bdrcard dark:border-bdrcard-d border-t border-bdr dark:border-bdr-d px-3' style={{ backgroundColor: colors.barsBackground }}>
                    <CommentsForm handleForm={setAddData} browse={commentsData.content[0].browse} module={commentsData?.content[0].browse?.data?.module || commentsData?.module} form={commentsData.content[0].form} formData={formData} requestUrl={commentsData.content[0].url} />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}