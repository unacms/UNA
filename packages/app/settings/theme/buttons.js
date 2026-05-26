

export const settingsButtons = {
    button_sizes: {
        default_size: 'base',
        default_variant: 'default', 
        xs: {
            rounded: 'rounded-md',
            container: 'px-2 gap-1 h-7 min-w-7',
            container_icon_only: 'h-7 w-7 items-center justify-center',
            text: 'text-xs leading-7',
            icon_size: 16,
            hitSlop: 8,
        },
        sm: {
            rounded: 'rounded-lg ',
            container: 'px-2.5 gap-1 h-9 min-w-9 ',
            container_icon_only: 'h-9 w-9',
            text: 'text-sm leading-5',
            icon_size: 20,
            hitSlop: 6,
        },
        base: {
            rounded: 'rounded-xl',
            container: 'px-3 gap-2 min-h-11 min-w-11',
            container_icon_only: 'min-h-11 min-w-11',
            title_container: ' leading-11 text-base',
            icon_size: 24,
            hitSlop: 2,
        },
        lg: {
            rounded: 'rounded-xl',
            container: 'px-4 gap-2 min-h-12 min-w-12',
            container_icon_only: 'min-h-12 min-w-12',
            title_container: ' leading-12 text-base',
            icon_size: 24,
            hitSlop: 14,
        },
    },
    button_styles: {
        motion:{
            springTransition: { type: 'spring', damping: 24, stiffness: 360 },
            highlightBackgroundlight: 'rgba(255,255,255,0.5)',
            highlightBackgrounddark: 'rgba(0,0,0,0.5)',
            scale: 0.95,
        },
        group:{
            container: ' border items-center border-border overflow-hidden ',
            separator: ' bg-border/60 w-px h-full',
        },
        primary:{
            container:{
                base:'backdrop-blur',
                default:' bg-primary  ',
                active:' bg-primary-hover ',
                pressed:' bg-primary  ',
                hovered:' bg-primary-hover ',
                focused:' bg-primary ',
                disabled:' bg-primary/50 ',

            },
            text:{
                base:'font-semibold',
                default:'text-primary-foreground',
                hovered:'text-primary-foreground',
                focused:'text-primary-foreground',
                active:'text-primary-foreground',
                pressed:'text-primary-foreground',
                disabled:'text-primary-foreground/50',
            }
        },
        default:{
            container:{
                base:'backdrop-blur  ',
                default:' bg-popover/60 shadow-btn-outline dark:shadow-btn-outline-deep  ',
                active:' bg-emerald-500 shadow-btn-outline dark:shadow-btn-outline-deep ',
                pressed:'bg-red-500 ',
                hovered:' bg-popover shadow-btn-outline dark:shadow-btn-outline-deep ',
                focused:' bg-popover/80 shadow-btn-outline dark:shadow-btn-outline-deep ',
                disabled:' bg-popover/60 dark:bg-border/60 shadow-btn-outline dark:shadow-btn-outline-deep opacity-50 ',

            },
            text:{
                base:'font-semibold',
                default:'text-foreground',
                hovered:'text-foreground',
                focused:'text-foreground',
                active:'text-foreground',
                pressed:'text-foreground',
                disabled:'text-card-foreground/50',
            }
        },
        accent:{
            container:{
                base:' ',
                default:'bg-accent/60 ',
                active:'web:ring-2 web:ring-accent web:ring-offset-2 web:outline-none',
                pressed:'bg-accent/60',
                hovered:'bg-accent/90',
                focused:'',
                disabled:'',

            },
            text:{
                base:'font-semibold ',
                default:'font-medium text-accent-foreground',
                hovered:'font-medium text-accent-foreground',
                focused:'font-medium text-accent-foreground',
                active:'font-medium text-accent-foreground',
                pressed:'font-medium text-accent-foreground',
                disabled:'font-medium text-accent-foreground/50',
            }
        },
        secondary:{
            container:{
                base:'',
                default:'bg-secondary/80 web:backdrop-blur ',
                active:'bg-border ',
                pressed:' bg-accent ',
                hovered:' bg-secondary',
                focused:' bg-secondary',
                disabled:'',

            },
            text:{
                base:'font-semibold',
                default:'text-secondary-foreground',
                hovered:'text-foreground',
                focused:'text-foreground',
                active:'text-foreground',
                pressed:'text-accent-foreground',
                disabled:'text-secondary-foreground/50',
            },
        },
        danger:{
            container:{
                base:'bg-destructive',
                default:'',
                active:'bg-red-600/90 ',
                pressed:'bg-red-600/90 ',
                hovered:'bg-red-500 shadow',
                focused:'',
                disabled:'',

            },
            text:{
                base:'font-semibold ',
                default:'text-destructive-foreground',
                hovered:'',
                focused:'',
                active:'',
                pressed:'',
                disabled:'',
            }
        },
        text:{
            container:{
                base:'',
                default:'',
                active:' bg-muted ',
                pressed:' bg-accent/60 ',
                hovered:' bg-muted/60 ',
                focused:' bg-muted/60 ',
                disabled:'opacity-50',

            },
            text:{
                base:'font-semibold ',
                default:'text-secondary-foreground',
                hovered:'text-foreground',
                focused:'text-foreground',
                active:'text-foreground',
                pressed:'text-accent-foreground',
                disabled:'text-secondary-foreground',
            }
        },
        ghost:{
            container:{
                base:'',
                default:'',
                active:' ',
                pressed:'',
                hovered:'',
                focused:'',
                disabled:'',

            },
            text:{
                base:'font-semibold',
                default:' text-secondary-foreground',
                hovered:'text-foreground',
                focused:'text-foreground',
                active:'text-foreground',
                pressed:'text-foreground',
                disabled:'text-muted-foreground',
            }
        },
        link:{
            container:{
                base:'',
                default:'',
                active:' ',
                pressed:'',
                hovered:'',
                focused:'',
                disabled:'',

            },
            text:{
                base:'font-semibold',
                default:'text-secondary-foreground',
                hovered:'text-foreground underline',
                focused:'text-accent-foreground',
                active:'text-accent-foreground',
                pressed:'text-accent-foreground',
                disabled:'text-accent-foreground/50',
            }
        },
        
        outline:{
            container:{
                base:'border ',
                default:'border-border/60',
                active:'bg-muted/60 ',
                pressed:'bg-muted/60',
                hovered:'bg-muted/60',
                focused:'bg-muted/60',
                disabled:'opacity-50',

            },
            text:{
                base:'font-semibold ',
                default:'text-secondary-foreground',
                hovered:'text-foreground',
                focused:'text-foreground',
                active:'text-foreground',
                pressed:'text-foreground',
                disabled:'text-secondary-foreground/50',
            }
        }
    },
     /*
     * NeoButton theme — single tree, SwiftUI-aligned API.
     *
     * Mirrors SwiftUI's Button axes:
     *   role          → Button(role:)        (default | cancel | close | confirm | destructive)
     *   style         → .buttonStyle()       (plain | bordered | borderedProminent
     *                                          | borderless | link | glass | glassProminent)
     *   controlSize   → .controlSize()       (mini | small | regular | large | xlarge)
     *   borderShape   → .buttonBorderShape() (capsule | rectangle | roundedRectangle | circle)
     *   tint          → .tint()              (CSS color)
     *
     * Any leaf can be a scope-keyed object resolved at runtime by
     * `useResolvedNeoButton`. Supported scope keys (most-specific wins):
     *   default · light/dark · web/ios/android/native · touch/mouse · sm/md/lg/xl/2xl
     * plus controlSize keys (mini/small/regular/large/xlarge) inside per-size slots
     * such as `borderShapes.roundedRectangle`.
     *
     * The legacy `neo_button_sizes` / `neo_button_styles` keys are gone — the
     * only consumer was `NeoButton` itself, which now reads `neo_button`.
     */
    neo_button: {
        defaults: {
            // Used when no `style` prop, no `<NeoButtonStyleProvider>` parent,
            // and no role.defaultStyle apply. See `resolveStyle()` in the
            // resolver for the full precedence chain.
            style: 'bordered',
            controlSize: 'regular',
            borderShape: 'roundedRectangle',
            role: 'default',
            imagePlacement: 'leading',
            align: 'center',
            width: 'auto',
            focusRing: { default: 'never', web: 'auto' },
            pressAnimation: true,
            // Behavioral flags. The resolver gates event handlers on these so
            // web-only hover code does not run on native, etc.
            behaviors: {
                hover:          { default: false, mouse: true },
                focusRing:      { default: false, web: true },
                pressAnimation: { default: true },
                longPress:      { default: true },
            },
        },

        // controlSize → height / paddingX / font / icon / hitSlop / labelGap.
        // iOS HIG-style minimum is 44pt; web/mouse trims a few pixels because
        // pointers don't need finger-sized targets.
        controlSizes: {
            mini:    { height: 28, paddingX: 8,  font: 'text-xs', icon: 16, hitSlop: 10, labelGap: 4, contentInsets: { mediaLeading: { left: 2 } } },
            small:   { height: 36, paddingX: 12, font: 'text-sm', icon: 20, hitSlop: 6, labelGap: 6, contentInsets: { mediaLeading: { left: 6 } } },
            regular: {
                default: { height: 44, paddingX: 16, font: 'text-base', icon: 24, hitSlop: 4, labelGap: 8, contentInsets: { mediaLeading: { left: 4 } } },
                web:     { height: 44, paddingX: 16 },
                mouse:   { height: 44, paddingX: 16 },
            },
            large: {
                default: { height: 52, paddingX: 20, font: 'text-lg', icon: 28, hitSlop: 0, labelGap: 10, contentInsets: { mediaLeading: { left: 6 } } },
                web:     { height: 52 },
            },
            xlarge:  { height: 60, paddingX: 24, font: 'text-lg',   icon: 32, hitSlop: 0, labelGap: 12, contentInsets: { mediaLeading: { left: 8 } } },
        },

        // borderShape → rounding strategy. roundedRectangle scales with
        // controlSize; the others are fixed.
        borderShapes: {
            capsule:   { rounded: 'rounded-full' },
            rectangle: { rounded: 'rounded-none' },
            roundedRectangle: {
                rounded: {
                    default: 'rounded-xl',
                    mini:    'rounded-md',
                    small:   'rounded-lg',
                    large:   'rounded-xl',
                    xlarge:  'rounded-xl',
                },
            },
            circle:    { rounded: 'rounded-full', aspectSquare: true },
        },

        // SwiftUI roles. `defaultStyle` is used when no `style` prop is
        // passed and no parent provider sets one (e.g. `role="confirm"` →
        // borderedProminent). `defaultImage` is used when no `image` is
        // passed (e.g. role="close" → 'X').
        roles: {
            default:     {},
            cancel:      { textClass: 'text-secondary-foreground' },
            close:       { textClass: 'text-secondary-foreground', defaultImage: 'X' },
            confirm:     { defaultStyle: 'borderedProminent' },
            destructive: {
                tint: 'rgb(var(--destructive))',
                textClass: { default: 'text-destructive', borderedProminent: 'text-destructive-foreground' },
            },
        },

        // Per-style visual recipes. Same slot/state shape as before
        // (container/text + base/default/hovered/focused/pressed/active/
        // pressedToggle/disabled), now scoped under `styles[name]`.
        styles: {
            plain: {
                container: {
                    default: '',
                    hovered: '',
                    focused: '',
                    pressed: '',
                    active: '',
                    pressedToggle: '',
                    disabled: '',
                },
                text: {
                    base: 'font-medium',
                    default: 'text-foreground',
                    hovered: 'text-foreground',
                    focused: 'text-foreground',
                    pressed: 'text-foreground',
                    active: 'text-foreground',
                    pressedToggle: 'text-foreground',
                    disabled: 'text-muted-foreground',
                },
            },

            // SwiftUI .bordered — neutral fill, no shadow.
            // Definition is just the background colour — keeps the surface
            // perfectly flat (the inset/border-via-shadow stack is reserved
            // for the glass family).
            bordered: {
                container: {
                    default: 'bg-secondary/60',
                    hovered: 'bg-secondary',
                    focused: 'bg-secondary',
                    pressed: 'bg-secondary',
                    active: 'bg-secondary',
                    pressedToggle: 'bg-secondary',
                    disabled: 'bg-secondary opacity-60',
                },
                text: {
                    base: 'font-semibold tracking-tight',
                    default: 'text-foreground',
                    hovered: 'text-foreground',
                    focused: 'text-foreground',
                    pressed: 'text-foreground',
                    active: 'text-foreground',
                    pressedToggle: 'text-foreground',
                    disabled: 'text-muted-foreground',
                },
            },

            // SwiftUI .borderedProminent — primary action, flat fill.
            // No shadow — the only signal is the primary background colour
            // and the press background swap.
            borderedProminent: {
                container: {
                    default: 'bg-primary',
                    hovered: 'bg-primary-hover',
                    focused: 'bg-primary',
                    pressed: 'bg-primary',
                    active: 'bg-primary-hover',
                    pressedToggle: 'bg-primary-hover',
                    disabled: 'bg-primary opacity-60',
                },
                text: {
                    base: 'font-semibold tracking-tight',
                    default: 'text-primary-foreground',
                    hovered: 'text-primary-foreground',
                    focused: 'text-primary-foreground',
                    pressed: 'text-primary-foreground',
                    active: 'text-primary-foreground',
                    pressedToggle: 'text-primary-foreground',
                    disabled: 'text-primary-foreground/60',
                },
            },

            // SwiftUI .borderless — text-like with hover wash on web.
            borderless: {
                container: {
                    default: '',
                    hovered: 'bg-muted/60',
                    focused: 'bg-muted/60',
                    pressed: 'bg-muted',
                    active: 'bg-muted/80',
                    pressedToggle: 'bg-muted',
                    disabled: 'opacity-50',
                },
                text: {
                    base: 'font-semibold tracking-tight',
                    default: 'text-secondary-foreground',
                    hovered: 'text-foreground',
                    focused: 'text-foreground',
                    pressed: 'text-foreground',
                    active: 'text-foreground',
                    pressedToggle: 'text-foreground',
                    disabled: 'text-muted-foreground',
                },
            },

            // SwiftUI has no link style; we provide one that matches a web
            // text link (no fill, hover-underline on web).
            link: {
                container: { default: '', disabled: 'opacity-50' },
                text: {
                    base: 'font-semibold tracking-tight',
                    default: 'text-primary',
                    hovered: 'text-primary web:underline',
                    focused: 'text-primary web:underline',
                    pressed: 'text-primary/80',
                    active: 'text-primary/80',
                    pressedToggle: 'text-primary web:underline',
                    disabled: 'text-primary/50',
                },
            },

            // SwiftUI .glass (iOS 26+). Web fallback uses backdrop-blur.
            // shadow-btn-glass carries border + inner highlight + wide soft
            // ambient drop. shadow-btn-glass-pressed shrinks the drop.
            glass: {
                container: {
                    base: 'web:backdrop-blur-md shadow-btn-glass dark:shadow-btn-glass-deep',
                    default: ' bg-card/60 ',
                    hovered: ' bg-muted/60 ',
                    focused: ' bg-muted/60',
                    pressed:  'bg-muted/60 shadow-btn-glass-pressed dark:shadow-btn-glass-pressed-deep',
                    active: 'bg-muted/60 shadow-btn-glass-pressed dark:shadow-btn-glass-pressed-deep',
                    pressedToggle: 'bg-muted/20 shadow-btn-glass-pressed dark:shadow-btn-glass-pressed-deep',
                    disabled: 'bg-card/20 opacity-60',
                },
                text: {
                    base: 'font-semibold tracking-tight',
                    default: 'text-secondary-foreground',
                    hovered: 'text-foreground',
                    focused: 'text-card-foreground',
                    pressed: 'text-foreground',
                    active: 'text-foreground',
                    pressedToggle: 'text-foreground',
                    disabled: 'text-card-foreground/60',
                },
            },

            // SwiftUI .glassProminent — primary action colour with glass lift.
            glassProminent: {
                container: {
                    base: 'web:backdrop-blur-md shadow-btn-glass-prominent dark:shadow-btn-glass-prominent-deep',
                    default: 'bg-primary',
                    hovered: 'bg-primary-hover',
                    focused: 'bg-primary',
                    pressed: 'bg-primary-hover shadow-btn-glass-prominent-pressed dark:shadow-btn-glass-prominent-pressed-deep',
                    active: 'bg-primary-hover',
                    pressedToggle: 'bg-primary-hover shadow-btn-glass-prominent-pressed dark:shadow-btn-glass-prominent-pressed-deep',
                    disabled: 'bg-primary/90 opacity-60',
                },
                text: {
                    base: 'font-semibold tracking-tight',
                    default: 'text-primary-foreground',
                    hovered: 'text-primary-foreground',
                    focused: 'text-primary-foreground',
                    pressed: 'text-primary-foreground',
                    active: 'text-primary-foreground',
                    pressedToggle: 'text-primary-foreground',
                    disabled: 'text-primary-foreground/60',
                },
            },

        },

        // Per-style transitions. Each style picks one of:
        //   { type: 'scale',   from, to, spring }   — CSS transform on web, MotionView on native
        //   { type: 'shadow' }                      — no wrapper; press class swap only
        //   { type: 'opacity', duration }           — CSS opacity on web, MotionView on native
        //   false / null                            — no transition at all
        // `default` is the fallback for any style that does not declare its own.
        transitions: {
            default: {
                press: {
                    type: 'scale',
                    from: 1,
                    to: { default: 1.1, mouse: 0.98, touch: 1.1 },
                    spring: { damping: 24, stiffness: 360 },
                },
                hover: { type: 'opacity', duration: 120 },
                appear: null,
            },
            glass:          { press: { type: 'scale', from: 1, to: { default: 1.1, mouse: 0.98, touch: 1.1 }, spring: { damping: 24, stiffness: 360 } }, hover: { type: 'opacity', duration: 200 } },
            glassProminent: { press: { type: 'scale', from: 1, to: { default: 1.1, mouse: 0.98, touch: 1.1 }, spring: { damping: 24, stiffness: 360 } }, hover: { type: 'opacity', duration: 200 } },
            plain:          { press: false,                                                            hover: false },
            link:           { press: false,                                                            hover: false },
            borderless:     { press: { type: 'scale', from: 1, to: 0.98, spring: { damping: 28, stiffness: 380 } }, hover: { type: 'opacity', duration: 120 } },
        },

        // Highlight overlay used for press feedback inside the container.
        // Matches the pre-rebuild MotionView highlight behaviour.
        motion: {
            highlightBackgroundlight: 'rgba(255,255,255,0.5)',
            highlightBackgrounddark:  'rgba(0,0,0,0.5)',
        },
    },
}