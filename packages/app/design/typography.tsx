import { Text as NativeText, Platform } from 'react-native'
import { styled } from 'nativewind'
import { appSetting, decodeText } from 'app/lib/util'

const Text_ = styled(NativeText)

export const Text = ({ children, className, fontFamily, style: propStyle, ...rest }) => {

    const isWeb = Platform.OS == 'web'
    const correctedChildren = typeof children === 'string' ? decodeText(children) : children;
    
    const isUseCustomFont = appSetting('layout', 'use_custom_font');
    const finalClassName = `${className} ${isUseCustomFont ? fontFamily || isUseCustomFont : ''}`;
    
    const fontStyle = !isWeb && isUseCustomFont ? { fontFamily: fontFamily || isUseCustomFont } : {};
    const combinedStyle = [fontStyle, propStyle];
    return <Text_ {...rest} className={finalClassName} allowFontScaling={false} style={combinedStyle}>{correctedChildren}</Text_>;
};

/**
 * Components can have defaultProps and styles
 */
const H1_ = styled(NativeText, 'text-2xl lg:text-3xl font-bold my-4')

export const H1 = ({ children, ...rest }) => {
    const correctedChildren = typeof children === 'string' ? decodeText(children) : children;
    return <H1_ {...rest} allowFontScaling={false}>{correctedChildren}</H1_>;
};

const H1C_ = styled(NativeText, ' text-2xl lg:text-3xl font-bold ')


export const H1C = ({ children, ...rest }) => {
    const correctedChildren = typeof children === 'string' ? decodeText(children) : children;
    return <H1C_ {...rest} allowFontScaling={false}>{correctedChildren}</H1C_>;
};

export const H2_ = styled(NativeText, 'text-xl font-extrabold mt-2 mb-3')


export const H2 = ({ children, ...rest }) => {
    const correctedChildren = typeof children === 'string' ? decodeText(children) : children;
    return <H2_ {...rest} allowFontScaling={false}>{correctedChildren}</H2_>;
};
