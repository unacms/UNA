import { View, Row } from 'app/design/view'
import { useRef, useState, useEffect } from 'react';
import { getFormFieldByData, getEditorHeight } from 'app/lib/form-helpers'
import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native'
import { useFormContext } from 'react-hook-form';
import { FileButton } from 'app/lib/form-helpers';

export default function FormMessenger(props) {
    const isWeb = Platform.OS == 'web';
    const initialHeight = 48;
    const formContext = useFormContext();
    const [isExImage, setIsExImage] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [editorHeight, setEditorHeight] = useState(initialHeight);
    const imagesValue = formContext.watch('files')

    const windowWidth = useWindowDimensions().width;


    if (Platform.OS !== 'web') {
        styles = { width: windowWidth - 110 }
    }


    const viewFormRef = useRef();


    function setIsFocus() {

        setIsExImage(false)
        setIsFocused(true)
    }

    function setIsBlur() {

        setIsFocused(false)
    }

    function checkEditorHeight(height) {
        setEditorHeight(getEditorHeight(height, initialHeight))
    }

    if (typeof props.data.inputs['send'] !== 'undefined')
        props.data.inputs['submit'].icon = 'SendHorizontal';

    props.data.inputs['payload'].value = parseInt((new Date()).getTime() / 1000);

    props.data.inputs['submit'].hide_errors = true;

    props.data.inputs['submit'].icon = 'SendHorizontal';
    props.data.inputs['submit'].variant = 'primary';
    props.data.inputs['submit'].rounded = 'true';

    props.data.inputs['files'].rounded = 'true';
    props.data.inputs['files'].variant = 'default';

    const sPad = 'px-3 py-2.5';
    return <View className='w-full px-2' >
        <Row className='w-full items-end  '>
            <View className={'mr-2  ' + (isWeb ? '' : ' w-12 ')}>
                <FileButton field_name='files' icon="Image" asDefaultStorage={true} />

            </View>
            <View className={`flex-auto bg-bgritem dark:bg-bgritem-d rounded-3xl justify-center items-end ${sPad}`} style={{ height: editorHeight }}>
                {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['cf'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['payload'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['message'], props.handleSubmit, 'custom', { autofocus: false, form_name: props.name, container_class: 'comments', classes: "flex-1", focus: true, bg: 'transparent', submitOnEnter: true, noMargin: true, placeholder: 'Message ...', onHeight: checkEditorHeight, onFocus: setIsFocus, onBlur: setIsBlur })}
                {getFormFieldByData(props.data.inputs['id'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['message_id'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['send'], props.handleSubmit, 'custom')}
            </View>

            <View className={'ml-2 ' + (isWeb ? '' : ' w-12 ')}>{getFormFieldByData(props.data.inputs['submit'], props.handleSubmit, 'custom', { classes: isWeb ? 'ml-0 ' : '', noMargin: true, size: 'base' })}</View>
        </Row>
        <Row className={`${imagesValue && 'flex-wrap gap-2 mt-3'}`}>{getFormFieldByData(
            props.data.inputs['files'],
            props.handleSubmit,
            'notitle',
            { hide_button: true, list_only: true }
        )}</Row>
        {getFormFieldByData(props.data.inputs['cmt_mood'], props.handleSubmit, 'custom')}
    </View>
}
