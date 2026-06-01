import { forwardRef } from 'react';
import { Platform } from 'react-native';
import { View, Row } from 'app/design/view'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting } from 'app/lib/util'

const inputSettings = appSetting('theme', 'inputs');
const isWeb = Platform.OS === 'web';

export const InputRounded = {
    full: 'full',
    default: 'default',
} as const;

export const InputSize = {
    small: 'small',
    default: 'default',
} as const;

type CustomInputProps = {
    className?: string;
    style?: any;
    rounded?: keyof typeof InputRounded;
    size?: keyof typeof InputSize;
    multiline?: boolean;
    editable?: boolean;
    secureTextEntry?: boolean;
    keyboardType?: string;
    value?: any;
    defaultValue?: any;
    placeholder?: string;
    children?: any;
    onChange?: (event: any) => void;
    onChangeText?: (value: string) => void;
    onSubmitEditing?: (event: any) => void;
    onContentSizeChange?: (event: any) => void;
    [key: string]: any;
}

type InputWithIconsProps = CustomInputProps & {
    startDecorator?: string;
    endDecorator?: string;
}

type InputMultiProps = CustomInputProps & {
    onHeight?: (height: number) => void;
}

type PickerProps = {
    className?: string;
    classes?: string;
    children?: any;
    selectedValue?: any;
    value?: any;
    onValueChange?: (value: any, index?: number) => void;
    onChange?: (event: any) => void;
    style?: any;
    [key: string]: any;
}

const sanitizeInputProps = ({
    className,
    rounded,
    size,
    multiline,
    editable,
    secureTextEntry,
    keyboardType,
    onChangeText,
    onSubmitEditing,
    onContentSizeChange,
    numberOfLines,
    returnKeyType,
    clearButtonMode,
    autoCapitalize,
    autoCorrect,
    placeholderTextColor,
    selectionColor,
    cursorColor,
    underlineColorAndroid,
    selectionHandleColor,
    textContentType,
    importantForAutofill,
    enablesReturnKeyAutomatically,
    blurOnSubmit,
    caretHidden,
    contextMenuHidden,
    rejectResponderTermination,
    ...props
}: CustomInputProps) => {
    const domProps = { ...props };
    if (editable === false) domProps.disabled = true;
    if (keyboardType === 'email-address') domProps.type = 'email';
    if (keyboardType === 'numeric' || keyboardType === 'number-pad') domProps.type = 'number';
    if (secureTextEntry) domProps.type = 'password';
    if (onChangeText) {
        domProps.onChange = (event: any) => {
            props.onChange?.(event);
            onChangeText(event.target.value);
        };
    }
    if (onSubmitEditing) {
        domProps.onKeyDown = (event: any) => {
            props.onKeyDown?.(event);
            if (event.key === 'Enter') onSubmitEditing(event);
        };
    }
    return domProps;
}

export const TextInputClear = forwardRef<any, CustomInputProps>(
    ({ className = '', style, multiline, ...props }, ref) => {
        const Component = multiline ? 'textarea' : 'input';
        return (
            <Component
                ref={ref}
                className={className}
                style={style}
                {...sanitizeInputProps({ multiline, ...props })}
            />
        );
    }
);
TextInputClear.displayName = 'TextInputClear';

export const Input = forwardRef<any, CustomInputProps>(
    ({ className = '', style, rounded = InputRounded.default, size = InputSize.default, multiline, ...props }, ref) => {
        const Component = multiline ? 'textarea' : 'input';
        return (
            <Component
                ref={ref}
                className={`${className} ${inputSettings.base} ${inputSettings.rounded[rounded]} ${inputSettings.size[size]}`}
                style={style}
                {...sanitizeInputProps({ multiline, ...props })}
            />
        );
    }
);
Input.displayName = 'Input';

export const InputWithIcons = forwardRef<any, InputWithIconsProps>(
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
InputWithIcons.displayName = 'InputWithIcons';

export const InputMulti = forwardRef<any, InputMultiProps>(
    ({ className, onHeight, style, onContentSizeChange, ...props }, ref) => (
        <Input
            ref={ref}
            className={className}
            style={style}
            multiline={true}
            {...props}
            onContentSizeChange={(e: any) => {
                onContentSizeChange?.(e);
                if (onHeight && e.nativeEvent?.contentSize?.height) {
                    onHeight(e.nativeEvent.contentSize.height);
                }
            }}
        />
    )
);
InputMulti.displayName = 'InputMulti';

export const Hidden = forwardRef<any, CustomInputProps>(
    ({ style, ...props }, ref) => (
        <input type="hidden" ref={ref} style={style} {...sanitizeInputProps(props)} />
    )
);
Hidden.displayName = 'Hidden';

/** Same surface tokens as `Input` (rounded + size) so selects match text fields and superellipse. */
const pickerSurfaceClass = `${inputSettings.select} ${inputSettings.rounded.default} ${inputSettings.size.default}`;

const optionFromChild = (child: any, index: number) => {
    if (!child) return null;
    const props = child.props || {};
    return (
        <option key={props.value ?? index} value={props.value}>
            {props.label ?? props.children}
        </option>
    );
}

export const PickerStyled = ({ className, children, selectedValue, value, onValueChange, onChange, ...props }: PickerProps) => (
    <select
        className={`${pickerSurfaceClass} ${className || ''}`}
        value={selectedValue ?? value}
        onChange={(event) => {
            onChange?.(event);
            onValueChange?.(event.target.value, event.target.selectedIndex);
        }}
        {...props}
    >
        {Array.isArray(children) ? children.map(optionFromChild) : optionFromChild(children, 0)}
    </select>
);
PickerStyled.displayName = 'PickerStyled';

export const PickerStyledRef = forwardRef<any, PickerProps>(
    ({ classes, className, children, selectedValue, value, onValueChange, onChange, ...props }, ref) => (
        <View className={` ${isWeb ? 'flex-auto items-center flex-row' : ''} `}>
            <select
                ref={ref}
                className={`${classes ? classes : pickerSurfaceClass} ${className || ''} w-full`}
                value={selectedValue ?? value}
                onChange={(event) => {
                    onChange?.(event);
                    onValueChange?.(event.target.value, event.target.selectedIndex);
                }}
                {...props}
            >
                {Array.isArray(children) ? children.map(optionFromChild) : optionFromChild(children, 0)}
            </select>
            <View className="absolute right-3 pointer-events-none">
                <Icon icon="ChevronDown" size={20} className="text-muted-foreground" />
            </View>
        </View>
    )
);
PickerStyledRef.displayName = 'PickerStyledRef';

export const PickerStyledIos = PickerStyled;
