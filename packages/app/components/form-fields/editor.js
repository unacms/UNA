import Field, { getValidationRules } from './_field';
import { useFormContext } from 'react-hook-form';
import { InputMulti } from 'app/design/controls'
import { useState } from 'react';
import RftText from './editor-rft-text';
import { useFormField } from 'app/lib/form/use-form-field';

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
    const {
        name,
        field,
        placeholder,
        readOnly,
        placeholderTextColor,
        onFocus,
        onBlur,
    } = useFormField(props, {
        rules: getValidationRules(props),
        returnKey: false,
    });

    // Use smaller initial height for comments forms
    const isCommentsForm = props.container_class === 'comments';
    const initialHeight = isCommentsForm ? 24 : null;
    let h = props.height ? props.height : initialHeight;
    const [height, setHeight] = useState(h);
    const accessibility = props.caption.length > 0 ? props.caption : 'text';
    const isAutoHeight = true;

    const minHeightValue = isCommentsForm ? 24 : 100;
    const maxHeightValue = 200;
    const clampedHeight = Math.min(Math.max(height ?? minHeightValue, minHeightValue), maxHeightValue);

    return (
        <InputMulti
            multiline
            name={name}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor}
            onChangeText={field.onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            autoFocus={props.autofocus}
            value={String(field.value ?? '')}
            readOnly={readOnly}
            editable={!readOnly}
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
        />
    );
}
