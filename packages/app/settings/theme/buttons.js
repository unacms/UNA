

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
            container: 'px-2 gap-1 h-9 min-w-9 ',
            container_icon_only: 'h-9 w-9',
            text: 'text-sm leading-5',
            icon_size: 20,
            hitSlop: 6,
        },
        base: {
            rounded: 'rounded-lg',
            container: 'px-3 gap-2 min-h-10 min-w-10',
            container_icon_only: 'min-h-10 min-w-10',
            title_container: ' leading-10 text-base',
            icon_size: 24,
            hitSlop: 4,
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
        group:{
            container: ' border items-center border-border overflow-hidden ',
            separator: ' bg-border/60 w-px h-full',
        },
        primary:{
            container:{
                base:' web:duration-200 shadow-sm  ',
                base_stroke: 'web:border-0',
                default:'bg-primary',
                active:'bg-primary scale-[0.98] ',
                pressed:'bg-primary/70',
                hovered:'bg-primary ',
                focused:'bg-primary ',
                disabled:'bg-primary/70 opacity-50',

            },
            text:{
                base:'font-medium text-primary-foreground',
                default:'text-primary-foreground',
                hovered:'text-primary-foreground',
                focused:'',
                active:'text-primary-foreground',
                pressed:'text-primary-foreground',
                disabled:'text-primary-foreground/50',
            }
        },
        default:{
            container:{
                base:'web:duration-200 shadow-xs dark:shadow-xs-deep',
                base_stroke: ' border border-border/60',
                default:' bg-muted/60 ',
                active:' bg-card scale-[0.98]  ',
                pressed:' bg-card',
                hovered:' bg-muted  ',
                focused:' bg-card ',
                disabled:'bg-secondary opacity-50',

            },
            text:{
                base:'font-medium web:duration-200',
                default:'text-card-foreground',
                hovered:'text-foreground',
                focused:'text-foreground',
                active:'text-foreground',
                pressed:'text-foreground',
                disabled:'text-card-foreground/50',
            }
        },
        accent:{
            container:{
                base:'web:duration-200 bg-accent/60',
                default:' ',
                active:'web:ring-2 web:ring-accent web:ring-offset-2 web:outline-none',
                pressed:'',
                hovered:'bg-accent/90',
                focused:'',
                disabled:'',

            },
            text:{
                base:'font-semibold text-accent-foreground',
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
                base:'web:duration-200',
                default:'bg-secondary/80',
                active:'bg-border scale-[0.98] ',
                pressed:'bg-accent/80',
                hovered:'bg-border/80',
                focused:'bg-border/80',
                disabled:'',

            },
            text:{
                base:'font-medium',
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
                base:'bg-red-600',
                default:'',
                active:'bg-red-600/90 scale-[0.98] ',
                pressed:'bg-red-600/90 scale-[0.98] ',
                hovered:'bg-red-500 shadow',
                focused:'',
                disabled:'',

            },
            text:{
                base:'font-medium text-danger-foreground',
                default:'text-white',
                hovered:'',
                focused:'',
                active:'',
                pressed:'',
                disabled:'',
            }
        },
        text:{
            container:{
                base:'web:duration-200',
                default:'',
                active:'bg-border/80 scale-[0.98] ',
                pressed:'web:hover:bg-accent/80',
                hovered:'bg-muted/80',
                focused:'bg-muted/80',
                disabled:'opacity-50',

            },
            text:{
                base:'font-semibold text-secondary-foreground',
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
                active:' scale-[0.98] ',
                pressed:'',
                hovered:'',
                focused:'',
                disabled:'',

            },
            text:{
                base:'font-semibold text-secondary-foreground',
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
                base:'web:duration-200',
                default:'',
                active:'scale-[0.98] ',
                pressed:'',
                hovered:'',
                focused:'',
                disabled:'',

            },
            text:{
                base:'font-semibold text-secondary-foreground',
                default:'text-secondary-foreground',
                hovered:'text-foreground underline',
                focused:'text-accent-foreground',
                active:'text-accent-foreground',
                pressed:'text-accent-foreground',
                disabled:'text-accent-foreground/50',
            }
        },
        accentlink:{
            container:{
                base:'web:duration-200',
                default:'',
                active:'scale-[0.98] ',
                pressed:'',
                hovered:'',
                focused:'',
                disabled:'',

            },
            text:{
                base:'font-semibold text-accent-foreground',
                default:'text-accent-foreground',
                hovered:'text-accent-foreground underline',
                focused:'text-accent-foreground underline',
                active:'text-accent-foreground underline',
                pressed:'text-accent-foreground underline   ',
                disabled:'text-accent-foreground/50',
            }
        },
        outline:{
            container:{
                base:'border border-border/60',
                default:'',
                active:'bg-muted/60 scale-[0.98] ',
                pressed:'bg-muted/60',
                hovered:'bg-muted/60',
                focused:'bg-muted/60',
                disabled:'opacity-50',

            },
            text:{
                base:'font-medium ',
                default:'text-secondary-foreground',
                hovered:'text-foreground',
                focused:'text-foreground',
                active:'text-foreground',
                pressed:'text-foreground',
                disabled:'text-secondary-foreground/50',
            }
        }
    },
}