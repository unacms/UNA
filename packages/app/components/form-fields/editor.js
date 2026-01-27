
import Field, { getValidationRules } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { InputMulti, TextInputClear } from 'app/design/controls'
import { useState, useEffect } from 'react';
import  RftText from 'app/components/form-fields/editor-inner';
import { Platform } from 'react-native'
import { View } from 'app/design/view'

const isWeb = Platform.OS === 'web';

export default function FormFieldText(props) {
    const formContext = useFormContext();
    return (
        <Field {...props} error2={formContext.formState.errors[props.name]}>
            {props.html == 1 || props.html == 2 || props.html == 3 ? <>
                <RftText {...props} />
               
            </> : <PlainText {...props} />}
             {(isWeb && props.autofocus)&& <View className="absolute w-[1px] h-[1px]"><TextInputClear autoFocus={true}/></View>}
        </Field>
    );
}

function PlainText(props) {

    const rules = getValidationRules(props);
    const name = props.name;
    const defaultValue = props.value ? props.value : '';
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
            autoFocus={props.autofocus}
            value={field.value}
            aria-label={accessibility}
            onContentSizeChange={e => {
                if (isAutoHeight) {
                    setHeight(e.nativeEvent.contentSize.height);
                }
            }}
            style={isAutoHeight ? { height, minHeight: minHeightValue, maxHeight:200 } : {}}
            /*defaultValue={props.value || props.default_value || ''}*/
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
            className='placeholder-label-tertiary text-foreground leading-6 text-lg font-medium py-3 '
            aria-label={accessibility}
        />
    }

    useEffect(() => {
        if (props.value !== undefined)
            field.onChange(props.value)
    }, [props.name, props.value]);

    return input
}