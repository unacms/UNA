import { View, Row } from 'app/design/view'
import { useEffect } from 'react';
import { getFormFieldByData } from 'app/lib/form-helpers'
import { Platform } from 'react-native'
import { useFormContext } from 'react-hook-form';
import { FileButton } from 'app/lib/form-helpers';
import { useSound } from 'app/lib/hooks/useSound';
import emitter from 'app/context/emitter';

export default function FormMessenger(props) {
    const isWeb = Platform.OS == 'web';
    const formContext = useFormContext();
    const imagesValue = formContext.watch('files');

    const playSound = useSound('success');

    useEffect(() => {
            if (formContext.formState.isSubmitted) {
                playSound();
                formContext.setValue('message', '');
                emitter.emit(`editor`, { action: 'set_content', value: '' })
                emitter.emit(`files`, { action: 'clear' })  
            }
        }, [formContext.formState.isSubmitted, formContext]);



    if (typeof props.data.inputs['send'] !== 'undefined')
        props.data.inputs['submit'].icon = 'SendHorizontal';

    props.data.inputs['payload'].value = parseInt((new Date()).getTime() / 1000);

    props.data.inputs['submit'].hide_errors = true;

    props.data.inputs['submit'].icon = 'SendHorizontal';
    props.data.inputs['submit'].variant = 'primary';
    props.data.inputs['submit'].rounded = 'true';

    props.data.inputs['files'].rounded = 'true';
    props.data.inputs['files'].variant = 'default';

    const sPad = 'px-3 py-2 ';
    return <View className='w-full px-3' >
        <Row className='w-full items-end'>
            <View className={'mr-2  ' + (isWeb ? '' : ' w-12 ')}>
                <FileButton field_name='files' icon="Image" />

            </View>
            <View
                className="flex-auto bg-muted/50 rounded-xl border border-border/60 px-3 py-2"
                style={{
                    transition: 'height 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'height',
                    transformOrigin: 'bottom center'
                }}
            >
                {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['cf'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['payload'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['message'], props.handleSubmit, 'custom', {
                    
                    form_name: props.name, 
                    container_class: 'comments', 
                    classes: 'text-card-foreground tiptap-comments',
                    autofocus: false, 
                    bg: 'transparent', 
                    placeholder: 'Message ...',
                    noPadding: true,
                    initialHeight: 20,
                    maxHeight: 160,
                  
                    enableSubmitOnEnter: true,
                    focus: true, 
                })}
                {getFormFieldByData(props.data.inputs['id'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['message_id'], props.handleSubmit, 'custom')}
                {getFormFieldByData(props.data.inputs['send'], props.handleSubmit, 'custom')}
            </View>

            <View className={'ml-2 ' + (isWeb ? '' : ' w-12 ')}>{getFormFieldByData(props.data.inputs['submit'], props.handleSubmit, 'custom', { classes: isWeb ? 'ml-0 ' : '', noPadding: true, size: 'base' })}</View>
        </Row>
        <Row className={`${imagesValue && 'flex-wrap gap-2 mt-3'}`}>{getFormFieldByData(
            props.data.inputs['files'],
            props.handleSubmit,
            'notitle',
            { hide_button: true, list_only: true, asDefaultStorage: true, form_name: props.name }
        )}</Row>
        {getFormFieldByData(props.data.inputs['cmt_mood'], props.handleSubmit, 'custom')}
    </View>
}
