

export const settingsTabs = {
    tabs: {
        // Container
        'u-controls-tabs-container': 'w-full flex-col ',

        // Header (use with inline styles or Tailwind plugin for scroll)
        'u-controls-tabs-header':
            'relative flex flex-1 flex-row flex-nowrap overflow-x-auto bg-muted/40 border border-border/60 rounded-xl overflow-y-hidden  web:scrollbar-none ',
        'u-controls-tabs-header-full-width':
            'relative w-full flex flex-1 flex-row flex-nowrap overflow-x-auto overflow-hidden bg-muted/40 border border-muted rounded-xl web:scrollbar-none ',

        // Header item base (shared styles without hover)
        'u-controls-tabs-header-item':
            'inline-flex flex-auto justify-center items-center whitespace-nowrap font-medium truncate disabled:pointer-events-none disabled:opacity-50 ',

        // Inactive tab (with hover effect)
        'u-controls-tabs-header-item-inactive': ' web:group web:hover:bg-muted web:duration-500',

        // Active tab (no hover effect)
        'u-controls-tabs-header-item-active':
            ' bg-popover shadow-sm web:duration-300 ',

        // Header item text
        'u-controls-tabs-header-item-text':
            'text-muted-foreground web:group-hover:text-card-foreground font-medium ',
        'u-controls-tabs-header-item-text-active':
            'text-card-foreground font-medium ',

        // Tab content
        'u-controls-tabs-tab-content': 'w-full',
        'u-controls-tabs-tab-content-animated':
            'web:animate-[tabContentFadeIn_0.2s_ease-out]',

        // Active indicator (absolute element matching active header item width)
        'u-controls-tabs-header-item-active-indicator':
            'absolute pointer-events-none web:transition-[left,width] web:duration-200 web:ease-out ',
        
        'u-controls-tabs-header-item-active-indicator-inner':
            ' h-px -bottom-px bg-ring/50 rounded-full  ',
    },
    tabs_sizes: {
        default_size: 'md',
        sm: {
            header: 'p-1 gap-1',
            item: ' h-8 px-2.5 text-sm rounded-lg web:focus-visible:outline-2  ',
            indicator: ' h-0.5 bottom-0 px-2 ',
            indicator_inner: ' rounded-full ',
            text: ' text-sm whitespace-nowrap  ',
            text_active: ' text-sm whitespace-nowrap  ',
        },
        md: {
            header: ' p-1 gap-1',
            item: ' h-10 px-4 lg:px-6 text-base rounded-lg web:focus-visible:outline-2 ',
            indicator: ' h-0.5 bottom-0  px-3',
            text: ' text-base ',
            text_active: ' text-base ',
        },
        lg: {
            header: ' p-1 gap-1.5 ',
            item: ' h-12 px-4 text-lg rounded-lg  web:focus-visible:outline-2',
            indicator: ' h-0.5 bottom-0  px-4 ',
            text: ' text-lg ',
            text_active: ' text-lg ',
        },
    },

}