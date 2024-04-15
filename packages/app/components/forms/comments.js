import { View, Row } from 'app/design/view'
import { useState, useCallback } from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'
import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native'

export default function FormComments(props) {
    const [imageSource, setImageSource] = useState([]);
    const isWeb = Platform.OS == 'web';
    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource(prevImageSource => ({
                ...prevImageSource,
                [name]: previews,
            }));
        }
    }

    let prevList = Object.values(imageSource).flat();

    props.data.inputs['cmt_submit'].icon = 'PaperPlaneRight';

    return <View className='w-full px-4 sm:px-6' >
        <Row className='w-full items-center bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d rounded-lg'>
            <View className='flex-auto ' >
                {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['cmt_cf'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['cmt_parent_id'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['cmt_text'], props.handleSubmit, 'custom', {focus:true, bg:'transparent', placeholder: 'Write your comment here...', classes: 'mb-0 mt-0' })}
                {getFormFieldByData(props.data.inputs['id'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['sys'], props.handleSubmit, 'custom')}
            </View>
            <View className={isWeb ? '' : 'w-10 '}>
                {getFormFieldByData(props.data.inputs['cmt_image'], props.handleSubmit, 'custom', { previewPlaceHolder: setPlaceHolder, classes: 'mb-0 mt-0 ' })}
            </View>
            <View className={isWeb ? '' : 'w-10 '}>{getFormFieldByData(props.data.inputs['cmt_submit'], props.handleSubmit, 'custom', { classes: isWeb ? 'mb-0 ml-0 mt-0' : 'mb-0 mt-0' })}</View>
        </Row>
        {(prevList.length > 0 && prevList[0]?.key) && <Row className='flex-wrap gap-2 mt-3'>{prevList}</Row>}
    </View>
}
