import Field from './_field';
import FormFieldFtf from './rtf';

import { useController } from 'react-hook-form';
import { Input } from 'app/design/controls'
import { useState, useRef  } from 'react';


export default function FormFieldText(props) {
    
    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    
    const { field } = useController({ name, rules, defaultValue });
    const [height, setHeight] = useState(null);
    const editorRef = useRef(null);

    let input = <Input
        multiline
        editable
        numberOfLines={props.numLines ? props.numLines : 4}
        name={props.name}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        value={field.value}
    />
    if (props.autoheight)
        input = <Input
            multiline
            editable
            style={{height: height}}
            numberOfLines={props.numLines ? props.numLines : 4}
            onContentSizeChange={e => setHeight(e.nativeEvent.contentSize.height > 70 ? 70 : e.nativeEvent.contentSize.height < 42 ? 42 : e.nativeEvent.contentSize.height)}
            name={props.name}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={field.value}
        />

    if (props.html == 2){
        input =  <FormFieldFtf  {...props} />;
    }    

    return (
        <Field {...props}>{input}</Field>
    );
}
