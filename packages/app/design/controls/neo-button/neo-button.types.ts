// Public props of NeoButton, shared by neo-button.tsx and the Expo UI renderers
// (neo-button-expoui.{ios,android}.tsx + the web / fallback stubs).
import type { ComponentType, ReactElement, ReactNode, Ref } from 'react'

export type NeoButtonStyle =
    | 'plain'
    | 'bordered'
    | 'borderedProminent'
    | 'borderless'
    | 'link'
    | 'glass'
    | 'glassProminent'

export type NeoControlSize = 'mini' | 'small' | 'regular' | 'large' | 'xlarge'

export type NeoBorderShape = 'capsule' | 'rectangle' | 'roundedRectangle' | 'circle'

/** Counter / badge on the button: plain text, or an object with options. */
export type NeoButtonAddon =
    | string
    | number
    | false
    | null
    | undefined
    | {
          text?: string | number | null | false
          variant?: string
          hideZero?: boolean
          position?: 'bottom' | string
      }

export type NeoButtonClassNames = {
    root?: string
    container?: string
    surface?: string
    ring?: string
    text?: string
    image?: string
}

export type NeoButtonInsets = {
    left?: number
    right?: number
    start?: number
    end?: number
    x?: number
}

export type NeoButtonProps = {
    // SwiftUI core (`buttonStyle` avoids RN `Link` clobbering `style` on native)
    role?: string
    /** Button style name; non-strings (RN layout `style` from `asChild`) are ignored. */
    style?: NeoButtonStyle | string | object
    /** Same as `style`; NeoButtonLink passes its `style` through here as is. */
    buttonStyle?: NeoButtonStyle | string | object
    controlSize?: NeoControlSize | string
    borderShape?: NeoBorderShape | string
    tint?: string | null

    // Content
    label?: ReactNode
    loadingLabel?: ReactNode
    title?: ReactNode
    /** Icon name, emoji, or a ready element. */
    image?: string | ReactElement | null | false
    systemImage?: string
    imagePlacement?: 'leading' | 'trailing' | string

    // Behaviour
    disabled?: boolean
    loading?: boolean
    selected?: boolean
    selectedState?: string
    addon?: NeoButtonAddon
    interactive?: boolean
    /** `FeedbackHaptics` type; `false` / `''` opts out. */
    haptics?: string | false
    onPress?: (event?: any) => void
    onPressIn?: (event?: any) => void
    onPressOut?: (event?: any) => void
    onLongPress?: (event?: any) => void

    // Layout
    width?: 'auto' | 'fill' | string
    align?: 'start' | 'center' | 'end' | 'between' | string
    /** Inset object, or a key into the size's `contentInsets` map. */
    contentInsets?: NeoButtonInsets | string
    showTitleFromSize?: string

    // Accessibility / web
    accessibilityLabel?: string
    alt?: string
    tooltip?: ReactNode
    tooltipSide?: 'top' | 'bottom'
    hitarea?: boolean
    hitSlop?: number | { top?: number; right?: number; bottom?: number; left?: number }
    focusRing?: string

    // Animation override
    transition?: any
    pressAnimation?: boolean
    glassEffect?: string

    // Style escape hatches
    className?: string
    textClassName?: string
    classNames?: NeoButtonClassNames

    /** Custom HStack-equivalent label content. */
    children?: ReactNode

    forwardedRef?: Ref<any>

    // Link-related: forwarded by NeoButtonLink, ignored by the button itself.
    href?: string
    target?: string
    asExternal?: boolean
    emulate?: any
    variant?: string
    size?: string
    mode?: string
    noprefetch?: boolean

    /** Anything else (e.g. data-* attrs) is forwarded to the surface. */
    [key: string]: unknown
}

/** `appSetting('theme', 'expo_ui', 'button')` — the Expo UI button config. */
export type NeoButtonExpoUIConfig = Record<string, any>

export type NeoButtonExpoUIProps = NeoButtonProps & {
    nativeConfig: NeoButtonExpoUIConfig
}

/** Expo UI renderer, or `null` where the platform has none (web, fallback). */
export type NeoButtonExpoUIComponent = ComponentType<NeoButtonExpoUIProps> | null

/** Native icon for a NeoButton image (SF Symbol name / Compose image source), or `null` when it has no mapping. */
export type GetNativeIcon = (rawImage: unknown, config?: NeoButtonExpoUIConfig) => unknown
