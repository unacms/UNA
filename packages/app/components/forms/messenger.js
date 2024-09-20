import { View, Row } from 'app/design/view'
import { useRef, useState, useEffect } from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'
import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native'

export default function FormMessenger(props) {
    const isWeb = Platform.OS == 'web';
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

    let styles = {};
    if (Platform.OS !== 'web') {
        styles = { width: windowWidth - 110 }
    }

    let prevList = Object.values(imageSource).flat();
    const [sizes, setSizes] = useState({ formHeight: 0 });
    const viewFormRef = useRef();
    const handleLayout = () => {
        if (viewFormRef?.current)
            viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
                setSizes({ formHeight: height });
            });
    };

    if (typeof props.data.inputs['send'] !== 'undefined')
        props.data.inputs['submit'].icon = 'PaperPlaneRight';

    props.data.inputs['payload'].value = parseInt((new Date()).getTime() / 1000);

    props.data.inputs['submit'].hide_errors = true;

    props.data.inputs['submit'].icon = 'PaperPlane';
    props.data.inputs['submit'].variant = 'primary';
    props.data.inputs['submit'].rounded = 'true';

    props.data.inputs['files'].rounded = 'true';
    props.data.inputs['files'].variant = 'default';

    const sPad = isWeb ? 'p-3' : (isIos || isWeb) ? 'px-2 pb-2' : 'px-1';
    
    return <View className='w-full  px-3' >
        <Row className='w-full items-end  '>
            <View className={'mr-2 ' + (isWeb ? '' : ' w-11 ')}>
                {getFormFieldByData(props.data.inputs['files'], props.handleSubmit, 'custom', { previewPlaceHolder: setPlaceHolder, classes: 'mb-0 mt-0 ' })}
            </View>
            <View className={`flex-auto bg-bgritem dark:bg-bgritem-d rounded-3xl justify-center items-end ${sPad}`} >
                {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['cf'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['payload'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['message'], props.handleSubmit, 'custom', { container_class: 'comments', focus: true, bg: 'transparent', submitOnEnter: true, styles: { minHeight: "auto" }, classes: 'mb-0 mt-0', placeholder: 'Message ...' })}
                {getFormFieldByData(props.data.inputs['id'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['message_id'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['send'], props.handleSubmit, 'custom')}
            </View>

            <View className={'ml-2 ' + (isWeb ? '' : ' w-11 ')}>{getFormFieldByData(props.data.inputs['submit'], props.handleSubmit, 'custom', { classes: isWeb ? 'mb-0 ml-0 mt-0' : 'mb-0 mt-0' })}</View>
        </Row>
        {(prevList.length > 0 && prevList[0]?.key) && <Row className='flex-wrap gap-2 mt-3'>{prevList}</Row>}
        {getFormFieldByData(props.data.inputs['cmt_mood'], props.handleSubmit, 'custom')}
    </View>
}
