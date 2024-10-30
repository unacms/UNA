import { View, Row } from 'app/design/view'
import { useState, useCallback } from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'
import { Platform } from 'react-native'

export default function FormComments(props) {
    const [imageSource, setImageSource] = useState([]);
    const isWeb = Platform.OS == 'web';
    const isIos = Platform.OS == 'ios'
    
    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource(prevImageSource => ({
                ...prevImageSource,
                [name]: previews,
            }));
        }
    }

    let prevList = Object.values(imageSource).flat();


    props.data.inputs['cmt_submit'].hide_errors = true;

    props.data.inputs['cmt_submit'].icon = 'PaperPlane';
    props.data.inputs['cmt_submit'].variant = 'primary';
    props.data.inputs['cmt_submit'].rounded = 'true';

    props.data.inputs['cmt_image'].rounded = 'true';
    props.data.inputs['cmt_image'].variant = 'default';

    const sPad = isWeb ? 'p-2' : (isIos || isWeb) ? 'px-2 pb-2' : 'px-1';
    return <View className='w-full ' >
        <Row className='w-full items-end  '>
        <View className={'mr-2 ' + (isWeb ? '' : ' w-11 ')}>
                {getFormFieldByData(props.data.inputs['cmt_image'], props.handleSubmit, 'custom', { previewPlaceHolder: setPlaceHolder, classes: 'mb-0 mt-0 ' })}
            </View>
            <View className={`flex-auto bg-bgritem dark:bg-bgritem-d rounded-3xl justify-center ${isWeb && 'min-h-[44px]'} items-end ${sPad}`} >
                {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['cmt_cf'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['cmt_parent_id'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['cmt_text'], props.handleSubmit, 'custom', {container_class:'comments', focus:true, bg:'transparent', placeholder: 'Write your comment here...', classes: 'mb-0 mt-0' })}
                {getFormFieldByData(props.data.inputs['id'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['sys'], props.handleSubmit, 'custom')}
            </View>
           
            <View className={'ml-2 ' + (isWeb ? '' : ' w-11 ')}>{getFormFieldByData(props.data.inputs['cmt_submit'], props.handleSubmit, 'custom', { classes: isWeb ? 'mb-0 ml-0 mt-0' : 'mb-0 mt-0' })}</View>
        </Row>
        {(prevList.length > 0 && prevList[0]?.key) && <Row className='flex-wrap gap-2 mt-3'>{prevList}</Row>}
        {getFormFieldByData(props.data.inputs['cmt_mood'], props.handleSubmit, 'custom')}
    </View>
}
