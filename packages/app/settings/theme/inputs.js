

export const settingsInputs = {
    dropdown: {
        cnt: ' rounded-2xl overflow-hidden shadow-xl border border-border/60 p-2 bg-popover web:bg-popover/90 backdrop-blur-xl z-50  ',
    },
    checkbox_set: {
        container: ' gap-x-2 rounded-xl border border-border/60 bg-input p-1',
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
            default: 'px-3 leading-5 min-h-12',
            small: 'px-2 leading-5 min-h-10',
        },
        base: 
        'text-foreground placeholder:text-muted-foreground bg-input border border-border rounded-xl flex-auto text-base placeholder-muted-foreground text-foreground web:duration-200 web:file:text-foreground web:selection:bg-primary selection:text-primary-foreground web:focus-visible:bg-accent/70 web:focus-visible:border-accent-foreground web:focus-visible:outline-ring/60 web:focus-visible:outline-offset-2 web:focus-visible:outline-4 web:overflow-hidden',
        select: ' pr-10 border border-border rounded-xl bg-input web:focus:bg-card px-3 min-h-12 flex-auto  text-base leading-6 overflow-hidden placeholder:text-muted-foreground text-card-foreground web:duration-300 ',
    },
    switcher: {
        // Container
        'u-controls-switcher-container':
            'items-center flex-row-reverse justify-between gap-x-2 min-w-12 rounded-xl flex-auto p-3 bg-input border border-border/60 ',

        // Text
        'u-controls-switcher-text': 'text-card-foreground text-base flex-1 ',

        // Track
        'u-controls-switcher-track': 'rounded-full',
        'u-controls-switcher-track-base': 'w-12 p-0.5 ',
        'u-controls-switcher-track-sm': 'w-10  p-0.5',

        // Thumb
        'u-controls-switcher-thumb':
            'rounded-full  bg-white web:transition-transform web:duration-200',
        'u-controls-switcher-thumb-base': 'h-5 w-7 shadow-xs',
        'u-controls-switcher-thumb-sm': 'h-3 w-3  shadow-xs',

        // Active Thumb Position
        'u-controls-switcher-thumb-active-base': 'translate-x-4',
        'u-controls-switcher-thumb-active-sm': 'translate-x-3',

        // Track Colors
        'u-controls-switcher-track-col':
            ' bg-muted',
        'u-controls-switcher-track-active-col': 'bg-primary',
    },
    checkbox: {
        // Container
        'u-controls-checkbox-container':
            'items-center px-3 h-10 rounded-lg w-full gap-1.5',

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
            'h-5 w-5 rounded border-2 border-muted-foreground bg-transparent justify-center items-center ',

        // Radiobutton circular indicator
        'u-controls-radiobutton-indicator':
            'h-5 w-5 m-1 rounded-full border-2 border-guide bg-transparent justify-center items-center ',

        // Active mark inside checkbox (filled square)
        'u-controls-checkbox-indicator-active':
            'h-2.5 w-2.5 bg-primary m-1 items-center justify-center',

        // Active mark inside radiobutton (filled circle)
        'u-controls-radiobutton-indicator-active':
            'h-2.5 w-2.5 rounded-full bg-primary m-1 items-center justify-center',
    },

}