import { TextInput as TextInputDef} from 'react-native'
import { TouchableOpacity, Pressable, View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { styled } from 'nativewind'
import { Icon } from 'app/components/svg'

/* inputs */
export const Input = styled(TextInputDef, 'bg-neo-100/50 border border-bordercolor/20 text-neo-800 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neo-900/50 dark:border-bordercolor-dark/20 dark:placeholder-neo-400 dark:text-neo-200 dark:focus:ring-blue-500 dark:focus:border-blue-500 text-base')
export const Hidden = styled(TextInputDef, 'hidden')

/* buttons */
export function Button(props) {
    let { className, ...rest } = props
    let buttonType = props.type ? props.type : 'default';
    let buttonSize = props.size ? props.size : 'base';
    let buttonDisabled = props.disabled ? true : false;
    let buttonIcon = props.icon ? props.icon : '';
    
    let buttonFull = props.full ? true : false;

    let sClassContainer = " text-center relative rounded flex-row items-center justify-center"; 
    let sIconContainer = " h-6 w-6 mr-2";

    if (!buttonFull)
        sClassContainer += ' w-fit m-0';

    if (buttonDisabled)
        sClassContainer += ' bg-neo-100 '; 

    let sClassText = "  text-center "; 
    switch (buttonType) {
        case 'default':
            sClassContainer += " bg-neo-700 hover:bg-neo-600";
            sClassText += " text-white";
            break;
        case 'primary':
            sClassContainer += " bg-blue-700 hover:bg-blue-600";
            sClassText += " text-white";
            break;
        case 'danger':
            sClassContainer += " bg-red-700 hover:bg-red-600";
            sClassText += " text-white";
            break;
        case 'text':
            sClassContainer += "";
            sClassText += " text-white";
            break;
        case 'link':
            sClassContainer += "";
            sClassText += " text-blue-700";
            break;
        case 'outline':
            sClassContainer += " bg-green-700";
            sClassText += " text-white";
            break;
    }

    switch (buttonSize) {
        case 'base':
            sClassContainer += " px-3 py-1 ";
            sClassText += " text-base";
            break;
        case 'sm':
            sClassContainer += " px-1 py-1";
            sIconContainer = " h-4 w-4 mr-1";
            sClassText += " text-sm";
            break;
        case 'lg':
            sClassContainer += " px-5 py-1";
            sIconContainer = " h-8 w-8 mr-3";
            sClassText += " text-lg";
            break;
    }

    return (
        <Pressable className={sClassContainer} {...rest}>
            {buttonIcon != '' && <Icon className={sClassText+sIconContainer} icon={buttonIcon}></Icon>}
            <Text className={sClassText}>
                {props.title}
            </Text>
        </Pressable>
    )
}

