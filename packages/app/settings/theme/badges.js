

export const settingsBadges = {
    badges: {
        'u-badge-default': ' bg-transparent   ',
        'u-badge-destructive': ' bg-destructive ',
        'u-badge-outline': ' bg-transparent border border-border/60  ',
        'u-badge-accent': ' bg-accent ',
        'u-badge-secondary': ' bg-secondary ',
        'u-badge-text': ' whitespace-nowrap tracking-tight font-medium ',
        'u-badge-default-text': ' text-primary ',
        'u-badge-destructive-text': ' text-destructive-foreground ',
        'u-badge-outline-text': ' text-card-foreground ',
        'u-badge-accent-text': ' text-accent-foreground ',
        'u-badge-secondary-text': ' text-secondary-foreground ',
    },
    badge_sizes: {
        default_size: 'sm',
        '3xs': {
            // Matches profile_sizes['3xs']: h-4 (16px)
            padding: ' ',
            wide_padding: ' px-0.5 ',
            container: ' min-w-4 h-4 overflow-hidden justify-center items-center  ',
            image_container: ' items-center justify-center rounded overflow-hidden ',
            icon_size: 12,
            text: ' text-[10px] leading-4 px-0.5  ',
            rounded: ' rounded ',
        },
        '2xs': {
            // Matches profile_sizes['2xs']: h-5 (20px)
            padding: ' ',
            wide_padding: ' px-1 ',
            container: ' min-w-5 h-5 overflow-hidden justify-center items-center  ',
            image_container: ' items-center justify-center rounded overflow-hidden ',
            icon_size: 12,
            text: ' text-xs leading-5 px-1 py-0.5  ',
            rounded: ' rounded ',
        },
        xs: {
            // Matches profile_sizes['xs']: h-6 (24px)
            padding: ' ',
            wide_padding: ' px-1 ',
            container: ' min-w-6 h-6 overflow-hidden justify-center items-center ',
            image_container: ' items-center justify-center rounded overflow-hidden ',
            icon_size: 16,
            text: ' text-xs leading-6 px-1  ',
            rounded: ' rounded-md ',
        },
        sm: {
            // Matches profile_sizes['sm']: h-8 (32px)
            padding: ' px-1 ',
            wide_padding: ' px-2 ',
            container: ' min-w-8 h-8 gap-1 justify-center items-center  ',
            image_container: ' items-center justify-center ',
            icon_size: 20,
            text: ' text-sm leading-8  ',
            rounded: ' rounded-lg ',
        },
        md: {
            // Matches profile_sizes['md']: h-9 (36px)
            padding: ' px-1.5 ',
            wide_padding: ' px-2.5 ',
            container: ' min-w-9 h-9 gap-1 justify-center items-center  ',
            image_container: ' items-center justify-center ',
            icon_size: 22,
            text: ' text-base leading-9  ',
            rounded: ' rounded-lg ',
        },
        base: {
            // Matches profile_sizes['base']: h-10 (40px)
            padding: ' px-2 ',
            wide_padding: ' px-3 ',
            container: ' min-w-10 h-10 gap-1.5 justify-center items-center  ',
            image_container: ' items-center justify-center ',
            icon_size: 24,
            text: ' text-base leading-10  ',
            rounded: ' rounded-xl ',
        },
        lg: {
            // Matches profile_sizes['lg']: h-12 (48px)
            padding: ' px-2 ',
            wide_padding: ' px-3 ',
            container: ' min-w-12 h-12 gap-1.5 justify-center items-center  ',
            image_container: ' items-center justify-center ',
            icon_size: 28,
            text: ' text-lg leading-[48px]  ',
            rounded: ' rounded-xl ',
        },
        xl: {
            // Matches profile_sizes['xl']: h-14 (56px)
            padding: ' px-2.5 ',
            wide_padding: ' px-4 ',
            container: ' min-w-14 h-14 gap-2 justify-center items-center e ',
            image_container: ' items-center justify-center ',
            icon_size: 32,
            text: ' text-xl leading-[56px]  ',
            rounded: ' rounded-2xl ',
        },
        '2xl': {
            // Matches profile_sizes['2xl']: h-20 (80px)
            padding: ' px-3 ',
            wide_padding: ' px-5 ',
            container: ' min-w-20 h-20 gap-2 justify-center items-center ',
            image_container: ' items-center justify-center ',
            icon_size: 48,
            text: ' text-2xl leading-[80px]  ',
            rounded: ' rounded-3xl ',
        },
    }
}