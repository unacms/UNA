import { View} from 'app/design/view';
import {BlockByName, DataByName} from 'app/components/block';
import { Text } from 'app/design/typography'

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { stripTags } from '../../lib/util';
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import { Dimensions } from 'react-native';
import { KeyboardAvoidingView } from 'react-native';
import { Platform, Keyboard } from 'react-native'

export default function PageLayout(props) {

    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});
    const [sizes, setSizes] = useState({cntHeight:0, listHeight:100, formHeight:0, formWidth:100});
    
    const viewFormRef = useRef();
    const viewCntRef = useRef();

    const handleReply =  async (id, author, text) => {
        setFormData({text:stripTags(text), parent_id:id, author:author})
        document.getElementsByClassName("form-control-cmt_text")[0].getElementsByTagName("textarea")[0].focus();
    }
    
    const handleForm =  async (data) => {
        setAddData(data)
    }
     /*  const handleWindowSizeChange = () => {
        setSizes({cntHeight: Dimensions.get('window').height - sizes.offset, listHeight: Dimensions.get('window').height - sizes.offset - sizes.formHeight - 2, formHeight: sizes.formHeight, offset:sizes.offset})
    };

 Dimensions.addEventListener('change', handleWindowSizeChange);
    
    const handleLayout = () => {
        let heightForm = 100
        let cntHeight = sizes.cntHeight;
        if (cntHeight > 0){
            viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
                heightForm = height;
                setSizes({cntHeight:cntHeight, listHeight:cntHeight - heightForm - 2 , formHeight: heightForm, offset:sizes.offset})             
            });
        }

        if (cntHeight == 0){
            viewCntRef.current.measure((x, y, width, height, pageX, pageY) => {
                cntHeight = height; 
                viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
                    heightForm = height;
                    setSizes({cntHeight:cntHeight, listHeight:cntHeight - heightForm - 2, formHeight: heightForm, offset: Dimensions.get('window').height - cntHeight})             
                }); 
              
            });
        }
    };
    */

    

    const handleWindowSizeChange = () => {
        calculateSize();
    };

    Dimensions.addEventListener('change', handleWindowSizeChange);

    const handleLayout = () => {
        calculateSize();
    }; 

    const calculateSize = () => {
        if (viewFormRef.current){
            viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
                let  FormH = height
                if (Dimensions.get('window').width < 1024)
                    FormH = FormH 
                viewCntRef.current.measure((x, y, width, height, pageX, pageY) => {
                    setSizes({formHeight: FormH, formWidth: width-2})             
                });
            });
        }
    }

    const commentsData = DataByName(props.data, props.blocks.comments);

    let aItems = [
        {id:'block_author', data: <View className='pt-4 px-4'><BlockByName data={props.data} name={props.blocks.author}/></View>},
        {id:'block_text', data: <BlockByName data={props.data} name={props.blocks.text}/>},
        {id:'block_actions', data: <View className='border-b border-neoborder dark:border-neoborder-dark'><BlockByName data={props.data} name={props.blocks.actions}/></View>}
    ];

    return ( 
        <View className="lg:py-4 h-full ">
            <View ref={viewCntRef} className=" justify-between w-full h-full flex-1  bg-backgroundcard dark:bg-backgroundcard-dark max-w-5xl mx-auto w-full sm:rounded-lg overflow-hidden sm:border border-t border-neoborder dark:border-neoborder-dark ">
                <View style ={{marginBottom: sizes.formHeight}} className='overflow-hidden h-full w-full '>
                    <CommentsBrowse addItems = {aItems} handleReply={handleReply} browse={commentsData.content[0].browse} addData={addData} module={commentsData.module} requestUrl={commentsData.content[0].url} />
                </View>
                <View ref={viewFormRef} onLayout={handleLayout} className='fixed bottom-16 lg:bottom-0 w-full' style ={{width: sizes.formWidth}}> 
                    <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                        <CommentsForm handleForm={handleForm} browse={commentsData.content[0].browse} module={commentsData.module} form={commentsData.content[0].form} formData={formData} requestUrl={commentsData.content[0].url} />         
                    </KeyboardAvoidingView>
                </View>
            </View>
        </View> 
    )

}
