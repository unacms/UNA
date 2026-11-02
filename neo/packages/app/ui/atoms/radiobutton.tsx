
import { Text } from 'app/design/typography'
import { View, Pressable } from 'app/design/view'
import { cueAttributes } from 'app/lib/sound'
import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import React, { isValidElement } from 'react';
import { appSetting } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon';
const checkboxTheme = appSetting('theme', 'checkbox');

type RadioButtonProps = {
    title?: React.ReactNode;
    info?: React.ReactNode;
    /** Called when the row is pressed; the indicator is display only. */
    onPress?: (arg?: unknown) => void;
    status?: 'checked' | 'unchecked' | string;
    value?: unknown;
    disabled?: boolean;
    /** Icon name for `<Icon>` or a ready element. */
    icon?: string | React.ReactNode;
    /** Render only the round indicator, without label and pressable row. */
    rb_obly?: boolean;
    /** `menu`: a row sized like a dropdown menu item, with a 36px icon or avatar. */
    variant?: 'default' | 'menu';
};

export default function RadioButton({ title, info, onPress, status, value, disabled, icon, rb_obly, variant = 'default' }: Readonly<RadioButtonProps>) {

    const selected = status == 'checked';
    const menu = variant === 'menu';
    const resolvedIcon = typeof icon === 'string'
        ? <Icon icon={icon} width={24} height={24} />
        : isValidElement(icon)
            ? icon
            : null;
    if (rb_obly)
        return <View className=' h-5 w-5 rounded-full border-2 border-control-border bg-transparent web:group-hover:border-secondary-foreground justify-center items-center m-1'>
            {selected ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
        </View>
    return (
        <Pressable disabled={disabled} onPress={onPress} role="radio" aria-checked={selected} {...(disabled ? {} : cueAttributes('select'))} className={`flex-row gap-x-3 ${checkboxTheme[menu ? 'u-controls-checkbox-container-menu' : 'u-controls-checkbox-container']} ${disabled ? '' : checkboxTheme['u-controls-checkbox-container-bg']}`}>
            {!!resolvedIcon && <View className={checkboxTheme[menu ? 'u-controls-checkbox-icon-menu' : 'u-controls-checkbox-icon']}>{resolvedIcon}</View>}
            <View className='flex-auto '>
                <Text className={checkboxTheme['u-controls-checkbox-text']}>{title}</Text>
                {!!info && <Text className={checkboxTheme['u-controls-checkbox-text2']}>{info}</Text>}
            </View>
            {/* The ring is on the View: on web the primitive renders a bare <button> without its className. Display only, like the checkbox mark: presses go to the row. */}
            <View className={checkboxTheme['u-controls-radiobutton-indicator']} pointerEvents="none">
                <CheckboxPrimitive.Root
                    checked={selected}
                    onCheckedChange={() => {}}
                    tabIndex={-1}
                    aria-hidden
                    className="items-center justify-center"
                >
                    <CheckboxPrimitive.Indicator>
                        <View className={checkboxTheme['u-controls-radiobutton-indicator-active']} />
                    </CheckboxPrimitive.Indicator>
                </CheckboxPrimitive.Root>
            </View>
        </Pressable>
    );
}