export const settingsLinks = {
    link_sizes: {
        default_size: 'md',
        default_variant: 'default',
        xs: {
            hitSlop: 14,
            text: 'text-xs rounded-xs',
            // Extra DOM padding for primary variant (inline-button style)
            primary: 'px-1.5 py-px',
        },
        sm: {
            hitSlop: 12,
            text: 'text-sm rounded-sm',
            primary: 'px-2.5 py-0.5',
        },
        md: {
            hitSlop: 10,
            text: 'text-base rounded-md',
            primary: 'px-3 py-1',
        },
        lg: {
            hitSlop: 8,
            text: 'text-lg rounded-lg',
            primary: 'px-4 py-1.5',
        }
    },

    link_styles: {
        // Inherits text color; underline on hover; brief muted flash on press (via ::after pseudo)
        default: 'text-secondary-foreground web:hover:text-foreground u-link-press web:duration-200',

        // Muted text; subtle underline on hover; brief muted flash on press
        secondary: 'text-muted-foreground web:hover:text-secondary-foreground web:hover:underline web:active:no-underline u-link-press web:duration-200',

        // Accent-colored text; underline on hover; brief muted flash on press
        accent: 'text-accent-foreground web:hover:underline web:active:no-underline u-link-press web:duration-200',

        // Inline-button style: real background + padding (padding added per-size via link_sizes[size].primary)
        primary: 'text-accent-foreground bg-accent web:hover:opacity-90 web:active:opacity-80 web:duration-200',

        // No DOM padding; muted background appears on hover via ::after pseudo-element
        ghost: 'text-secondary-foreground web:hover:text-foreground u-link-ghost web:duration-200',
    }
}
