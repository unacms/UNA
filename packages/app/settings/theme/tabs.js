

export const settingsTabs = {
    tabs: {
        // Container
        'u-controls-tabs-container': 'w-full flex-col ',

        // Atoms: scrollable tab list (single header row)
        'u-controls-tabs-header':
            'relative flex flex-1 flex-row flex-nowrap overflow-x-auto bg-default overflow-y-hidden web:scrollbar-none ',

        // Shared structural class for scrollbar hiding (molecules variant rows include this)
        'u-controls-tabs-header-row':
            'relative flex flex-1 flex-row flex-nowrap overflow-x-auto bg-transparent overflow-y-hidden web:scrollbar-none',

        // Header item base (shared)
        'u-controls-tabs-header-item':
            'inline-flex flex-auto justify-center items-center whitespace-nowrap font-medium truncate web:disabled:pointer-events-none web:disabled:opacity-50 ',

        // Atoms TabsTrigger: static active surface (no animated pill)
        'u-controls-tabs-header-item-active':
            ' bg-segment web:shadow-sm web:duration-300 ',

        'u-controls-tabs-header-item-inactive':
            ' web:group web:hover:bg-muted web:duration-500',

        // Header item text
        'u-controls-tabs-header-item-text':
            'text-secondary-foreground web:group-hover:text-foreground font-medium ',
        'u-controls-tabs-header-item-text-active':
            'text-card-foreground font-medium ',

        // Tab content
        'u-controls-tabs-tab-content': 'w-full',
        'u-controls-tabs-tab-content-animated':
            'web:animate-[tabContentFadeIn_0.2s_ease-out]',

        // Animated selection layer (molecules) — duration/easing from tabs-selection-constants (native + web)
        'u-controls-tabs-selection-layer':
            'absolute pointer-events-none',
    },

    tabs_variants: {
        default: {
            track:
                'absolute inset-0 z-0 bg-default/60 pointer-events-none',
            row: '',
            trigger_active: ' ',
            trigger_inactive:
                ' web:group web:hover:bg-muted web:duration-200',
            pill: ' bg-segment shadow-sm',
            line: '',
        },
        secondary: {
            track:
                'absolute inset-0 z-0 bg-transparent pointer-events-none',
            row: '',
            trigger_active: ' ',
            trigger_inactive:
                ' group web:hover:bg-muted/60 web:duration-200',
            pill: '',
            line: 'bg-ring',
        },
    },

    // Sizes: layout + corner radii (track / row / pill). Use `rounded` prop on Tabs for rounded-full.
    tabs_sizes: {
        default_size: 'md',
        sm: {
            header: 'p-1 gap-1',
            /** px — matches horizontal list padding; scroll-into-view uses this so tabs don’t sit flush on the viewport edge */
            scroll_inset: 4,
            gap_px: 4,
            track: 'rounded-xl',
            row: 'rounded-xl',
            item: ' h-9 px-3 text-sm web:focus-visible:outline-2  ',
            pill: 'rounded-lg overflow-hidden',
            indicator_pad: ' px-3 ',
            indicator_inner: 'rounded-full h-0.5 mt-1 ',
            text: ' text-sm whitespace-nowrap  ',
            text_active: ' text-sm whitespace-nowrap  ',
        },
        md: {
            header: ' p-1.5 gap-1',
            scroll_inset: 6,
            gap_px: 4,
            track: 'rounded-xl',
            row: 'rounded-xl',
            item: ' h-10 px-4 text-base web:focus-visible:outline-2 ',
            pill: 'rounded-lg overflow-hidden',
            indicator_pad: ' px-4   ',
            indicator_inner: 'rounded-full h-[3px] mt-1.5 ',
            text: ' text-base ',
            text_active: ' text-base ',
        },
        lg: {
            header: ' p-2 gap-1 ',
            scroll_inset: 8,
            gap_px: 4,
            track: 'rounded-2xl',
            row: 'rounded-2xl',
            item: ' h-12 px-6 text-lg  web:focus-visible:outline-2',
            pill: 'rounded-xl overflow-hidden',
            indicator_pad: ' px-6 ',
            indicator_inner: 'rounded-full h-1 mt-2',
            text: ' text-lg ',
            text_active: ' text-lg ',
        },
    },

}
