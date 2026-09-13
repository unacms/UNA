import { forwardRef, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { View, Row } from 'app/design/view'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting, cn } from 'app/lib/util'

const inputSettings = appSetting('theme', 'inputs');
const isWeb = Platform.OS === 'web';

export const InputRounded = {
    full: 'full',
    default: 'default',
} as const;

export const InputSize = {
    small: 'small',
    regular: 'regular',
    large: 'large',
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
    startDecorator?: string | ReactNode;
    endDecorator?: string | ReactNode;
}

type InputMultiProps = CustomInputProps & {
    onHeight?: (height: number) => void;
}

type PickerProps = {
    className?: string;
    classes?: string;
    size?: keyof typeof InputSize;
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
    accessibilityLabel,
    accessibilityRole,
    accessibilityHint,
    nativeID,
    ...props
}: CustomInputProps) => {
    const domProps = { ...props };
    if (nativeID && !domProps.id) domProps.id = nativeID;
    if (accessibilityLabel && !domProps['aria-label']) domProps['aria-label'] = accessibilityLabel;
    if (accessibilityRole && !domProps.role) domProps.role = accessibilityRole;
    if (accessibilityHint && !domProps['aria-description']) domProps['aria-description'] = accessibilityHint;
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
    ({ className = '', style, rounded = InputRounded.default, size = InputSize.regular, multiline, ...props }, ref) => {
        const Component = multiline ? 'textarea' : 'input';
        return (
            <Component
                ref={ref}
                className={cn(
                    inputSettings.base,
                    inputSettings.size[size] ?? inputSettings.size.regular,
                    rounded === InputRounded.full && inputSettings.rounded.full,
                    className,
                )}
                style={style}
                {...sanitizeInputProps({ multiline, ...props })}
            />
        );
    }
);
Input.displayName = 'Input';

function renderInputDecorator(decorator?: string | ReactNode) {
    if (!decorator) return null;
    if (typeof decorator === 'string') {
        return <Icon icon={decorator} size={24} className="text-muted-foreground" />;
    }
    return decorator;
}

export const InputWithIcons = forwardRef<any, InputWithIconsProps>(
    ({ className, startDecorator, endDecorator, style, rounded = InputRounded.full, ...props }, ref) => (
        <Row className="relative w-full items-center">
            {startDecorator ? (
                <View className="absolute left-3.5 h-full items-center justify-center pointer-events-none">
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
                <View className="absolute right-3 h-full items-center justify-center pointer-events-none">
                    {renderInputDecorator(endDecorator)}
                </View>
            ) : null}
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

/** Same surface tokens as `Input` (size includes radius) so selects match text fields and superellipse. */
const getPickerSurfaceClass = (size?: keyof typeof InputSize) => {
    const sizeClass = inputSettings.size[size ?? InputSize.regular] ?? inputSettings.size.regular;
    return cn(inputSettings.select, sizeClass);
};

const optionFromChild = (child: any, index: number) => {
    if (!child) return null;
    const props = child.props || {};
    return (
        <option key={props.value ?? index} value={props.value}>
            {props.label ?? props.children}
        </option>
    );
}

export const PickerStyled = ({ className, children, selectedValue, value, onValueChange, onChange, size = InputSize.regular, ...props }: PickerProps) => (
    <select
        className={`${getPickerSurfaceClass(size)} ${className || ''}`}
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
    ({ classes, className, children, selectedValue, value, onValueChange, onChange, size = InputSize.regular, ...props }, ref) => (
        <View className={`relative ${isWeb ? 'flex-auto items-center flex-row' : ''}`}>
            <select
                ref={ref}
                className={`${classes ? classes : getPickerSurfaceClass(size)} ${className || ''} w-full`}
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
