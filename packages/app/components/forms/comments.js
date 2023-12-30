import { View, Row } from 'app/design/view'
import { useState, useCallback } from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'
import { useWindowDimensions} from 'react-native';
import { Platform } from 'react-native'

export default function FormComments(props) {
    const [imageSource, setImageSource] = useState([]);

    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource(prevImageSource => ({
                ...prevImageSource,
                [name]: previews,
            }));
        }
    }
    const windowWidth = useWindowDimensions().width;

    let styles ={};
    if(Platform.OS !== 'web') {
        styles = {width: windowWidth-180}
    }
    else{
        styles = {width: 0}
    }
    let prevList = Object.values(imageSource).flat();

    props.data.inputs['cmt_submit'].icon = 'PaperPlaneRight' ;

    return <View className='w-full' >
    <Row className='w-full '>
        <View className=' absolute z-50 left-0 bottom-0 '>
            {getFormFieldByData(props.data.inputs['cmt_image'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder, classes:'mb-0'})}
        </View>
        <View className=' flex-auto ' style={styles}>
            {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'custom')}
            {getFormFieldByData(props.data.inputs['cmt_cf'], props.handleSubmit, 'custom')}
            {getFormFieldByData(props.data.inputs['cmt_parent_id'], props.handleSubmit, 'custom')}
            {getFormFieldByData(props.data.inputs['cmt_text'], props.handleSubmit, 'custom', {placeholder: 'Write your comment here...', classes:'mb-0'})}
            {getFormFieldByData(props.data.inputs['id'], props.handleSubmit, 'custom')}
            {getFormFieldByData(props.data.inputs['sys'], props.handleSubmit, 'custom')}
        </View>
        <View className='flex-none  absolute z-50 right-0 bottom-0 '>{getFormFieldByData(props.data.inputs['cmt_submit'], props.handleSubmit, 'custom', {classes:'mb-0'})}</View>
    </Row>
    {(prevList.length>0 && prevList[0]?.key) && <Row className='flex-wrap gap-2 mt-3'>{prevList}</Row> }
</View>
}
