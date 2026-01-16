import { forwardRef } from 'react';
import { TextInput as TextInputDef, Modal as ModalDef, Platform } from 'react-native'
import { View, Row } from 'app/design/view'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting } from 'app/lib/util'
import { Picker as PickerDef } from '@react-native-picker/picker';

const inputSettings = appSetting('theme', 'inputs');
const isWeb = Platform.OS === 'web';

export const TextInputClear = TextInputDef

export const Input = ({ className, startDecorator, endDecorator, style, ...props }) => (
    <Row className={`items-center flex-auto`}>
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef 
            className={`${className} ${inputSettings.default} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`} 
            style={[Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {}, style]}
            {...props} 
        />
        {endDecorator && (
            <View className="absolute right-3 h-full items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
);

export const InputRef = forwardRef(({ className, startDecorator, endDecorator, style, ...props }, ref) => (
    <Row className={`items-center flex-auto`}>
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef 
            className={`${className} ${inputSettings.default} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`} 
            style={[Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {}, style]}
            ref={ref} 
            {...props} 
        />
        {endDecorator && (
            <View className="absolute right-3 items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
));

export const InputMulti = forwardRef(({ className, startDecorator, endDecorator, onHeight, style, ...props }, ref) => (
     <Row className={`items-center flex-auto`}>
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef
            className={`${className} ${inputSettings.multi} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`}
            style={[Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {}, style]}
            ref={ref}
            {...props}
            onContentSizeChange={(e) => {
                // Call the original onContentSizeChange if provided
                if (props.onContentSizeChange) {
                    props.onContentSizeChange(e);
                }
                // Also call onHeight callback if provided (for messenger auto-grow)
                if (onHeight && e.nativeEvent?.contentSize?.height) {
                    onHeight(e.nativeEvent.contentSize.height);
                }
            }}
        />
        {endDecorator && (
            <View className="absolute right-3 items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
));

export const InputRounded = ({ className, startDecorator, endDecorator, style, ...props }) => (
    <Row className={`items-center flex-auto`}>
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef 
            className={`${className} ${inputSettings.default} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`} 
            style={[Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {}, style]}
            {...props} 
        />
        {endDecorator && (
            <View className="absolute right-3 h-full items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
);

export const InputRoundedRef = forwardRef(({ className, startDecorator, endDecorator, style, ...props }, ref) => (
    <Row className={`items-center flex-auto`}>
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef 
            className={`${className} ${inputSettings.rounded} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`} 
            style={[Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {}, style]}
            ref={ref} 
            {...props} 
        />
        {endDecorator && (
            <View className="absolute right-2.5 h-full items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
));

export const InputRoundedSmall = ({ className, startDecorator, endDecorator, style, ...props }) => (
    <Row className={`items-center flex-auto`}>
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef 
            className={`${className} ${inputSettings.roundedsmall} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`} 
            style={[Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {}, style]}
            {...props} 
        />
        {endDecorator && (
            <View className="absolute right-2.5 h-full items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
);

export const InputSmall = ({ className, startDecorator, endDecorator, style, ...props }) => (
    <Row className={`items-center`}>
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef 
            className={`${className} ${inputSettings.small} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`} 
            style={[Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {}, style]}
            {...props} 
        />
        {endDecorator && (
            <View className="absolute right-3 h-full items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
);

export const Hidden = ({ className, ...props }) => (
    <TextInputDef className={'hidden'} {...props} />
);

const PickerStyles = inputSettings.select;

export const PickerStyled = ({ className, ...props }) => (
    <PickerDef className={PickerStyles} {...props} />
);

export const PickerStyledRef = forwardRef(({ classes, className, ...props }, ref) => (
    <View className={` ${isWeb ? 'flex-auto items-center flex-row' : ''} `}>
        <PickerDef ref={ref} className={`${classes ? classes : PickerStyles} w-full`} {...props} />
        {isWeb && <View className="absolute right-3 pointer-events-none">
            <Icon icon="ChevronDown" size={20} className="text-neutral-500" />
        </View>}
    </View>
));

export const PickerStyledIos = ({ className, ...props }) => (
    <PickerDef className={PickerStyles} {...props} />
);
