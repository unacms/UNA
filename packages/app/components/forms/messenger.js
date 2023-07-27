import { View, Row } from 'app/design/view'
import { useState } from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'
import { useWindowDimensions} from 'react-native';
import { Platform } from 'react-native'

export default function FormMessenger(props) {
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

    let prevList = Object.values(imageSource).flat();

    return <View className='w-full my-0.5'>
                <Row className='w-full'>
                    <View className=''>
                        {getFormFieldByData(props.data.inputs['files'], props.handleSubmit, 'custom', {previewPlaceHolder: setPlaceHolder})}
                    </View>
                    <View className='mr-2 flex-grow ' style={styles}>
                        {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'default')}
                        {getFormFieldByData(props.data.inputs['cf'], props.handleSubmit, 'default')}
                        {getFormFieldByData(props.data.inputs['parent_id'], props.handleSubmit, 'default')}
                        {getFormFieldByData(props.data.inputs['message'], props.handleSubmit, 'custom', { placeholder: 'Message ...' })}
                        {getFormFieldByData(props.data.inputs['id'], props.handleSubmit, 'default')}
                        {getFormFieldByData(props.data.inputs['send'], props.handleSubmit, 'default')}
                    </View>
                    <View className='w-10'>{getFormFieldByData(props.data.inputs['submit'], props.handleSubmit, 'default')}</View>
                </Row>

            {(prevList.length>0 && prevList[0]?.key) && <Row className='flex-wrap gap-2 mt-3'>{prevList}</Row> }
           </View>
}
