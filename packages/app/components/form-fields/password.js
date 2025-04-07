import Field from './_field';
import { useController } from 'react-hook-form';
import { Input } from 'app/design/controls'
import { Button } from 'app/design/controls'
import { View } from 'app/design/view'
import React, { useState } from 'react';

export default function FormFieldPassword(props) {
    const [isVisible, setIsVisible] = useState(true)
    const rules = {};
    const name = props.name;
    const defaultValue = props.value ? props.value : '';
    const { field } = useController({ name, rules, defaultValue });
    const placeholder = props.use_caption_as_placeholder? props.caption : props.placeholder;

    return (
        <Field {...props}>
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
