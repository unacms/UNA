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

    let sClassContainer = "  group  text-center relative  flex-row items-center justify-center "; 
    let sIconContainer = " h-6 w-6 mr-2";

    if (!buttonFull)
        sClassContainer += ' w-fit m-0';

    if (buttonDisabled)
        sClassContainer += ' opacity-50 '; 
        

    let sClassText = "  text-center "; 
    switch (buttonType) {
        case 'default':
            sClassContainer += " hover:-translate-y-0.5 active:translate-y-0.5  duration-200 active:shadow-none shadow-sm hover:shadow-lg border border-bordercolor/10 dark:border-bordercolor-dark/10  hover:border-bordercolor/20 dark:hover:border-bordercolor-dark/20 bg-neo-50 hover:bg-white dark:bg-neo-700 dark:hover:bg-neo-600 ";
            sClassText += "group-hover:text-neo-900  dark:group-hover:text-neo-50 font-semibold text-neo-700 dark:text-neo-200 ";
            break;
        case 'primary':
            sClassContainer += " hover:-translate-y-0.5 active:translate-y-0.5  duration-200 active:shadow-none shadow-sm hover:shadow-lg border border-bordercolor/10 dark:border-bordercolor-dark/10  hover:border-bordercolor/20 dark:hover:border-bordercolor-dark/20 font-semibold  bg-blue-600 hover:bg-blue-500 ";
            sClassText += " font-semibold text-neo-50  ";
            break;
        case 'danger':
            sClassContainer += " hover:-translate-y-0.5 active:translate-y-0.5  duration-200 active:shadow-none shadow-sm hover:shadow-lg border border-bordercolor/10 dark:border-bordercolor-dark/10  hover:border-bordercolor/20 dark:hover:border-bordercolor-dark/20 font-semibold  bg-red-600 hover:bg-red-500 ";
            sClassText += " font-semibold  text-neo-50  ";
            break;
        case 'text':
            sClassContainer += " hover:-translate-y-[1px] active:translate-y-[1px]  duration-200  hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50 ";
            sClassText += " group-hover:text-neo-900  dark:group-hover:text-neo-50 font-semibold text-neo-700 dark:text-neo-200 ";
            break;
        case 'link':
            sClassContainer += "  ";
            sClassText += " group-hover:text-blue-600  dark:group-hover:text-blue-500 font-semibold text-blue-500 dark:text-blue-400 ";
            break;
        case 'outline':
            sClassContainer += "   duration-200  border border-bordercolor/10 dark:border-bordercolor-dark/10  hover:border-bordercolor/20 dark:hover:border-bordercolor-dark/20    ";
            sClassText += " group-hover:text-neo-900  dark:group-hover:text-neo-50 font-semibold text-neo-700 dark:text-neo-200 ";
            break;
    }

    switch (buttonSize) {
        case 'text-sm':
            sClassContainer += " rounded-lg  px-1.5 py-1 ";
            sIconContainer = " h-5 w-5 mr-1.5 ";
            sClassText += " text-sm ";
            break;

        case 'xs':
            sClassContainer += " rounded-md px-1.5 py-1 ";
            sIconContainer = " h-4 w-4 mr-1 ";
            sClassText += " text-xs ";
            break;

        case 'sm':
            sClassContainer += " rounded-lg px-2.5 py-1.5 ";
            sIconContainer = " h-5 w-5 mr-1.5 ";
            sClassText += " text-sm ";
            break;

        case 'base':
            sClassContainer += " rounded-lg px-3.5 py-2.5 ";
            sIconContainer = " h-6 w-6 mr-2 ";
            sClassText += " text-base ";
            break;

        case 'lg':
            sClassContainer += " rounded-lg px-5 py-3 ";
            sIconContainer = " h-6 w-6 mr-3 ";
            sClassText += " text-lg ";
            break;
        
        case 'xl':
            sClassContainer += " rounded-xl px-7 py-4 ";
            sIconContainer = " h-8 w-8 mr-3 ";
            sClassText += " text-xl ";
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

