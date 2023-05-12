import { View, Row } from 'app/design/view'
import { useState } from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'

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

    let prevList = Object.values(imageSource).flat();

    return <View className='w-full  my-0.5'>
    <Row className='w-full  '>

        <View className=''>
            {getFormFieldByData(props.data.inputs['cmt_image'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}
        </View>
        <View className=' flex-grow mr-2'>
            {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'custom')}
            {getFormFieldByData(props.data.inputs['cmt_cf'], props.handleSubmit, 'custom')}
            {getFormFieldByData(props.data.inputs['cmt_parent_id'], props.handleSubmit, 'custom')}
            {getFormFieldByData(props.data.inputs['cmt_text'], props.handleSubmit, 'custom', {placeholder: 'Write your comment here...'})}
            {getFormFieldByData(props.data.inputs['id'], props.handleSubmit, 'custom')}
            {getFormFieldByData(props.data.inputs['sys'], props.handleSubmit, 'custom')}
        </View>
        <View className=''> {getFormFieldByData(props.data.inputs['cmt_submit'], props.handleSubmit, 'custom')}          
        </View>
    </Row>
    {(prevList.length>0 && prevList[0]?.key) && <Row className='flex-wrap gap-2 mt-3'>{prevList}{prevList.length}</Row> }
</View>
}
