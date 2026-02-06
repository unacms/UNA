

export const settingsButtons = {
    button_sizes: {
        default_size: 'base',
        default_variant: 'default', 
        xs: {
            rounded: 'rounded-md',
            container: 'px-1.5 gap-1 h-6 min-w-6',
            container_icon_only: 'h-6 w-6',
            text: 'text-xs leading-6',
            icon_size: 16,
            hitSlop: 8,
        },
        sm: {
            rounded: 'rounded-lg ',
            container: 'px-2 gap-1 h-9 min-w-9 ',
            container_icon_only: 'h-9 w-9',
            text: 'text-sm leading-6',
            icon_size: 20,
            hitSlop: 6,
        },
        base: {
            rounded: 'rounded-lg',
            container: 'px-3 gap-2 h-10 min-w-10',
            container_icon_only: 'h-10 w-10',
            title_container: ' leading-10 text-base',
            icon_size: 24,
            hitSlop: 4,
        },
        lg: {
            rounded: 'rounded-xl',
            container: 'px-4 gap-2 h-12 min-w-12',
            container_icon_only: 'h-12 w-12',
            title_container: ' leading-12 text-base',
            icon_size: 24,
            hitSlop: 14,
        },
    },
    button_styles: {
        group:{
            container: 'overflow-hidden border-[0.5px] items-center border-border/60',
            separator: ' bg-border/60 w-px h-full',
        },
        primary:{
            container:{
                base:'shadow-xs web:duration-200',
                default:'bg-primary',
                active:'bg-accent',
                pressed:'bg-accent',
                hovered:'bg-primary/90 shadow-md',
                focused:'bg-primary/80 outline outline-accent-foreground shadow-none',
                disabled:'bg-primary opacity-50',

            },
            text:{
                base:'font-medium text-primary-foreground',
                default:'',
                hovered:'',
                focused:'',
                active:'',
                pressed:'',
                disabled:'',
            }
        },
        default:{
            container:{
                base:'web:backdrop-blur web:shadow-border web:duration-200',
                default:'bg-card/60 border border-card  ',
                active:'bg-card/60 border-border outline outline-ring web:scale-95 shadow-none',
                pressed:'',
                hovered:'bg-card',
                focused:'border-border',
                disabled:'opacity-50',

            },
            text:{
                base:'font-medium web:duration-200',
                default:'text-secondary-foreground',
                hovered:'text-foreground',
                focused:'',
                active:'text-foreground',
                pressed:'',
                disabled:'',
            }
        },
        accent:{
            container:{
                base:'web:duration-200',
                default:'bg-accent ',
                active:'web:ring-2 web:ring-accent web:ring-offset-2 web:outline-none',
                pressed:'',
                hovered:'bg-accent/90',
                focused:'',
                disabled:'',

            },
            text:{
                base:'font-medium text-accent-foreground',
                default:'',
                hovered:'',
                focused:'',
                active:'',
                pressed:'',
                disabled:'',
            }
        },
        secondary:{
            container:{
                base:'web:duration-200',
                default:'bg-secondary',
                active:'',
                pressed:'bg-accent',
                hovered:'bg-secondary/90',
                focused:'bg-secondary',
                disabled:'',

            },
            text:{
                base:'font-medium',
                default:'text-secondary-foreground',
                hovered:'text-foreground',
                focused:'',
                active:'',
                pressed:'text-accent-foreground',
                disabled:'',
            },
        },
        danger:{
            container:{
                base:'bg-red-600',
                default:'',
                active:'opacity-50 shadow-none',
                pressed:'',
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
                active:'bg-muted',
                pressed:'bg-accent',
                hovered:'bg-muted/60',
                focused:'bg-muted/60',
                disabled:'opacity-50',

            },
            text:{
                base:'font-medium ',
                default:'text-secondary-foreground',
                hovered:'text-foreground',
                focused:'text-foreground',
                active:'',
                pressed:'text-accent-foreground',
                disabled:'text-secondary-foreground',
            }
        },
        ghost:{
            container:{
                base:'',
                default:'',
                active:'',
                pressed:'',
                hovered:'',
                focused:'',
                disabled:'',

            },
            text:{
                base:'font-medium text-secondary-foreground',
                default:'',
                hovered:'',
                focused:'',
                active:'',
                pressed:'',
                disabled:'',
            }
        },
        link:{
            container:{
                base:'web:duration-200',
                default:'',
                active:'',
                pressed:'',
                hovered:'bg-accent/60',
                focused:'',
                disabled:'',

            },
            text:{
                base:'font-medium text-accent-foreground',
                default:'',
                hovered:'',
                focused:'',
                active:'',
                pressed:'',
                disabled:'',
            }
        },
        outline:{
            container:{
                base:'border border-border',
                default:'',
                active:'',
                pressed:'',
                hovered:'bg-accent/60',
                focused:'',
                disabled:'',

            },
            text:{
                base:'font-medium ',
                default:'text-card-foreground',
                hovered:'text-foreground',
                focused:'',
                active:'',
                pressed:'',
                disabled:'',
            }
        }
    },
}