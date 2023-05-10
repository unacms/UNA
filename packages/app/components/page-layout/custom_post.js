import { View, ScrollView, FlashList, Row } from 'app/design/view';
import {BlockByName, DataByName} from 'app/components/block';
import { Text } from 'app/design/typography'

import { useState, useContext, useRef, useEffect } from 'react';
import { stripTags } from '../../lib/util';
import { useTheme } from '@react-navigation/native';
import { Platform } from 'react-native'

import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import { KeyboardAvoidingView } from 'react-native';
import { useNavigation, useRouter} from "expo-router";
import { updateCenterHeader } from 'app/lib/native-handlers'
import { Dimensions, Keyboard } from 'react-native';

export default function PageLayout(props) {

    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});
    const [sizes, setSizes] = useState({cntHeight:0, listHeight:100, formHeight:0, offset:0});
    const [isKeyboardVisible, setKeyboardVisible] = useState(0);

    const viewFormRef = useRef();
    const viewCntRef = useRef();

    const handleReply =  async (id, author, text) => {
        setFormData({text:stripTags(text), parent_id:id, author:author})
    }

    const handleForm =  async (data) => {
        setAddData(data)
    }
    
    const commentsData = DataByName(props.data, props.blocks.comments);
    
    let aItems = [
        {id:'block_text', data: <BlockByName data={props.data} name={props.blocks.text}/>},
        {id:'block_actions', data: <View className='border-b border-bordercolorcard dark:border-bordercolorcard-dark'><BlockByName data={props.data} name={props.blocks.actions}/></View>}
    ];

    const routerExpo = useRouter();
    const navigation = useNavigation();
    const { colors } = useTheme();   

    setTimeout(() => {
        updateCenterHeader(null, <View style={{width:360}} className=' items-center  '><BlockByName data={props.data} name={props.blocks.author}/></View>, true, navigation, routerExpo, colors, null);
      }, 100);

      const handleLayout = () => {
        
        let heightForm = 100
        let cntHeight = sizes.cntHeight;
        if (viewFormRef.current && cntHeight > 0){
            viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
                heightForm = height;
                setSizes({cntHeight:cntHeight, listHeight:cntHeight - heightForm + 64 , formHeight: heightForm, offset:sizes.offset})             
            });
        }

        if (viewCntRef.current && cntHeight == 0){
            viewCntRef.current.measure((x, y, width, height, pageX, pageY) => {
                cntHeight = height; 
                viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
                    heightForm = height;
                    setSizes({cntHeight:cntHeight, listHeight:cntHeight - heightForm , formHeight: heightForm, offset: 0})             
                }); 
              
            });
        }
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

    return (
        <View className='flex-1 w-full h-full'>
            <View ref={viewCntRef} className="w-full h-full flex-1 bg-backgroundcard dark:bg-backgroundcard-dark">
                <View style ={{height:sizes.listHeight, marginTop: -isKeyboardVisible }} className='overflow-hidden'>
                    <CommentsBrowse addItems = {aItems} handleReply={handleReply} browse={commentsData.content[0].browse} addData={addData} module={commentsData.module} requestUrl={commentsData.content[0].url} />
                </View>
            </View>
            <View ref={viewFormRef} onLayout={handleLayout} className=''> 
                <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                    <CommentsForm handleForm={handleForm} browse={commentsData.content[0].browse} module={commentsData.module} form={commentsData.content[0].form} formData={formData} requestUrl={commentsData.content[0].url} />         
                </KeyboardAvoidingView>
            </View>
        </View>
    )
}
