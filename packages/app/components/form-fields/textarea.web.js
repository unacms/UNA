import dynamic from 'next/dynamic'
import Field, {getValidationRules} from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { InputMulti, Input } from 'app/design/controls'
import { useState, useMemo, useEffect } from 'react';
import React from 'react';
import { View } from 'app/design/view'
import { TextInput as TextInputDef} from 'react-native'
import { styled } from 'nativewind'

function FormFieldFtf(props) {
    const computedData = useMemo(() => {
        const FormFieldFtf_ = React.memo(dynamic(() => import('./rtf')));
            return  <FormFieldFtf_ {...props} />
    }, [props.b, props.placeholder]); 
    return computedData;
}

export default function FormFieldText(props) {
    
    const rules = getValidationRules(props);
    const name = props.name;
    const defaultValue = props.value ? props.value : '';
    const formContext = useFormContext();
    const { field } = useController({ name, rules, defaultValue });
    let h = props.height ? props.height : null;
    const [height, setHeight] = useState(h);
    const accessibility = props.caption.length > 0 ? props.caption : 'text';

    const placeholder = props.use_caption_as_placeholder? props.caption : props.placeholder;

    let input = <InputMulti
        multiline
        editable
        numberOfLines={4}
        name={props.name}
        placeholder = {placeholder}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        value={field.value}
        aria-label={accessibility}
    />
    if (props.autoheight)
        input = <Input
            multiline
            editable
            style={{height: height}}
            placeholder = {placeholder}
            numberOfLines={props.numLines ? props.numLines : 4}
            name={props.name}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            aria-label={accessibility}
        />

    if (props.viewClasses){

        const InputMulti2 = useMemo(() => {
            return styled(TextInputDef, props.viewClasses)
        }, []);
    
        input = <InputMulti2
            multiline
            editable
            style={{height: height}}
            placeholder = {props.placeholder}
            onContentSizeChange={e => setHeight(e.nativeEvent.contentSize.height > 70 ? e.nativeEvent.contentSize.height : e.nativeEvent.contentSize.height < 32 ? 32 : e.nativeEvent.contentSize.height)}
            name={props.name}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            aria-label={accessibility}
        />
    }
    if (props.html == 1 || props.html == 2 || props.html == 3){
        input = <View className={props.numLines ==1 ? '' : 'editor-height  editor-height-'+props.html}>
            <FormFieldFtf  {...props} />
        </View>;
    }  
    
    useEffect(() => {
        if (props.value !== undefined)
            field.onChange(props.value)
           //formContext.setValue(props.name, props.value)
    }, [props.name, props.value]);

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
             <View className='h-0 w-0 absolute top-0 z-0 opacity-0'><Input autoFocus={true}/></View>
            {input}
        </Field>
    );
}
