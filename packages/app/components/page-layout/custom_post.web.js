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
//import { useNavigation, useRouter} from "expo-router";
import { updateCenterHeader } from 'app/lib/native-handlers'


export default function PageLayout(props) {

    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});
    const viewFormRef = useRef();

    const handleReply =  async (id, author, text) => {
        setFormData({text:stripTags(text), parent_id:id, author:author})
        document.getElementsByClassName("form-control-cmt_text")[0].getElementsByTagName("textarea")[0].focus();
    }

    const handleForm =  async (data) => {
        setAddData(data)
    }
    
    const commentsData = DataByName(props.data, props.blocks.comments);

    let aItems = [
        {id:'block_author', data: <View className='pt-4 px-4'><BlockByName data={props.data} name={props.blocks.author}/></View>},
        {id:'block_text', data: <BlockByName data={props.data} name={props.blocks.text}/>},
        {id:'block_actions', data: <View className='border-b border-neoborder dark:border-neoborder-dark'><BlockByName data={props.data} name={props.blocks.actions}/></View>}
    ];

    return ( 
        <View  className=" lg:mt-4 bg-backgroundcard dark:bg-backgroundcard-dark max-w-5xl mx-auto w-full sm:rounded-lg overflow-hidden sm:border border-t border-neoborder dark:border-neoborder-dark ">
            <CommentsBrowse addItems = {aItems} handleReply={handleReply} browse={commentsData.content[0].browse} addData={addData} module={commentsData.module} requestUrl={commentsData.content[0].url} />
            <CommentsForm handleForm={handleForm} browse={commentsData.content[0].browse} module={commentsData.module} form={commentsData.content[0].form} formData={formData} requestUrl={commentsData.content[0].url} />    
        </View>  
    )

}
