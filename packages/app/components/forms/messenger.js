import { View, Row } from 'app/design/view'
import {useRef, useState} from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'
import {KeyboardAvoidingView, useWindowDimensions} from 'react-native';
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
        styles = { width: windowWidth - 110 }
    }

    let prevList = Object.values(imageSource).flat();

    const [sizes, setSizes] = useState({formHeight:0});
    const viewFormRef = useRef();
    const handleLayout = () => {
        viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
            setSizes({formHeight: height})
        });
    };

    /*<KeyboardAvoidingView
                    keyboardHoOffset={192}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    onLayout={handleLayout}
           >*/

    return   <View className='w-full my-0.5' ref={viewFormRef}>
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
    /*</KeyboardAvoidingView>*/
}
