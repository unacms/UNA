import Field, { getValidationRules } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { InputMulti, Input, TextInputClear, Button } from 'app/design/controls'
import { useState, useRef, useEffect } from 'react';
import { View } from 'app/design/view'
import { Platform } from 'react-native';
import { lazy } from 'react';

let RftText;

if (Platform.OS === 'web') {
    const dynamic = require('next/dynamic').default;
    RftText = dynamic(() => import('app/components/form-fields/editor-inner'), { ssr: false });
} else {
    RftText = require('app/components/form-fields/editor-inner').default;
}
//const RftText = dynamic(() => import('app/components/form-fields/editor-inner'), { ssr: false });

//import  RftText from 'app/components/form-fields/editor-inner';
//const RftText = lazy(() => import('app/components/form-fields/editor-inner')); // Disablet to avoid re-rendern in comments feed

export default function FormFieldText(props) {
   // const RftText = lazy(() => import('app/components/form-fields/editor-inner'));
    const formContext = useFormContext();

    return (
        <Field {...props} error2={formContext.formState.errors[props.name]}>
            <View className='h-0 w-0 absolute top-0 z-0 opacity-0'></View>
            {props.html == 1 || props.html == 2 || props.html == 3 ? <RftText {...props} /> : <PlainText {...props} />}
        </Field>
    );
}

function PlainText(props) {

    const rules = getValidationRules(props);
    const name = props.name;
    const defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();
    const { field } = useController({ name, rules, defaultValue });
    // Use smaller initial height for comments forms
    const isCommentsForm = props.container_class === 'comments';
    const initialHeight = isCommentsForm ? 24 : null;
    let h = props.height ? props.height : initialHeight;
    const [height, setHeight] = useState(h);
    const accessibility = props.caption.length > 0 ? props.caption : 'text';
    const placeholder = props.use_caption_as_placeholder ? props.caption : props.placeholder;
    const isAutoHeight = true;

    const minHeightValue = isCommentsForm ? 24 : 100;

    let input = (
        <InputMulti
            multiline
            name={props.name}
            placeholder={placeholder}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            aria-label={accessibility}
            onContentSizeChange={e => {
                if (isAutoHeight) {
                    setHeight(e.nativeEvent.contentSize.height);
                }
            }}
            style={isAutoHeight ? { height, minHeight: minHeightValue, maxHeight:200 } : {}}
            defaultValue={props.value || props.default_value || ''}
            editorProps={{
                attributes: {
                    class: `prose-mirror ${props.classes} ${ (props.form_name === 'feed_edit' || props.form_name === 'feed' || props.container_class !== 'comments') ? 'tiptap-default' : ''} `,
                },
            }}
            onDebouncedUpdate={(editor) => {
                // ... existing code ...
            }}
        />
    );

    if (props.viewClasses) {
        input = <TextInputClear
            multiline
            placeholder={props.placeholder}
            onContentSizeChange={e => setHeight(e.nativeEvent.contentSize.height > 70 ? e.nativeEvent.contentSize.height : e.nativeEvent.contentSize.height < 32 ? 32 : e.nativeEvent.contentSize.height)}
            name={props.name}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            className='placeholder-neutral-500 text-neutral-900 leading-6 dark:text-neutral-100 text-lg font-medium py-3 '
            aria-label={accessibility}
        />
    }

    useEffect(() => {
        if (props.value !== undefined)
            field.onChange(props.value)
    }, [props.name, props.value]);

    return input
}