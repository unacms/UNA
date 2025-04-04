import Field from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import { Button } from 'app/design/controls'
import { View } from 'app/design/view'
import React, { useState } from 'react';

const autofillOverrideStyle = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    transition: background-color 5000s ease-in-out 0s;
  }
`;

export default function FormFieldPassword(props) {
    let formContext = useFormContext();
    const [isVisible, setIsVisible] = useState(true)
    let { formState } = formContext;
    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    let { field } = useController({ name, rules, defaultValue });

    const placeholder = props.use_caption_as_placeholder? props.caption : props.placeholder;

    return (
        <Field {...props}>
            <style>{autofillOverrideStyle}</style>
            <View>
            <Input 
                textContentType="none"
                placeholder = {placeholder}
                secureTextEntry={isVisible}
                name={props.name}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                value={field.value}
                style={{paddingRight: 48}}
            />
            
            <View className="absolute right-0 top-1 px-1">
                <Button startDecorator={isVisible?'Eye':'EyeSlash'} rounded size="sm" variant="text" onPress={()=>{setIsVisible(!isVisible)}}  />
            </View>
            </View>
        </Field>
    );
}
