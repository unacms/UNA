import Field, { getValidationRules } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { InputMulti, Input, TextInputClear, Button } from 'app/design/controls'
import { useState, useRef, useEffect } from 'react';
import { View, ScrollView } from 'app/design/view'
import { lazy, Suspense } from 'react';
const RftText = lazy(() => import('app/components/form-fields/editor-inner'));

export default function FormFieldText(props) {
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
    let h = props.height ? props.height : null;
    const [height, setHeight] = useState(h);
    const accessibility = props.caption.length > 0 ? props.caption : 'text';
    const placeholder = props.use_caption_as_placeholder ? props.caption : props.placeholder;

    let input = <InputMulti
        multiline
        editable
        numberOfLines={4}
        name={props.name}
        placeholder={placeholder}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        value={field.value}
        aria-label={accessibility}
    />
    if (props.autoheight)
        input = <Input
            multiline
            editable
            style={{ height: height }}
            placeholder={placeholder}
            numberOfLines={props.numLines ? props.numLines : 4}
            name={props.name}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            aria-label={accessibility}
        />

    if (props.viewClasses) {
        input = <TextInputClear
            multiline
            editable
            placeholder={props.placeholder}
            onContentSizeChange={e => setHeight(e.nativeEvent.contentSize.height > 70 ? e.nativeEvent.contentSize.height : e.nativeEvent.contentSize.height < 32 ? 32 : e.nativeEvent.contentSize.height)}
            name={props.name}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            className='placeholder-neutral-500 text-neutral-900 leading-6 dark:text-neutral-100 text-lg font-medium py-3'
            aria-label={accessibility}
        />
    }

    useEffect(() => {
        if (props.value !== undefined)
            field.onChange(props.value)
    }, [props.name, props.value]);

    return input
}