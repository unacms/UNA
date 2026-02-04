

export const settingsButtons = {
    neo_button: false,
    button_sizes: {
        default_size: 'base',
        default_variant: 'default',
        pressed_container: ' bg-accent web:hover:bg-accent web:active:bg-accent  ',
        pressed_text: ' text-accent-foreground font-medium ',
     
        xs: {
            rounded: ' rounded-md ',
            padding: ' ',
            padding_icon_only: ' px-1',
            padding_with_title: ' px-1.5 gap-1 ',
            icon_container:
                ' h-6 text-sm flex items-center justify-center',
            title_container: ' text-xs leading-6 text-xs',
            icon_size: 16,
            icon_margin: '  ', // conditional margin for icon container when title is present
            title_margin: ' ', //
            hitarea_class: ' relative u-action-hitarea u-action-hitarea-xs ',
            hitSlop: { top: 8, right: 8, bottom: 8, left: 8 },
        },
        sm: {
            rounded: ' rounded-lg ',
            padding: ' min-h-9 ',
            padding_icon_only: ' h-9 w-9 ',
            padding_with_title: ' px-2 h-9 gap-0.5 ',
            icon_container:
                ' text-base flex items-center justify-center',
            title_container: ' px-0.5 text-sm inline-flex items-center  ',
            icon_size: 20,
            icon_margin: ' ', // conditional margin for icon container when title is present
            title_margin: '  ', // conditional margin for text container when icon is present
            hitarea_class: ' relative u-action-hitarea u-action-hitarea-sm ',
            hitSlop: { top: 6, right: 6, bottom: 6, left: 6 },
        },
        
        base: {
            rounded: ' rounded-lg ',
            padding: '  ',
            padding_icon_only: ' h-10 w-10 web:active:outline-offset-1 web:active:outline-4 ',
            padding_with_title: ' px-3 gap-2 h-10 items-center ',
            icon_container: ' text-base flex items-center ',
            title_container: ' leading-10 text-base items-center flex   ',
            icon_size: 24,
            icon_margin: ' ', // conditional margin for icon container when title is present
            title_margin: ' ', // conditional margin for text container when icon is present
            hitarea_class: ' relative web:u-action-hitarea web:u-action-hitarea-base ',
            hitSlop: { top: 4, right: 4, bottom: 4, left: 4 },
        },
        lg: {
            rounded: ' rounded-xl ',
            padding: '  ',
            padding_icon_only: ' h-12 w-12 ',
            padding_with_title: ' px-4 gap-2 h-12 items-center ',
            icon_container: '  text-lg flex items-center ',
            title_container: ' leading-12 text-base items-center flex',
            icon_size: 24,
            icon_margin: '', // conditional margin for icon container when title is present
            title_margin: '', // conditional margin for text container when icon is present
            hitarea_class: ' relative u-action-hitarea u-action-hitarea-lg ',
            hitSlop: { top: 14, right: 14, bottom: 14, left: 14 },
        },
        // icon-only sizes
        'icon-sm': {
            rounded: ' rounded-lg ',
            padding: '  ',
            padding_icon_only: ' h-8 w-8 ',
            padding_with_title: ' px-2 gap-1 h-8 items-center ',
            icon_container: ' text-base h-8 flex items-center justify-center',
            title_container: ' text-sm leading-8 inline-flex items-cente px-0.5  ',
            icon_size: 20,
            icon_margin: ' ',
            title_margin: '  ',
            hitarea_class: ' relative u-action-hitarea u-action-hitarea-sm ',
            hitSlop: { top: 6, right: 6, bottom: 6, left: 6 },
        },
        'icon': {
            rounded: ' rounded-lg ',
            padding: '  ',
            padding_icon_only: ' h-9 w-9 ',
            padding_with_title: ' px-2 gap-1 h-9 items-center ',
            icon_container: ' text-base h-9 flex items-center justify-center',
            title_container: ' text-sm leading-9 inline-flex items-cente px-0.5  ',
            icon_size: 24,
            icon_margin: ' ',
            title_margin: '  ',
            hitarea_class: ' relative u-action-hitarea u-action-hitarea-sm ',
            hitSlop: { top: 6, right: 6, bottom: 6, left: 6 },
        },
        'icon-lg': {
            rounded: ' rounded-xl ',
            padding: '  ',
            padding_icon_only: ' h-10 w-10 ',
            padding_with_title: ' px-3 gap-2 h-10 items-center ',
            icon_container: ' text-base h-10 flex items-center justify-center ',
            title_container: ' leading-10 text-base items-center flex   ',
            icon_size: 24,
            icon_margin: ' ',
            title_margin: ' ',
            hitarea_class: ' relative u-action-hitarea u-action-hitarea-base ',
            hitSlop: { top: 4, right: 4, bottom: 4, left: 4 },
        },
    },
    // Button group sizes (separate from individual button sizes)
    buttons_group_sizes: {
        default_size: 'base',
     
        xs: {
            rounded: ' rounded-md ',
            container: ' h-7 gap-[1px] ',
        },
        sm: {
            rounded: ' rounded-lg ',
            container: ' h-9 gap-0.5 ',
        },
        base: {
            rounded: ' rounded-xl ',
            container: ' h-11 web:group ',
            divider: ' w-0.5 h-full  ',
        },
        lg: {
            rounded: ' rounded-xl ',
            container: ' h-12 web:group ',
            divider: ' w-0.5 h-full  ',
        },
    },
    // Button group item container sizes for inner wrappers inside a ButtonsGroup
    buttons_group_items_sizes: {
        default_size: 'base',
        xs: {
            container: ' h-full ',
            rounded: ' rounded-md ',
        },
        sm: {
            container: ' h-full ',
            rounded: ' rounded-lg ',
        },
        base: {
            container: ' h-full rounded',
            rounded: ' rounded-xl ',
        },
        lg: {
            container: ' h-full rounded',
            rounded: ' rounded-xl ',
        },
    },
    button_sizes_neo: {
        default_size: 'base',
        default_variant: 'default',     
        xs: {
            rounded: 'rounded-md',
            container: 'px-1.5 gap-1',
            container_icon_only: 'px-1',
            text: 'text-xs leading-6',
            icon_size: 16,
            hitSlop: 8,
        },
        sm: {
            rounded: 'rounded-lg ',
            container: 'px-2 gap-1 h-9 ',
            container_icon_only: 'h-9 w-9',
            text: 'text-sm leading-6',
            icon_size: 20,
            hitSlop: 6,
        },
        base: {
            rounded: 'rounded-lg',
            container: 'px-3 gap-2 h-10',
            container_icon_only: 'h-10 w-10',
            title_container: ' leading-10 text-base',
            icon_size: 24,
            hitSlop: 4,
        },
        lg: {
            rounded: 'rounded-xl',
            container: 'px-4 gap-2 h-12',
            container_icon_only: 'h-12 w-12',
            title_container: ' leading-12 text-base',
            icon_size: 24,
            hitSlop: 14,
        },
    },
    button_styles_neo: {
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
                base:'web:backdrop-blur shadow-border web:duration-200',
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
                pressed:'',
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
                pressed:'',
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
                default:'',
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
                disabled:'',

            },
            text:{
                base:'font-medium ',
                default:'text-secondary-foreground',
                hovered:'text-foreground',
                focused:'text-foreground',
                active:'',
                pressed:'text-accent-foreground',
                disabled:'',
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
    button_styles: {
        // Default button (neutral/popover)
        'u-btn-default-cnt': [
            ' bg-card/60 web:backdrop-blur web:hover:bg-card web:active:bg-card/60 border border-card web:active:border-border',
            ' web:shadow-border web:focus-visible:border-border  ',
            ' web:active:outline web:active:outline-ring web:active:scale-95 web:duration-200 ',
            ' web:active:shadow-none ',    
        ].join(' '),
        'u-btn-default-text': 'font-medium  text-secondary-foreground web:group-hover:text-foreground web:active:text-foreground web:duration-200',
        'u-btn-default-trans': 'web:duration-200',

      
        // Primary button (primary/accent)
        'u-btn-primary-cnt': [
            // Background and main color
            ' bg-primary web:hover:bg-primary/90 overflow-hidden overflow-hidden web:active:bg-primary/80  ',
            ' active:outline active:outline-accent-foreground ',
            ' shadow-xs web:hover:shadow-md web:active:shadow-none   ',
            ' ',
        ].join(' '),
        'u-btn-primary-text': ' font-medium text-primary-foreground ',
        'u-btn-primary-trans': ' web:duration-200',


        'u-btn-accent-cnt':
            ' bg-accent overflow-hidden web:active:ring-2 web:active:ring-accent web:active:ring-offset-2 web:active:outline-none ',
        'u-btn-accent-text': ' font-medium text-accent-foreground ',
        'u-btn-accent-trans': '  web:duration-200',
        'u-btn-accent-hover': 'web:group-hover:bg-accent/90 web:duration-200',
        

        'u-btn-secondary-cnt': 'overflow-hidden web:group bg-secondary web:hover:bg-secondary/90 web:focus-visible:bg-secondary ',
        'u-btn-secondary-text':
            ' web:duration-200 font-medium  text-secondary-foreground web:group-hover:text-foreground ',
        'u-btn-secondary-trans': ' web:duration-200 ',
        

        'u-btn-danger-cnt':
            '  dark:border-transparent bg-red-600 web:hover:bg-red-500 web:hover:shadow web:active:opacity-50 web:active:shadow-none',
        'u-btn-danger-text': 'font-medium text-danger-foreground',
        'u-btn-danger-trans': ' web:duration-200',
        

        'u-btn-text-cnt': ' web:group web:active:bg-muted web:focus-visible:bg-muted/60 web:hover:bg-muted/60 overflow-hidden ',
        'u-btn-text-text':
            ' font-medium text-secondary-foreground web:group-hover:text-foreground web:focus:text-foreground',
        'u-btn-text-trans': ' web:duration-200',

        'u-btn-ghost-cnt': ' web:group  overflow-hidden ',
        'u-btn-ghost-text':
            ' font-medium text-secondary-foreground ',
        'u-btn-ghost-trans': ' ',
     

        'u-btn-link-cnt': ' web:hover:bg-accent/60 ',
        'u-btn-link-text':
            ' font-medium text-accent-foreground  ',
        'u-btn-link-trans': ' web:duration-200  ',
        

        'u-btn-outline-cnt':
            ' bg-transparent border border-border ',
        'u-btn-outline-text':
            ' font-medium text-card-foreground web:group-hover:text-foreground ',
        'u-btn-outline-trans': '  web:duration-200',

        'u-btn-group-item-cnt': '   ',
        'u-btn-group-item-text':
            ' font-medium text-card-foreground web:group-hover:text-foreground ',
        'u-btn-group-item-icon':
            ' text-card-foreground web:group-hover:text-foreground ',

        'u-btn-group-item-default-cnt':
            'border-4 border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
        'u-btn-group-item-default-text':
            'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
        'u-btn-group-item-default-icon':
            'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',

        'u-btn-group-item-primary-cnt':
            'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
        'u-btn-group-item-primary-text':
            'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
        'u-btn-group-item-primary-icon':
            'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',

        'u-btn-group-item-secondary-cnt':
            ' web:hover:bg-secondary h-full w-full overflow-hidden',
        'u-btn-group-item-secondary-text':
            'font-medium text-neutral-800 web:hover:text-neutral-950 dark:text-neutral-200 web:dark:group-hover:text-white',
        'u-btn-group-item-secondary-icon':
            'text-red-500 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',

        'u-btn-group-item-text-cnt':
            '  web:lg:hover:bg-secondary/80 web:active:bg-secondary web:duration-200 ',
        'u-btn-group-item-text-text':
            ' font-medium text-muted-foreground web:group-hover:text-foreground ',
        'u-btn-group-item-text-icon':
            ' text-muted-foreground web:group-hover:text-foreground ',

        'u-btn-group-item-link-cnt': '',
        'u-btn-group-item-link-text':
            'font-medium text-muted-foreground web:hover:text-foreground web:active:text-foreground  ',
        'u-btn-group-item-link-icon':
            'text-link-secondary web:group-hover:text-link-primary web:duration-200',
        'u-btn-group-item-link-pressed-cnt': 'bg-accent ',
        'u-btn-group-item-link-pressed-text': 'text-link-primary',
        'u-btn-group-item-link-pressed-icon': 'text-link-primary',

        'u-btn-group-item-outline-cnt':
            'border border-bdritem dark:border-bdritem-d web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
        'u-btn-group-item-outline-text':
            'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
        'u-btn-group-item-outline-icon':
            'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',

        'u-btn-group-item-accent-cnt':
            'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
        'u-btn-group-item-accent-text':
            'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
        'u-btn-group-item-accent-icon':
            'text-neutral-700 dark:text-neutral-300 web:web:dark:group-hover:text-neutral-50',

        'u-btn-label-cnt':
            'border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 web:hover:bg-neutral-100 dark:web:hover:bg-neutral-800 web:active:opacity-70',
        'u-btn-label-text':
            'font-medium text-sm text-neutral-600 dark:text-neutral-400 web:hover:text-neutral-800 dark:web:hover:text-neutral-200',
        'u-btn-label-trans': '  web:duration-200',

        'u-btn-group-divider-text-cnt':
            ' bg-transparent ',
    },
    buttons_group_styles: {
        'u-btn-default-cnt':
            ' flex-row bg-popover/80 web:hover:bg-popover shadow-xs border-[0.5px] border-border/60 web:border-0 web:ring-[0.5px] web:ring-inset web:ring-border/60 web:hover:ring-border web:active:opacity-50 ',
        'u-btn-accent-cnt':
            'border border-emerald-600 dark:border-emerald-500 bg-emerald-100 dark:bg-emerald-900 flex flex-row',
        'u-btn-outline-cnt':
            'border border-bdrbutton dark:border-bdrbutton-d flex flex-row',

        'u-btn-text-cnt':
            ' flex-row items-center  web:duration-200 ',

        'u-btn-secondary-cnt':
            '  flex-row bg-secondary/80  ',
        'u-btn-secondary-text':
            ' font-medium text-neutral-800 web:hover:text-neutral-950 dark:text-neutral-200 web:dark:group-hover:text-white ',
        'u-btn-secondary-trans': '   web:duration-300 ',

        'u-btn-link-cnt':
            ' border border-transparent dark:border-transparent flex flex-row web:active:opacity-50 items-center ',
        'u-btn-link-text':
            ' font-medium web:group-hover:underline text-card-foreground  web:hover:text-neutral-950 web:dark:hover:text-neutral-50 web:active:opacity-50 ',
        'u-btn-link-trans': '   web:duration-300 ',

        'u-btn-label-cnt':
            'border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex flex-row web:active:opacity-70',
        'u-btn-label-text':
            ' font-medium text-sm text-neutral-600 dark:text-neutral-400 web:hover:text-neutral-800 web:dark:hover:text-neutral-200 ',
        'u-btn-label-trans': '   web:duration-200 ',
    },
}