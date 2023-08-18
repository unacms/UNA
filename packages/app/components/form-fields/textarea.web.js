import dynamic from 'next/dynamic'
import Field from './_field';
import { useController } from 'react-hook-form';
import { InputMulti, Input } from 'app/design/controls'
import { useState, useMemo } from 'react';
import React from 'react';
//import FormFieldFtf  from './rtf';

function FormFieldFtf(props) {
    const computedData = useMemo(() => {
        const FormFieldFtf_ = React.memo(dynamic(() => import('./rtf')));
      return  <FormFieldFtf_ {...props} />
    }, [props.b]); 
    return computedData;
}

export default function FormFieldText(props) {
    
    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    
    const { field } = useController({ name, rules, defaultValue });
    const [height, setHeight] = useState(null);
    const accessibility = props.caption.length > 0 ? props.caption : 'text';

    let input = <InputMulti
        multiline
        editable
        numberOfLines={4}
        name={props.name}
        placeholder = {props.placeholder}
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
            placeholder = {props.placeholder}
            numberOfLines={props.numLines ? props.numLines : 4}
            onContentSizeChange={e => setHeight(e.nativeEvent.contentSize.height > 70 ? 70 : e.nativeEvent.contentSize.height < 42 ? 42 : e.nativeEvent.contentSize.height)}
            name={props.name}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
            aria-label={accessibility}
        />

    if (props.html == 1 || props.html == 2 || props.html == 3){
        input =  <FormFieldFtf  {...props} />;
    }    

    return (
        <Field {...props}>{input}</Field>
    );
}
