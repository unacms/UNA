import { forwardRef } from 'react';
import { TextInput as TextInputDef, Platform, TextInputProps } from 'react-native'
import type { TextInput } from 'react-native';
import { View, Row } from 'app/design/view'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting, cn } from 'app/lib/util'
import { Picker as PickerDef, type PickerProps } from '@react-native-picker/picker';

const inputSettings = appSetting('theme', 'inputs');
const isWeb = Platform.OS === 'web';
const isIos = Platform.OS === 'ios';

export const InputRounded = {
    full: 'full',        // key equals value
    default: 'default',
} as const;

export const InputSize = {
    small: 'small',
    regular: 'regular',
    large: 'large',
} as const;

interface CustomInputProps extends Omit<TextInputProps, 'style'> {
    className?: string;
    style?: any;
    rounded?: keyof typeof InputRounded;
    size?: keyof typeof InputSize;
}

interface InputWithIconsProps extends CustomInputProps {
    startDecorator?: string;
    endDecorator?: string;
}

interface InputMultiProps extends CustomInputProps {
    onHeight?: (height: number) => void;
}

export const TextInputClear = TextInputDef

const getInputStyleProps = (style: any) =>
    (isIos || style)
        ? { style: [isIos && { borderCurve: 'continuous' }, style].filter(Boolean) }
        : {};

export const Input = forwardRef<TextInput, CustomInputProps>(
    ({ className, style, rounded = InputRounded.default, size = InputSize.regular, ...props }, ref) => (
        <TextInputDef
            className={cn(
                className,
                inputSettings.base,
                inputSettings.size[size] ?? inputSettings.size.regular,
                rounded === InputRounded.full && inputSettings.rounded.full,
            )}
            {...getInputStyleProps(style)}
            {...props}
            ref={ref}
        />
    )
);

export const InputWithIcons = forwardRef<TextInput, InputWithIconsProps>(
    ({ className, startDecorator, endDecorator, style, ...props }, ref) => (
        <Row className="items-center flex-auto">
            {startDecorator && (
                <View className="absolute left-3.5 h-full items-center justify-center">
                    <Icon icon={startDecorator} size={24} className="text-muted-foreground " />
                </View>
            )}
            <Input
                ref={ref}
                className={`${className || ''} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`}
                style={style}
                rounded={InputRounded.full}
                {...props}
            />
            {endDecorator && (
                <View className="absolute right-3 h-full items-center justify-center">
                    <Icon icon={endDecorator} size={24} className="text-muted-foreground " />
                </View>
            )}
        </Row>
    )
);

export const InputMulti = forwardRef<TextInput, InputMultiProps>(
    ({ className, onHeight, style, onContentSizeChange, ...props }, ref) => (
        <Input
            ref={ref}
            className={className}
            style={style}
            multiline={true}
            {...props}
            onContentSizeChange={(e) => {
                onContentSizeChange?.(e);
                if (onHeight && e.nativeEvent?.contentSize?.height) {
                    onHeight(e.nativeEvent.contentSize.height);
                }
            }}
        />
    )
);

export const Hidden = forwardRef<TextInput, CustomInputProps>(
    (props, ref) => {
        // Native: do not mount a display:none TextInput — Yoga relayout on keyboard
        // focus can SIGABRT (react-native#52349). Form values use useController.
        if (!isWeb) {
            return null;
        }
        return <TextInputDef className="hidden" ref={ref} {...props} />;
    }
);

interface CustomPickerProps extends PickerProps {
    className?: string;
    size?: keyof typeof InputSize;
}

interface PickerStyledRefProps extends PickerProps {
    classes?: string;
    className?: string;
    size?: keyof typeof InputSize;
}

const getPickerSurfaceClass = (size?: keyof typeof InputSize) => {
    const sizeClass = inputSettings.size[size ?? InputSize.regular] ?? inputSettings.size.regular;
    // Radius comes from size.* (small/regular/large); no separate rounded.default.
    return cn(inputSettings.select, sizeClass);
};
const Picker = PickerDef as any;

const getPickerStyleProps = (style: any) =>
    (isIos || style)
        ? { style: [isIos && { borderCurve: 'continuous' }, style].filter(Boolean) }
        : {};

export const PickerStyled = ({ className, style, size = InputSize.regular, ...props }: CustomPickerProps) => (
    <Picker
        className={`${getPickerSurfaceClass(size)} ${className || ''}`}
        {...getPickerStyleProps(style)}
        {...props}
    />
);
PickerStyled.displayName = 'PickerStyled';

export const PickerStyledRef = forwardRef<any, PickerStyledRefProps>(
    ({ classes, className, style, size = InputSize.regular, ...props }, ref) => (
        <View className={` ${isWeb ? 'flex-auto items-center flex-row' : ''} `}>
            <Picker 
                ref={ref} 
                className={`${classes ? classes : getPickerSurfaceClass(size)} ${className || ''} w-full`}
                {...getPickerStyleProps(style)}
                {...props}
            />
            {isWeb && (
                <View className="absolute right-3 pointer-events-none">
                    <Icon icon="ChevronDown" size={20} className="text-muted-foreground" />
                </View>
            )}
        </View>
    )
);


export const PickerStyledIos = ({ className, style, size = InputSize.regular, ...props }: CustomPickerProps) => (
    <Picker
        className={`${getPickerSurfaceClass(size)} ${className || ''}`}
        {...getPickerStyleProps(style)}
        {...props}
    />
);
