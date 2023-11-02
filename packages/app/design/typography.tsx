import { ComponentProps, forwardRef } from 'react'
import { Text as NativeText, Platform, Linking, TextStyle } from 'react-native'
import { styled, StyledProps } from 'nativewind'
import { TextLink as SolitoTextLink, Link as SolitoLink } from 'solito/link'

const Text_ = styled(NativeText)

export const Text = ({ children, ...rest }) => {
  const correctedChildren = typeof children === 'string' ?  children.replace(/&amp;/g, '&') : children;
  return <Text_ {...rest}>{correctedChildren}</Text_>;
};

/**
 * You can use this pattern to create components with default styles
 */
export const P = styled(NativeText, 'text-base text-black my-4')

/**
 * Components can have defaultProps and styles
 */
const H1_ = styled(NativeText, 'text-2xl lg:text-3xl font-bold my-4')
H1_.defaultProps = {
}
export const H1 = ({ children, ...rest }) => {
  const correctedChildren = typeof children === 'string' ?  children.replace(/&amp;/g, '&') : children;
  return <H1_ {...rest}>{correctedChildren}</H1_>;
};

const H1C_ = styled(NativeText, ' text-2xl lg:text-3xl font-bold ')
H1C_.defaultProps = {
}

export const H1C = ({ children, ...rest }) => {
  const correctedChildren = typeof children === 'string' ?  children.replace(/&amp;/g, '&') : children;
  return <H1C_ {...rest}>{correctedChildren}</H1C_>;
};

export const H2_ = styled(NativeText, 'text-xl font-extrabold mb-4')
H1_.defaultProps = {
}

export const H2 = ({ children, ...rest }) => {
  const correctedChildren = typeof children === 'string' ?  children.replace(/&amp;/g, '&') : children;
  return <H2_ {...rest}>{correctedChildren}</H2_>;
};


/**
 * This is a more advanced component with custom styles and per-platform functionality
 */
export interface AProps extends ComponentProps<typeof Text> {
  href?: string
  target?: '_blank'
}

export const A = forwardRef<NativeText, StyledProps<AProps>>(function A(
  { className = '', href, target, ...props },
  ref
) {
  const nativeAProps = Platform.select<Partial<AProps>>({
    web: {
      href,
      target,
      hrefAttrs: {
        rel: 'noreferrer',
        target,
      },
    },
    default: {
      onPress: (event) => {
        props.onPress && props.onPress(event)
        if (Platform.OS !== 'web' && href !== undefined) {
          Linking.openURL(href)
        }
      },
    },
  })

  return (
    <Text
      role="link"
      className={className || `text-blue-500 hover:underline`}
      {...props}
      {...nativeAProps}
      ref={ref}
    />
  )
})

/**
 * Solito's TextLink doesn't work directly with styled() since it has a textProps prop
 * By wrapping it in a function, we can forward style down properly.
 */
export const TextLink = styled<
  ComponentProps<typeof SolitoTextLink> & { style?: TextStyle }
>(function TextLink({ style, textProps, ...props }) {
  return (
    <SolitoTextLink
      textProps={{ ...textProps, style: [style, textProps?.style] }}
      {...props}
    />
  )
}, 'text-base font-bold hover:underline text-blue-500')

export const Link = styled<
  ComponentProps<typeof SolitoLink> & { style?: TextStyle }
>(function TextLink({ style, ...props }) {
  return (
    <SolitoLink
      {...props}
    />
  )
})
