import Field from './_field';
import AdaptiveLabel from './adaptive-label';
import { useController } from 'react-hook-form';
import { Input, NeoButton } from 'app/design/controls'
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
    
    const eyeIcons = appSetting('forms', 'password_eye_button')?.image;
    const eyeIcon = isVisible ? eyeIcons?.visible : eyeIcons?.hidden;

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
                {eyeIcon ? (
                    <View className="absolute right-1.5 top-1/2 -translate-y-1/2 justify-center items-center z-20">
                        <NeoButton
                            image={eyeIcon}
                            style="borderless"
                            controlSize="small"
                            accessibilityLabel={isVisible ? 'Show password' : 'Hide password'}
                            onPress={() => { setIsVisible(!isVisible) }}
                        />
                    </View>
                ) : null}
            </View>
        </Field>
    );
}
