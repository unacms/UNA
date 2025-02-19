import { Text as NativeText, Platform } from 'react-native'

import { appSetting, decodeText, normalizeClasses } from 'app/lib/util'

const Text_ = NativeText

export const Text = ({ children, className, fontFamily, style: propStyle, ...rest }) => {

    const isWeb = Platform.OS == 'web'
    const correctedChildren = typeof children === 'string' ? decodeText(children) : children;
    
    const isUseCustomFont = appSetting('native', 'use_custom_font');
    let finalClassName = normalizeClasses(`${className} ${isUseCustomFont ? fontFamily || isUseCustomFont : ''}`);
    const fontStyle = !isWeb && isUseCustomFont ? { fontFamily: fontFamily || isUseCustomFont } : {};
    const combinedStyle = [fontStyle, propStyle];
    return <Text_  {...rest} className={finalClassName} allowFontScaling={false} style={combinedStyle}>{correctedChildren}</Text_>;
};

/**
 * Components can have defaultProps and styles
 */
export const H1 = ({ children, className, ...rest }) => {
    const correctedChildren =
      typeof children === 'string' ? decodeText(children) : children;
    return (
      <NativeText
        className={`text-2xl lg:text-3xl font-bold my-4 ${className || ''}`}
        {...rest}
        allowFontScaling={false}
      >
        {correctedChildren}
      </NativeText>
    );
  };
  
  export const H1C = ({ children, className, ...rest }) => {
    const correctedChildren =
      typeof children === 'string' ? decodeText(children) : children;
    return (
      <NativeText
        className={`text-2xl lg:text-3xl font-bold ${className || ''}`}
        {...rest}
        allowFontScaling={false}
      >
        {correctedChildren}
      </NativeText>
    );
  };
  
  export const H2 = ({ children, className, ...rest }) => {
    const correctedChildren =
      typeof children === 'string' ? decodeText(children) : children;
    return (
      <NativeText
        className={`text-xl font-extrabold mt-2 mb-3 ${className || ''}`}
        {...rest}
        allowFontScaling={false}
      >
        {correctedChildren}
      </NativeText>
    );
  };

  export const H3 = ({ children, className, ...rest }) => {
    const correctedChildren =
      typeof children === 'string' ? decodeText(children) : children;
    return (
      <NativeText
        className={`text-lg font-extrabold mt-2 mb-3 ${className || ''}`}
        {...rest}
        allowFontScaling={false}
      >
        {correctedChildren}
      </NativeText>
    );
  };