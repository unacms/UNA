
import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'
import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import React, { isValidElement } from 'react';
import { appSetting } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon';
const checkboxTheme = appSetting('theme', 'checkbox');

type RadioButtonProps = {
    title?: React.ReactNode;
    info?: React.ReactNode;
    /** Receives the press event (row) or the next checked state (indicator). */
    onPress?: (arg?: unknown) => void;
    status?: 'checked' | 'unchecked' | string;
    value?: unknown;
    disabled?: boolean;
    /** Icon name for `<Icon>` or a ready element. */
    icon?: string | React.ReactNode;
    /** Render only the round indicator, without label and pressable row. */
    rb_obly?: boolean;
};

export default function RadioButton({ title, info, onPress, status, value, disabled, icon, rb_obly }: RadioButtonProps) {

    const selected = status == 'checked';
    const resolvedIcon = typeof icon === 'string'
        ? <Icon icon={icon} width={24} height={24} />
        : isValidElement(icon)
            ? icon
            : null;
    if (rb_obly)
        return <View className=' h-5 w-5 rounded-full border-2 border-border bg-transparent web:group-hover:border-secondary-foreground justify-center items-center m-1'>
            {selected ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
        </View>
    return (
        <Pressable disabled={disabled} onPress={onPress} className={`flex-row gap-x-3 ${checkboxTheme['u-controls-checkbox-container']} ${checkboxTheme['u-controls-checkbox-container-bg']} ${disabled ? '' : ' web:hover:bg-background'} `}>
            {!!resolvedIcon && <View className={checkboxTheme['u-controls-checkbox-icon']}>{resolvedIcon}</View>}
            <View className='flex-auto '>
                <Text className={checkboxTheme['u-controls-checkbox-text']}>{title}</Text>
                {!!info && <Text className={checkboxTheme['u-controls-checkbox-text2']}>{info}</Text>}
            </View>
            <CheckboxPrimitive.Root
                checked={selected}
                onCheckedChange={(checked) => onPress?.(checked)}
                className={checkboxTheme['u-controls-radiobutton-indicator']}
            >
                <CheckboxPrimitive.Indicator>
                    <View className={checkboxTheme['u-controls-radiobutton-indicator-active']} />
                </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
        </Pressable>
    );
}