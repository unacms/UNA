import Field from './_field';
import AdaptiveLabel from './adaptive-label';
import { useController } from 'react-hook-form';
import { Input } from 'app/design/controls'
import { Button } from 'app/design/controls'
import { View } from 'app/design/view'
import React, { useState } from 'react';
import { appSetting } from 'app/lib/util';
import { useNativeReturnKeyNav } from 'app/context/form-focus-chain';

export default function FormFieldPassword(props) {
    const [isVisible, setIsVisible] = useState(true)
    const rules = {};
    const name = props.name;
    const defaultValue = props.value ? props.value : '';
    const { field } = useController({ name, rules, defaultValue });
    const placeholder = props.use_caption_as_placeholder? props.caption : props.placeholder;
    const { inputRef, returnKeyProps } = useNativeReturnKeyNav(name, props.handleSubmit);
    
    // Get button configuration from settings
    const buttonConfig = appSetting('forms', 'password_eye_button');

    return (
        <Field {...props}>
            <View className="relative w-full">
                <AdaptiveLabel
                    caption={props.caption}
                    value={field.value}
                    useCaptionAsPlaceholder={props.use_caption_as_placeholder}
                >
                    <Input
                        ref={inputRef}
                        textContentType="password"
                        autoComplete="current-password"
                        placeholderTextColor="#6b7280"
                        placeholder={placeholder}
                        secureTextEntry={isVisible}
                        name={props.name}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value}
                        aria-label={props.caption}
                        {...returnKeyProps}
                    />
                </AdaptiveLabel>
                <View className="absolute right-2 top-1/2 -translate-y-1/2 justify-center items-center z-20">
                    <Button
                        startDecorator={isVisible ? buttonConfig.startDecorator.visible : buttonConfig.startDecorator.hidden}
                        size={buttonConfig.size}
                        variant={buttonConfig.variant}
                        rounded={buttonConfig.rounded}
                        onPress={() => { setIsVisible(!isVisible) }}
                    />
                </View>
            </View>
        </Field>
    );
}
