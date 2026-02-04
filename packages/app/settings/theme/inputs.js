

export const settingsInputs = {
    dropdown: {
        cnt: ' rounded-2xl overflow-hidden shadow-xl border border-border p-2 bg-popover web:bg-popover/90 backdrop-blur-xl z-50  ',
    },
    checkbox_set: {
        container: ' gap-x-2 rounded-xl border border-border/60 p-1.5',
    },
    
    doublerange: {
        container: 'w-full items-center justify-between mt-2',
        value_container:
            'w-36 bg-input border border-border/60 py-2 px-4 text-center rounded-lg justify-between',
        text_value: 'text-neutral-700 dark:text-neutral-300',
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
        default: ' file:text-foreground text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-input border border-border/70 focus-visible:bg-card leading-5 focus-visible:border-ring focus-visible:outline-accent rounded-xl px-3 min-h-12 flex-auto text-base placeholder-muted-foreground text-foreground  web:duration-200 overflow-hidden',
       
        multi: 'file:text-foreground text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-input border border-border/70 focus-visible:bg-card leading-5 focus-visible:border-ring focus-visible:outline-accent rounded-xl px-3 py-2 min-h-12 flex-auto text-base placeholder-muted-foreground text-foreground  web:duration-200 overflow-hidden focus-visible:overflow-visible',
        rounded:
            ' border border-border/60 focus:border-border web:border-0 web:ring-1 web:ring-inset web:ring-border/80 rounded-full web:focus:bg-card px-3 min-h-12 flex-auto  text-base leading-6 overflow-hidden placeholder:text-muted-foreground text-card-foreground web:duration-300 ',
        roundedsmall:
            ' rounded-full border/50 focus:border-border web:border-0 web:ring-1 web:ring-inset web:ring-border/80 px-2 min-h-10 flex-auto  text-base leading-5 overflow-hidden placeholder:text-muted-foreground text-card-foreground web:duration-300 ',
        small: ' border border-border/60 web:border-0 web:ring-1 web:ring-inset web:ring-border/80 rounded-lg web:focus:bg-card px-2 min-h-10 flex-auto  text-base leading-6 overflow-hidden placeholder:text-muted-foreground text-card-foreground web:duration-300 ',
        select: ' pr-10 border border-border/60 web:border-0 web:ring-1 web:ring-inset web:ring-border/80 rounded-xl bg-input web:focus:bg-card px-3 min-h-12 flex-auto  text-base leading-6 overflow-hidden placeholder:text-muted-foreground text-card-foreground web:duration-300 ',
    },
    switcher: {
        // Container
        'u-controls-switcher-container':
            'items-center flex-row-reverse justify-between gap-x-2 min-w-12 rounded-xl flex-auto p-2 bg-input border border-border/60 web:border-0 web:ring-1 web:ring-inset web:ring-border/80 ',

        // Text
        'u-controls-switcher-text': 'text-card-foreground text-base px-1 flex-1 ',

        // Track
        'u-controls-switcher-track': 'rounded-full',
        'u-controls-switcher-track-base': 'w-16 p-1 ',
        'u-controls-switcher-track-sm': 'w-12 h-6 p-0.5',

        // Thumb
        'u-controls-switcher-thumb':
            'rounded-full  bg-white web:transition-transform web:duration-200',
        'u-controls-switcher-thumb-base': 'h-6 w-8 shadow-xs',
        'u-controls-switcher-thumb-sm': 'h-3 w-3',

        // Active Thumb Position
        'u-controls-switcher-thumb-active-base': 'translate-x-6',
        'u-controls-switcher-thumb-active-sm': 'translate-x-6',

        // Track Colors
        'u-controls-switcher-track-col':
            'bg-muted',
        'u-controls-switcher-track-active-col': 'bg-primary',
    },
    checkbox: {
        // Container
        'u-controls-checkbox-container':
            'items-center px-1.5 py-1  rounded-lg w-full',

        // Hover & Active backgrounds (optional — Web-only)
        'u-controls-checkbox-container-bg':
            'web:active:bg-neutral-200 web:dark:active:bg-neutral-700 web:hover:bg-neutral-100 web:dark:hover:bg-neutral-800',

        // Text labels
        'u-controls-checkbox-text':
            'text-neutral-800 dark:text-neutral-200 text-base leading-5 font-semibold',
        'u-controls-checkbox-text2':
            'text-neutral-600 dark:text-neutral-400 text-sm leading-5',

        // Icon (e.g. if checkbox is custom-rendered)
        'u-controls-checkbox-icon':
            'text-neutral-600 dark:text-neutral-400 my-auto h-6 w-6',

        // Checkbox square indicator
        'u-controls-checkbox-indicator':
            'h-5 w-5 m-1 rounded-sm border-2 border-neutral-500 bg-transparent justify-center items-center mr-2',

        // Radiobutton circular indicator
        'u-controls-radiobutton-indicator':
            'h-5 w-5 m-1 rounded-full border-2 border-neutral-500 bg-transparent justify-center items-center mr-2',

        // Active mark inside checkbox (filled square)
        'u-controls-checkbox-indicator-active':
            'h-2.5 w-2.5 bg-primary m-1 items-center justify-center',

        // Active mark inside radiobutton (filled circle)
        'u-controls-radiobutton-indicator-active':
            'h-2.5 w-2.5 rounded-full bg-primary m-1 items-center justify-center',
    },

}