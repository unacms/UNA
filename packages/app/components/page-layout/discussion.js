import { View } from 'app/design/view';
import { BlockByName, DataByName} from 'app/components/block';

import { useState, useContext, useRef, useEffect } from 'react';
import { stripTags } from '../../lib/util';
import { useTheme } from '@react-navigation/native';
import { Platform } from 'react-native'
import { Modal } from 'app/design/controls'
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import { KeyboardAvoidingView } from 'react-native';
import { useNavigation, useRouter} from "expo-router";
import { updateCenterHeader } from 'app/lib/native-handlers'
import { Dimensions, Keyboard } from 'react-native';
import { Button } from 'app/design/controls';
import { env } from 'app/lib/env';
import WebView from 'react-native-webview';

export default function PageLayout(props) {

    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});
    const [sizes, setSizes] = useState({formHeight:0});
    const [isKeyboardVisible, setKeyboardVisible] = useState(0);
    const [showModal, setShowModal] = useState(false);
    
    const viewFormRef = useRef();
    const viewCntRef = useRef();

    const handleReply =  async (id, author, text) => {
        setShowModal(true)
        setFormData({text:stripTags(text), parent_id:id, author:author})
    }

    const handleForm =  async (data) => {
        setAddData(data)
    }
    
    const commentsData = DataByName(props.data, props.blocks.comments);
    
    let aItems = Object.entries(props.blocks).filter(([key, value]) => value.forList).filter(([key, value]) => value.forHeader == null).map(([key, value]) => ({
        id: `block_${key}`,
        data: <BlockByName data={props.data} name={value} />
    }));

    let actionsItemIndex = aItems.findIndex(item => item.id === 'block_actions');
    if (actionsItemIndex !== -1) {
        aItems[actionsItemIndex].data = (
            <View className='border-b border-bdrcard dark:border-bdrcard-d'>
                {aItems[actionsItemIndex].data}
            </View>
        );
    }

    const routerExpo = useRouter();
    const navigation = useNavigation();
    const { colors } = useTheme();   

    setTimeout(() => {
        let aItems = Object.entries(props.blocks).filter(([key, value]) => value.forHeader).map(([key, value]) => ({
            data: <BlockByName data={props.data} name={value} />
        }));
        if (aItems.length > 0){
            updateCenterHeader(null, <View style={{width:Dimensions.get('window').width-65}} className=' items-center '>{aItems[0].data}</View>, true, navigation, routerExpo, colors, null);
        }
    }, 100);

    const handleLayout = () => {
        viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
            setSizes({formHeight: height})             
        });
    }; 

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {;
            setKeyboardVisible(e.endCoordinates.height);
        });
    
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
          setKeyboardVisible(0);
        });
    
        return () => {
          keyboardDidShowListener.remove();
          keyboardDidHideListener.remove();
        };
      }, []);

      let u =  env('API_PROXY_URL').replace('/api', '/');

    return (//style ={{marginBottom: sizes.formHeight}}
        <View className='flex-1 w-full h-full'>
            <View ref={viewCntRef} className="w-full h-full flex-1 bg-bgrcard dark:bg-bgrcard-d" >
                <View  className='overflow-hidden h-full w-full' >
                    <CommentsBrowse addItems = {aItems} handleReply={handleReply} browse={commentsData.content[0].browse} addData={addData} module={commentsData.module} requestUrl={commentsData.content[0].url} />
                </View>
            </View>       
            <View className=' m-4 mx-auto'>
                <Button variant="default" title="Write reply" onPress={() => {  setFormData({text:'', parent_id:0, author:''});setShowModal(true) }}/>
            </View>         
            <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                <View ref={viewFormRef} onLayout={handleLayout} className='    '> 
                    <Modal onVisible={!!showModal} onClose={() => {setShowModal(null)}}>
                       { /* <CommentsForm handleForm={handleForm} browse={commentsData.content[0].browse} module={commentsData.module} form={commentsData.content[0].form} formData={formData} requestUrl={commentsData.content[0].url} />  */ }
                       <View className='w-full h-96 bg-red-500'>
                            <WebView source={{ uri: u + 'view-discussion/dasdas?blocks=bx_forum:entity_comments&empty=true&text='+formData.text+'&parent_id='+formData.parent_id+'&author='+formData.author }} />  
                       </View> 
                    </Modal>
                </View>
            </KeyboardAvoidingView>
        </View>
    )
}
