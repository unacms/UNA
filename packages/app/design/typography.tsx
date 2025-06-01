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
        className={` text-4xl lg:text-5xl font-bold tracking-tight mb-[16px] lg:mb-[20px] text-neutral-950 dark:text-neutral-50 ${className || ''}`}
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
        className={`text-3xl lg:text-4xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 mb-[16px] ${className || ''}`}
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
        className={`text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 mb-[12px] mt-[16px] ${className || ''}`}
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
        className={`text-xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 mb-[8px] mt-[12px] ${className || ''}`}
        {...rest}
        allowFontScaling={false}
      >
        {correctedChildren}
      </NativeText>
    );
  };