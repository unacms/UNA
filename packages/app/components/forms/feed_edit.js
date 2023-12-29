import { View, Row } from 'app/design/view'
import { Button, Modal,  } from 'app/design/controls'
import { useState, useContext } from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'
import  { LayoutData } from 'app/context/layout';
import { FeedbackHaptics, getAlert } from 'app/lib/util';
import { KeyboardAvoidingView } from 'react-native';
import { Platform } from 'react-native'
import { useCurrentUser } from 'app/context/user';
import Profile from 'app/ui/molecules/profile';


export default function FormFeed(props) {
    const [showImage, setShowImage] = useState(false);
    const [imageSource, setImageSource] = useState([]);
    const { layoutData, setLayoutData } = useContext(LayoutData);
    let { currentUser, setCurrentUser } = useCurrentUser();
    if (props.response?.id){
        setTimeout(() => {
            setLayoutData(getAlert('feed:new_content', props.response));
        }, 100);
       
    }

    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource(prevImageSource => ({
                ...prevImageSource,
                [name]: previews,
            }));
        }
    }
    
    let prevList = Object.values(imageSource).flat();

    let profile = null
    if (currentUser){
        let dUser = Object.assign({}, currentUser);
        dUser.url_avatar = dUser.avatar
        dUser.url = '/dashboard'
        profile = <Profile {...dUser} displayType="unit_wo_info" />
    }

    return <View className='w-full '>
        {getFormFieldByData(props.data.inputs['action'], props.handleSubmit,  'default')}
        {getFormFieldByData(props.data.inputs['object_cf'], props.handleSubmit,  'default')}
        {getFormFieldByData(props.data.inputs['owner_id'], props.handleSubmit,  'default')}
        {getFormFieldByData(props.data.inputs['type'], props.handleSubmit,  'default')}
        <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
            <View className='w-full flex-col pt-2 px-2'>
                {getFormFieldByData(props.data.inputs['text'], props.handleSubmit, 'custom', {placeholder: 'Write your text here...'})}
                <Row className='mt-2'>
                    <View className='w-12'>{getFormFieldByData(props.data.inputs['photo'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
                    <View className='w-12'>{getFormFieldByData(props.data.inputs['video'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
                    <View className='w-12'>{getFormFieldByData(props.data.inputs['file'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
                </Row>
                { (prevList.length> 0 && prevList[0]?.key) && <Row className='flex-wrap gap-2 mb-4'>{prevList}</Row>}
                {getFormFieldByData(props.data.inputs['object_privacy_view'], props.handleSubmit,  'notitle')}
                {getFormFieldByData(props.data.inputs['tlb_do_submit'], props.handleSubmit,  'default')}

            </View>  
        </KeyboardAvoidingView> 
    </View>
}
