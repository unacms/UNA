export const settingsLinks = {
    link_sizes: {
        default_size: 'md',
        default_variant: 'default',
        xs: {
            hitSlop: 8,
            text: 'text-xs rounded-sm font-semibold',
            primary: 'p-1',
        },
        sm: {
            hitSlop: 8,
            text: 'text-sm leading-5 rounded-lg font-semibold',
            primary: 'p-1.5 ',
        },
        md: {
            hitSlop: 8,
            text: 'text-base leading-6 rounded-lg font-semibold',
            primary: 'p-2',
        },
        lg: {
            hitSlop: 8,
            text: 'text-lg leading-6 rounded-xl font-semibold',
            primary: 'p-3',
        }
    },

    link_styles: {
        // Inherits text color; underline on hover; brief muted flash on press (via ::after pseudo)
        default: ' text-foreground web:hover:text-foreground web:duration-200 ',

        // Muted text; subtle underline on hover; brief muted flash on press
        secondary: ' font-semibold text-secondary-foreground web:hover:text-foreground web:hover:underline web:duration-200 ',

        // Accent-colored text; underline on hover; brief muted flash on press
        accent: 'text-accent-foreground web:hover:underline web:active:no-underline u-link-press web:duration-200 ',

        // Inline-button style: real background + padding (padding added per-size via link_sizes[size].primary)
        primary: 'text-accent-foreground web:hover:bg-accent/60 web:duration-200 ',

        // No DOM padding; muted background appears on hover via ::after pseudo-element
        ghost: 'text-accent-foreground u-link-ghost web:duration-200 ',
    }
}
