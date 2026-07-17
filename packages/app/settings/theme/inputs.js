
export const settingsInputs = {
    dropdown: {
        cnt: ' rounded-xl overflow-hidden p-2 bg-card shadow-btn-glass dark:shadow-btn-glass-deep backdrop-blur-xl z-50  ',
    },
    checkbox_set: {
        container: ' gap-x-2 rounded-lg shadow-input-outline dark:shadow-input-outline-deep bg-input/60 p-1',
    },
    
    doublerange: {
        container: 'w-full items-center justify-between mt-2',
        value_container:
            'w-36 bg-input border border-border/60 py-2 px-4 text-center rounded-lg justify-between min-h-10',
        text_value: 'text-muted-foreground ',
        text_info: '',
        track_height: 4,
        thumb_size: 15,
        outbound_color: {
            light: 'rgb(242, 242, 242)',
            dark: 'rgb(242, 242, 242)',
        },
        inbound_color: {
            light: 'rgb(242, 242, 242)',
            dark: 'rgb(242, 242, 242)',
        },
        thumb_tint_color: {
            light: '#2563eb',
            dark: '#2563eb',
        },
    },
    inputs: {
        rounded:{
            default: 'rounded-lg',
            full: 'rounded-full',
        },
        // Shared control heights — text inputs, selects, and matching surfaces.
        size:{
            small: 'px-2 leading-5 min-h-9',
            regular: 'px-3 leading-5 min-h-10',
            large: 'px-3 leading-5 min-h-12',
        },
        // Height-only tokens for chip wells / wrappers that bring their own padding.
        surface_size:{
            small: 'min-h-9',
            regular: 'min-h-10',
            large: 'min-h-12',
        },
        base: 
        'text-card-foreground placeholder:text-muted-foreground py-2 bg-input/50 shadow-input-outline dark:shadow-input-outline-deep flex-auto text-base placeholder-muted-foreground web:duration-200 web:file:text-foreground web:selection:bg-primary selection:text-primary-foreground web:focus-visible:bg-card web:focus-visible:border-ring web:overflow-hidden',
        // Height/padding come from `size` (same as Input) so select stays in sync.
        select: ' pr-10 bg-input/60 shadow-input-outline dark:shadow-input-outline-deep web:focus:bg-card flex-auto text-base leading-6 overflow-hidden placeholder:text-muted-foreground text-card-foreground web:duration-300 ',
    },
    switcher: {
        // Container (height/padding via size.*)
        'u-controls-switcher-container':
            'items-center flex-row-reverse justify-between gap-x-2 min-w-12 rounded-lg flex-auto bg-input/60 shadow-input-outline dark:shadow-input-outline-deep ',
        size: {
            small: 'min-h-9 px-2',
            regular: 'min-h-10 px-3',
            large: 'min-h-12 px-3',
        },

        // Text
        'u-controls-switcher-text': 'text-card-foreground text-base flex-1 ',

        // Track
        'u-controls-switcher-track': 'flex-row items-center rounded-full shrink-0',
        'u-controls-switcher-track-regular': 'h-7 w-14 px-1 ',
        'u-controls-switcher-track-small': 'h-4 w-8 px-0.5 ',
        'u-controls-switcher-track-large': 'h-8 w-16 px-1',
        'u-controls-switcher-track-disabled': 'opacity-50',

        // Thumb
        'u-controls-switcher-thumb':
            'rounded-full bg-popover/80 shadow-btn-outline dark:shadow-btn-outline-deep web:transition-transform web:duration-200',
        'u-controls-switcher-thumb-regular': 'h-5 w-7 ',
        'u-controls-switcher-thumb-small': 'h-3 w-4  ',
        'u-controls-switcher-thumb-large': 'h-6 w-8 ',

        // Active thumb position (translateX — ml-auto is not transitionable)
        'u-controls-switcher-thumb-active-regular': 'translate-x-5',
        'u-controls-switcher-thumb-active-small': 'translate-x-3',
        'u-controls-switcher-thumb-active-large': 'translate-x-6',

        // Track Colors
        'u-controls-switcher-track-col':
            ' bg-muted  ',
        'u-controls-switcher-track-active-col': 'bg-primary ',
    },
    checkbox: {
        // Container
        'u-controls-checkbox-container':
            'items-center px-2.5 py-2 rounded-md w-full gap-2 min-h-10',

        // Hover & Active backgrounds (optional — Web-only)
        'u-controls-checkbox-container-bg':
            'web:active:bg-muted web:hover:bg-muted',

        // Text labels
        'u-controls-checkbox-text':
            'text-secondary-foreground text-sm leading-5 font-medium text-wrap',
        'u-controls-checkbox-text2':
            'text-muted-foreground text-sm leading-5',

        // Icon (e.g. if checkbox is custom-rendered)
        'u-controls-checkbox-icon':
            'text-foreground my-auto h-6 w-6',

        // Checkbox square indicator
        'u-controls-checkbox-indicator':
            'shrink-0 h-5 w-5 rounded-md shadow-btn-outline dark:shadow-btn-outline-deep  bg-input justify-center items-center',

        // Radiobutton circular indicator
        'u-controls-radiobutton-indicator':
            'h-5 w-5 m-1 rounded-full border-2 border-border bg-transparent justify-center items-center ',

        // Active mark inside checkbox (filled square)
        'u-controls-checkbox-indicator-active':
            'h-3 w-3 m-1 bg-primary rounded',

        // Active mark inside radiobutton (filled circle)
        'u-controls-radiobutton-indicator-active':
            'h-2.5 w-2.5 rounded-full bg-primary m-1 items-center justify-center',
    },

}
