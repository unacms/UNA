export const settingsLinks = {
    link_sizes: {
        default_size: 'md',
        default_variant: 'default',
        xs: {
            hitSlop: 8,
            text: ' text-xs leading-4 min-h-4 items-center justify-center flex rounded',
        },
        sm: {
            hitSlop: 6,
            text: ' text-sm rounded-md web:focus-visible:outline-offset-2',
        },
        md: {
            hitSlop: 4,
            text: 'text-base rounded-md underline-offset-2 web:focus-visible:outline-offset-2  ',
        },
        lg: {
            hitSlop: 2,
            text: 'text-lg rounded-lg px-2 py-1 underline-offset-2 web:focus-visible:outline-offset-2',
        }
    },

    link_styles: {
        // inherit color and decoration
        default: 'web:duration-200',

        // neutral color link, no background
        plain: 'text-foreground web:hover:underline web:active:bg-muted/60 web:duration-200',

        // branded color link, no background
        accent: 'text-accent-foreground web:hover:underline web:active:bg-accent/60 web:duration-200',

        // neutral color link, no background, hover background
        ghost: 'text-secondary-foreground rounded-lg web:hover:text-foreground web:u-link-ghost web:duration-100 web:active:bg-muted',

        // branded color link, no background, hover background
        plainghost: 'text-muted-foreground rounded-lg web:hover:text-foreground web:u-link-ghost web:duration-100 web:active:bg-muted',

        // branded color link, no background, hover background
        accentghost: 'text-accent-foreground rounded-lg web:u-link-ghost web:duration-100 web:active:bg-muted',
    }
}