

export const settingsLinks = {
    link_sizes: {
        default_size: 'md',
        default_variant: 'default',

        
        xs: {
            padding: '  ',
            hitarea_class: ' web:u-link-hitarea web:u-link-hitarea-xs ',
            hitSlop: { top: 8, right: 8, bottom: 8, left: 8 },
            text: ' text-xs leading-4 min-h-4 items-center justify-center flex',
            rounded: ' rounded ',
            focus: '  ',
        },
        sm: {
            padding: ' ',
            hitarea_class: ' web:u-link-hitarea web:u-link-hitarea-sm ',
            hitSlop: { top: 6, right: 6, bottom: 6, left: 6 },
            text: ' text-sm ',
            rounded: '  rounded-md ',
            focus: '  web:focus-visible:outline-offset-2  ',
        },
        md: {
            padding: ' px-1 py-0.5 ',
            hitarea_class: ' web:u-link-hitarea web:u-link-hitarea-md ',
            hitSlop: { top: 4, right: 4, bottom: 4, left: 4 },
            text: ' underline-offset-2  text-base  ',
            rounded: ' rounded-md ',
            focus: ' web:focus-visible:outline-offset-2   ',
        },
        lg: {
            padding: ' px-2 py-1 ',
            hitarea_class: ' web:u-link-hitarea web:u-link-hitarea-md ',
            hitSlop: { top: 2, right: 2, bottom: 2, left: 2 },
            text: ' underline-offset-2  text-lg  ',
            rounded: ' rounded-lg ',
            focus: ' web:focus-visible:outline-offset-2   ', },
    },

    link_styles: {
        // inherit color and decoration
        'u-link-default-cnt': '   ',
        'u-link-default-text': '   ',
        'u-link-default-trans': ' web:duration-200 ',

        // neutral color link, no background
        'u-link-plain-cnt': ' web:active:bg-muted/60  ',
        'u-link-plain-text': ' text-foreground web:hover:underline web:duration-200 ',
        'u-link-plain-trans': ' web:duration-200 ',

        // branded color link, no background
        'u-link-accent-cnt': ' web:active:bg-accent/60  ',
        'u-link-accent-text': ' text-accent-foreground web:hover:underline ',
        'u-link-accent-trans': ' web:duration-200 ',

        // neutral color link, no background, hover background
        'u-link-ghost-cnt':  ' web:u-link-ghost    ',
        'u-link-ghost-text':  ' text-secondary-foreground web:hover:text-foreground ',
        'u-link-ghost-trans': ' web:duration-100 ',

        // branded color link, no background, hover background
        'u-link-plainghost-cnt':  ' web:u-link-ghost   ',
        'u-link-plainghost-text':  ' text-muted-foreground web:hover:text-foreground ',
        'u-link-plainghost-trans': ' web:duration-100 ',

        // branded color link, no background, hover background
        'u-link-accentghost-cnt':  ' web:u-link-ghost   ',
        'u-link-accentghost-text':  ' text-accent-foreground ',
        'u-link-accentghost-trans': ' web:duration-100 ',

      
    }
}