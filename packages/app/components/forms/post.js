import { View, Row } from 'app/design/view'
import { useState } from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'

export default function FormPost(props) {
    const [imageSource, setImageSource] = useState([]);

    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource(prevImageSource => ({
                ...prevImageSource,
                [name]: previews,
            }));
        }
    }

    let prevList = Object.values(imageSource).flat();

    return <View className='w-full max-w-5xl'>
        {getFormFieldByData(props.data.inputs['covers'], props.handleSubmit, 'notitle')}
        {getFormFieldByData(props.data.inputs['title'], props.handleSubmit, 'notitle', {placeholder: 'Title...'})}
        {getFormFieldByData(props.data.inputs['text'], props.handleSubmit, 'notitle', {placeholder: 'Write your text here...'})}
        <Row>
            <View className='w-12'>{getFormFieldByData(props.data.inputs['pictures'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
            <View className='w-12'>{getFormFieldByData(props.data.inputs['videos'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
            <View className='w-12'>{getFormFieldByData(props.data.inputs['files'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
            <View className='w-12'>{getFormFieldByData(props.data.inputs['sounds'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}</View>
           
        </Row>
        { (prevList.length> 0 && prevList[0]?.key) && <Row className='flex-wrap gap-2 mb-4'>{prevList}</Row>}
        {getFormFieldByData(props.data.inputs['cat'], props.handleSubmit, 'notitle')}
        {getFormFieldByData(props.data.inputs['allow_view_to'], props.handleSubmit,  'notitle')}
        {getFormFieldByData(props.data.inputs['do_publish'], props.handleSubmit,  'default')}
        {getFormFieldByData(props.data.inputs['do_submit'], props.handleSubmit,  'default')}
        

    </View>
}
