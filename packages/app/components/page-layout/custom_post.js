import { View, ScrollView, FlashList, Row } from 'app/design/view';
import {BlockByName, DataByName} from 'app/components/block';
import { Text } from 'app/design/typography'

import { useState, useContext, useRef, useEffect } from 'react';
import UnitComments from 'app/components/units/comments';
import { Button, Modal } from 'app/design/controls'
import useSWR from "swr";
import { fetcher } from '../../lib/fetcher';
import Loading from 'app/ui/atoms/loading'
import Form from '../elements/form';
import { stripTags } from '../../lib/util';
import { useTheme } from '@react-navigation/native';
import { Platform, Keyboard } from 'react-native'
import Dropdown from 'app/ui/atoms/dropdown'
import { parseData, CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import { KeyboardAvoidingView } from 'react-native';
import { Dimensions } from 'react-native';
import { useNavigation, useRouter} from "expo-router";
import { updateCenterHeader } from 'app/lib/native-handlers'


export default function PageLayout(props) {

    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});

    const handleReply =  async (id, author, text) => {
        setFormData({text:stripTags(text), parent_id:id, author:author})
    }

    const handleForm =  async (data) => {
        setAddData(data)
    }
    
    const commentsData = DataByName(props.data, props.blocks.comments);
    
    let aItems = [
        {id:'block_text', data: <BlockByName data={props.data} name={props.blocks.text}/>},
        {id:'block_actions', data: <View className='border-b border-neoborder dark:border-neoborder-dark'><BlockByName data={props.data} name={props.blocks.actions}/></View>}
    ];

    const routerExpo = useRouter();
    const navigation = useNavigation();
    const { colors } = useTheme();   

    setTimeout(() => {
        updateCenterHeader(null, <View style={{width:360}} className=' items-center  '><BlockByName data={props.data} name={props.blocks.author}/></View>, true, navigation, routerExpo, colors, null);
      }, 100);

    return (
        <View className='flex-1 w-full h-full'>
            <View className="w-full h-full flex-1 bg-backgroundcard dark:bg-backgroundcard-dark">
                <CommentsBrowse addItems = {aItems} handleReply={handleReply} browse={commentsData.content[0].browse} addData={addData} module={commentsData.module} requestUrl={commentsData.content[0].url} />
            </View>
            <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                <CommentsForm handleForm={handleForm} browse={commentsData.content[0].browse} module={commentsData.module} form={commentsData.content[0].form} formData={formData} requestUrl={commentsData.content[0].url} />         
            </KeyboardAvoidingView>
        </View>
    )
}
