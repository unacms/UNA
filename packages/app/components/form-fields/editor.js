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

function PlainText(props) {
    // Extract onHeight callback for messenger auto-grow support
    const { onHeight, ...otherProps } = props;

    const rules = getValidationRules(otherProps);
    const name = otherProps.name;
    const defaultValue = otherProps.value ? otherProps.value : '';
    const formContext = useFormContext();
    const { field } = useController({ name, rules, defaultValue });
    // Use smaller initial height for comments forms
    const isCommentsForm = otherProps.container_class === 'comments';
    const isMessenger = otherProps.form_name === 'messenger';
    const initialHeight = isCommentsForm ? 24 : null;
    let h = otherProps.height ? otherProps.height : initialHeight;
    const [height, setHeight] = useState(h);
    const accessibility = otherProps.caption.length > 0 ? otherProps.caption : 'text';
    const placeholder = otherProps.use_caption_as_placeholder ? otherProps.caption : otherProps.placeholder;
    // Disable auto-height for messenger to prevent conflicts with parent height management
    const isAutoHeight = !isMessenger;

    const minHeightValue = isCommentsForm ? 24 : 100;

    let input = (
        <InputMulti
            multiline
            name={otherProps.name}
            placeholder={placeholder}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            aria-label={accessibility}
            onHeight={onHeight}
            scrollEnabled={!isMessenger}
            onContentSizeChange={e => {
                const newHeight = e.nativeEvent.contentSize.height;
                if (isAutoHeight) {
                    setHeight(newHeight);
                }
                // Always call onHeight callback for messenger auto-grow
                if (onHeight) {
                    onHeight(newHeight);
                }
            }}
            style={isAutoHeight ? { height, minHeight: minHeightValue, maxHeight:200 } : { minHeight: minHeightValue }}
            defaultValue={otherProps.value || otherProps.default_value || ''}
            editorProps={{
                attributes: {
                    class: `prose-mirror ${otherProps.classes} ${ (otherProps.form_name === 'feed_edit' || otherProps.form_name === 'feed' || otherProps.container_class !== 'comments') ? 'tiptap-default' : ''} `,
                },
            }}
            onDebouncedUpdate={(editor) => {
                // ... existing code ...
            }}
        />
    );

    if (otherProps.viewClasses) {
        input = <TextInputClear
            multiline
            placeholder={otherProps.placeholder}
            scrollEnabled={!isMessenger}
            onContentSizeChange={e => {
                const rawHeight = e.nativeEvent.contentSize.height;
                const newHeight = rawHeight > 70 ? rawHeight : rawHeight < 32 ? 32 : rawHeight;
                if (isAutoHeight) {
                    setHeight(newHeight);
                }
                // Always call onHeight callback for messenger auto-grow
                if (onHeight) {
                    onHeight(rawHeight); // Pass raw height for proper calculation by parent
                }
            }}
            name={otherProps.name}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            className=' placeholder-muted-foreground text-foreground leading-6 text-lg font-medium py-3 '
            aria-label={accessibility}
        />
    }

    useEffect(() => {
        if (otherProps.value !== undefined)
            field.onChange(otherProps.value)
    }, [otherProps.name, otherProps.value]);

    return input;
}
}