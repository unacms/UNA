import { forwardRef, useContext, type ReactNode } from 'react';
import { TextInput as TextInputDef, Platform, TextInputProps } from 'react-native'
import type { TextInput } from 'react-native';
import { View, Row } from 'app/design/view'
import { Icon } from 'app/ui/atoms/icon'
import { iosContinuousCurveStyle } from 'app/design/corner-smoothing'
import { appSetting, cn } from 'app/lib/util'
import { InputLabelInsideContext } from './input-label-context'
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

/** Size for fields that don't pass one: `theme.inputs.default_size`, else regular. */
const DEFAULT_SIZE: keyof typeof InputSize = inputSettings.default_size in InputSize ? inputSettings.default_size : InputSize.regular;

/** Start/end position of an input's 20px icon for its size (`theme.inputs.decorator_inset`). */
const decoratorInset = (size?: string): { start: string; end: string } =>
    inputSettings.decorator_inset?.[size ?? DEFAULT_SIZE]
    ?? inputSettings.decorator_inset?.regular
    ?? { start: 'left-3', end: 'right-3' };

/** Sizes whose adaptive label floats inside the input (`theme.inputs.adaptive_label_inside_sizes`). */
const isLabelInsideSize = (size: string) => (inputSettings.adaptive_label_inside_sizes ?? []).includes(size);

interface CustomInputProps extends Omit<TextInputProps, 'style'> {
    className?: string;
    style?: any;
    rounded?: keyof typeof InputRounded;
    size?: keyof typeof InputSize;
}

interface InputWithIconsProps extends CustomInputProps {
    startDecorator?: string | ReactNode;
    endDecorator?: string | ReactNode;
}

interface InputMultiProps extends CustomInputProps {
    onHeight?: (height: number) => void;
}

export const TextInputClear = TextInputDef

// A single-line UITextField applies the size's line height (leading-*) to typed text but not to the
// empty field, so the text jumped down on the first keystroke and the caret grew to the full line.
// Without it the field centres the font's own line, the same before and after typing.
const IOS_SINGLE_LINE_STYLE = { lineHeight: undefined };

const getInputStyleProps = (style: any, multiline?: boolean) =>
    (isIos || style)
        ? { style: [isIos && iosContinuousCurveStyle, isIos && !multiline && IOS_SINGLE_LINE_STYLE, style].filter(Boolean) }
        : {};

export const Input = forwardRef<TextInput, CustomInputProps>(
    ({ className, style, rounded = InputRounded.default, size = DEFAULT_SIZE, ...props }, ref) => {
        const labelInside = useContext(InputLabelInsideContext) && isLabelInsideSize(size);
        return (
            <TextInputDef
                className={cn(
                    inputSettings.base,
                    inputSettings.size[size] ?? inputSettings.size.regular,
                    labelInside && inputSettings.adaptive_input_inside,
                    rounded === InputRounded.full && inputSettings.rounded.full,
                    className,
                )}
                {...getInputStyleProps(style, props.multiline)}
                {...props}
                ref={ref}
            />
        );
    }
);

function renderInputDecorator(decorator?: string | ReactNode) {
    if (!decorator) return null;
    if (typeof decorator === 'string') {
        return <Icon icon={decorator} size={20} className="text-muted-foreground" />;
    }
    return decorator;
}

export const InputWithIcons = forwardRef<TextInput, InputWithIconsProps>(
    ({ className, startDecorator, endDecorator, style, rounded = InputRounded.full, ...props }, ref) => (
        <Row className="relative w-full items-center">
            {startDecorator ? (
                <View className={`absolute ${decoratorInset(props.size).start} h-full items-center justify-center`} pointerEvents="none">
                    {renderInputDecorator(startDecorator)}
                </View>
            ) : null}
            <Input
                ref={ref}
                className={`w-full ${className || ''} ${typeof startDecorator === 'string' ? 'pl-12' : startDecorator ? 'pl-10' : ''} ${endDecorator ? 'pr-11' : ''}`}
                style={style}
                rounded={rounded}
                {...props}
            />
            {endDecorator ? (
                <View className={`absolute ${decoratorInset(props.size).end} h-full items-center justify-center`} pointerEvents="none">
                    {renderInputDecorator(endDecorator)}
                </View>
            ) : null}
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
    /** Mapped to the native Picker's `enabled`. */
    disabled?: boolean;
}

const getPickerSurfaceClass = (size?: keyof typeof InputSize) => {
    const sizeClass = inputSettings.size[size ?? DEFAULT_SIZE] ?? inputSettings.size.regular;
    // Radius comes from size.* (small/regular/large); no separate rounded.default.
    return cn(inputSettings.select, sizeClass);
};
const Picker = PickerDef as any;

const getPickerStyleProps = (style: any) =>
    (isIos || style)
        ? { style: [isIos && iosContinuousCurveStyle, style].filter(Boolean) }
        : {};

export const PickerStyled = ({ className, style, size = DEFAULT_SIZE, ...props }: CustomPickerProps) => (
    <Picker
        className={`${getPickerSurfaceClass(size)} ${className || ''}`}
        {...getPickerStyleProps(style)}
        {...props}
    />
);
PickerStyled.displayName = 'PickerStyled';

export const PickerStyledRef = forwardRef<any, PickerStyledRefProps>(
    ({ classes, className, style, size = DEFAULT_SIZE, disabled, ...props }, ref) => (
        <View className={`relative ${isWeb ? 'flex-auto items-center flex-row' : ''}`}>
            <Picker
                ref={ref}
                className={`${classes ? classes : getPickerSurfaceClass(size)} ${className || ''} w-full`}
                {...getPickerStyleProps(style)}
                {...props}
                {...(disabled !== undefined ? { enabled: !disabled } : {})}
            />
            {isWeb && (
                <View className={`absolute ${decoratorInset(size).end} pointer-events-none`}>
                    <Icon icon="ChevronDown" size={20} className="text-muted-foreground" />
                </View>
            )}
        </View>
    )
);


export const PickerStyledIos = PickerStyled;
