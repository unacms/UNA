import Field, { getValidationRules } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { InputMulti, TextInputClear } from 'app/design/controls'
import { useState, useEffect } from 'react';
import RftText from './editor-rft-text';

export default function FormFieldText(props) {
    const formContext = useFormContext();      

    return (
        <Field {...props} error2={formContext.formState.errors[props.name]}>
            {props.html == 1 || props.html == 2 || props.html == 3 ? <>
                <RftText {...props} />

            </> : <PlainText {...props} />}
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
    const maxHeightValue = 200;
    const clampedHeight = Math.min(Math.max(height ?? minHeightValue, minHeightValue), maxHeightValue);

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
                    const next = Math.min(
                        Math.max(e.nativeEvent.contentSize.height, minHeightValue),
                        maxHeightValue
                    );
                    setHeight(prev => (prev === next ? prev : next));
                }
            }}
            style={isAutoHeight ? { height: clampedHeight, minHeight: minHeightValue, maxHeight: maxHeightValue } : {}}
            /*defaultValue={props.value || props.default_value || ''}*/
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
            className='placeholder-muted-foreground text-foreground leading-6 text-lg font-medium py-3 '
            aria-label={accessibility}
        />
    }

    useEffect(() => {
        // setValue (shouldDirty: false) instead of field.onChange, so syncing the
        // server-provided value does not mark the untouched form as dirty.
        if (props.value !== undefined)
            formContext.setValue(props.name, props.value)
    }, [props.name, props.value]);

    return input
}
