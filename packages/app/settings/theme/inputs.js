

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
            'w-36 bg-input border border-border/60 py-2 px-4 text-center rounded-lg justify-between',
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
        size:{
            default: 'px-3 leading-5 min-h-11',
            small: 'px-2 leading-5 min-h-9',
        },
        base: 
        'text-card-foreground placeholder:text-muted-foreground py-2 bg-input/60 shadow-input-outline dark:shadow-input-outline-deep flex-auto text-base placeholder-muted-foreground web:duration-200 web:file:text-foreground web:selection:bg-primary selection:text-primary-foreground web:focus-visible:bg-card web:focus-visible:border-ring web:overflow-hidden',
        select: ' pr-10 bg-input/60 shadow-input-outline min-h-11 dark:shadow-input-outline-deep web:focus:bg-card px-3 flex-auto text-base leading-6 overflow-hidden placeholder:text-muted-foreground text-card-foreground web:duration-300 ',
    },
    switcher: {
        // Container
        'u-controls-switcher-container':
            'items-center flex-row-reverse justify-between gap-x-2 min-w-12 rounded-lg flex-auto h-11 px-3 bg-input/60 shadow-input-outline dark:shadow-input-outline-deep ',

        // Text
        'u-controls-switcher-text': 'text-card-foreground text-base flex-1 ',

        // Track
        'u-controls-switcher-track': 'flex-row items-center rounded-full shrink-0',
        'u-controls-switcher-track-base': 'h-7 w-14 px-[3px] ',
        'u-controls-switcher-track-sm': 'h-5 w-8 px-0.5',
        'u-controls-switcher-track-disabled': 'opacity-50',

        // Thumb
        'u-controls-switcher-thumb':
            'rounded-full bg-popover/60 shadow-btn-outline dark:shadow-btn-outline-deep web:transition-transform web:duration-200',
        'u-controls-switcher-thumb-base': 'h-5 w-7 ',
        'u-controls-switcher-thumb-sm': 'h-3 w-3  ',

        // Active thumb position (translateX — ml-auto is not transitionable)
        'u-controls-switcher-thumb-active-base': 'translate-x-5',
        'u-controls-switcher-thumb-active-sm': 'translate-x-4',

        // Track Colors
        'u-controls-switcher-track-col':
            ' bg-muted border border-border/60 ',
        'u-controls-switcher-track-active-col': 'bg-accent border border-accent-foreground/60 ',
    },
    checkbox: {
        // Container
        'u-controls-checkbox-container':
            'items-center px-2.5 h-9 rounded-md w-full gap-2',

        // Hover & Active backgrounds (optional — Web-only)
        'u-controls-checkbox-container-bg':
            'web:active:bg-muted web:hover:bg-muted',

        // Text labels
        'u-controls-checkbox-text':
            'text-secondary-foreground text-sm leading-5 font-medium',
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