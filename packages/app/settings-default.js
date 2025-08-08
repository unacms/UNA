            
            // Badge color mapping for data.color values
            color_mapping: {
                // Exact color names to Tailwind classes
                'emerald': 'bg-emerald-600/10 text-emerald-600',
                'emerald-600': 'bg-emerald-600/10 text-emerald-600',
                'purple': 'bg-purple-600/10 text-purple-600',
                'purple-600': 'bg-purple-600/10 text-purple-600',
                'Purple': 'bg-purple-600/10 text-purple-600', // Handle capitalization
                'red': 'bg-red-600/10 text-red-600',
                'red-600': 'bg-red-600/10 text-red-600',
                'blue': 'bg-blue-600/10 text-blue-600',
                'blue-600': 'bg-blue-600/10 text-blue-600',
                'green': 'bg-green-600/10 text-green-600',
                'green-600': 'bg-green-600/10 text-green-600',
                'yellow': 'bg-yellow-600/10 text-yellow-600',
                'yellow-600': 'bg-yellow-600/10 text-yellow-600',
                'orange': 'bg-orange-600/10 text-orange-600',
                'orange-600': 'bg-orange-600/10 text-orange-600',
                'teal': 'bg-teal-600/10 text-teal-600',
                'teal-600': 'bg-teal-600/10 text-teal-600',
                'sky': 'bg-sky-600/10 text-sky-600',
                'sky-600': 'bg-sky-600/10 text-sky-600',
                'indigo': 'bg-indigo-600/10 text-indigo-600',
                'indigo-600': 'bg-indigo-600/10 text-indigo-600',
                'pink': 'bg-pink-600/10 text-pink-600',
                'pink-600': 'bg-pink-600/10 text-pink-600',
                'rose': 'bg-rose-600/10 text-rose-600',
                'rose-600': 'bg-rose-600/10 text-rose-600',
                'gray': 'bg-gray-600/10 text-gray-600',
                'gray-600': 'bg-gray-600/10 text-gray-600',
                'slate': 'bg-slate-600/10 text-slate-600',
                'slate-600': 'bg-slate-600/10 text-slate-600',
                'zinc': 'bg-zinc-600/10 text-zinc-600',
                'zinc-600': 'bg-zinc-600/10 text-zinc-600',
                'neutral': 'bg-neutral-600/10 text-neutral-600',
                'neutral-600': 'bg-neutral-600/10 text-neutral-600',
                'stone': 'bg-stone-600/10 text-stone-600',
                'stone-600': 'bg-stone-600/10 text-stone-600',
                'amber': 'bg-amber-600/10 text-amber-600',
                'amber-600': 'bg-amber-600/10 text-amber-600',
                'lime': 'bg-lime-600/10 text-lime-600',
                'lime-600': 'bg-lime-600/10 text-lime-600',
                'cyan': 'bg-cyan-600/10 text-cyan-600',
                'cyan-600': 'bg-cyan-600/10 text-cyan-600',
                'violet': 'bg-violet-600/10 text-violet-600',
                'violet-600': 'bg-violet-600/10 text-violet-600',
                'fuchsia': 'bg-fuchsia-600/10 text-fuchsia-600',
                'fuchsia-600': 'bg-fuchsia-600/10 text-fuchsia-600',
            }
        },
        tables: {
            // Base
            'u-table-base': 'w-full border border-border bg-transparent border-collapse overflow-hidden rounded-lg',
            'u-table-header': 'border-border',
            'u-table-body': 'border-border',
            'u-table-footer': 'bg-muted/50 font-medium',
            'u-table-row': 'flex overflow-hidden flex-row border-border border-b web:transition-colors web:hover:bg-muted/50 web:data-[state=selected]:bg-muted',
            'u-table-head': 'text-muted-foreground text-left justify-center font-medium flex-1 h-12 px-4 text-sm',
            'u-table-cell': ' flex-row items-center text-foreground px-3 text-sm py-2',
            'u-table-head-text': 'text-muted-foreground font-semibold tracking-tight leading-tight text-sm',
            'u-table-cell-text': 'text-foreground text-sm',
        },
        tabs: {
            // Container
            'u-controls-tabs-container': 'w-full flex-col overflow-scroll',

            // Header (use with inline styles or Tailwind plugin for scroll)
            'u-controls-tabs-header': 'flex flex-1 flex-row flex-nowrap overflow-x-auto overflow-y-hidden gap-1 bg-muted p-0.5 mb-3 lg:mb-4 rounded-full web:scrollbar-none ',
            
            // Header item base (shared styles without hover)
            'u-controls-tabs-header-item': 'flex rounded-full px-3 py-2 text-sm flex-1 justify-center max-w-[100px]  items-center whitespace-nowrap font-medium ring-offset-muted  truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring  disabled:pointer-events-none disabled:opacity-50 ',

            // Inactive tab (with hover effect)
            'u-controls-tabs-header-item-inactive': ' web:hover:bg-muted',

            // Active tab (no hover effect)
            'u-controls-tabs-header-item-active': 'bg-card shadow-sm text-accent-foreground ',

            // Header item text
            'u-controls-tabs-header-item-text': 'text-muted-foreground font-medium whitespace-nowrap truncate',
            'u-controls-tabs-header-item-text-active': 'text-card-foreground font-medium whitespace-nowrap truncate',

            // Tab content
            'u-controls-tabs-tab-content': 'w-full',
            'u-controls-tabs-tab-content-animated': 'web:animate-[tabContentFadeIn_0.2s_ease-out]'
        },
        switcher: {
            // Container
            'u-controls-switcher-container': 'items-center flex-row-reverse justify-between gap-x-2 web:h-14 min-w-14 rounded-xl flex-auto p-3 bg-input border border-border ',

            // Text
            'u-controls-switcher-text': 'text-card-foreground text-base',

            // Track
            'u-controls-switcher-track': 'rounded-full',
            'u-controls-switcher-track-base': 'w-20 h-8 p-1',
            'u-controls-switcher-track-sm': 'w-10 h-4 p-0.5',

            // Thumb
            'u-controls-switcher-thumb': 'rounded-full  bg-white web:transition-transform web:duration-200',
            'u-controls-switcher-thumb-base': 'h-6 w-6',
            'u-controls-switcher-thumb-sm': 'h-3 w-3',

            // Active Thumb Position
            'u-controls-switcher-thumb-active-base': 'translate-x-12',
            'u-controls-switcher-thumb-active-sm': 'translate-x-6',

            // Track Colors
            'u-controls-switcher-track-col': 'bg-neutral-400 dark:bg-neutral-600',
            'u-controls-switcher-track-active-col': 'bg-primary'
        },
        checkbox: {
            // Container
            'u-controls-checkbox-container': 'items-center py-2 px-3 rounded-lg w-full',

            // Hover & Active backgrounds (optional — Web-only)
            'u-controls-checkbox-container-bg': 'web:active:bg-neutral-200 web:dark:active:bg-neutral-700 web:hover:bg-neutral-100 web:dark:hover:bg-neutral-800',

            // Text labels
            'u-controls-checkbox-text': 'text-neutral-800 dark:text-neutral-200 text-base leading-5 font-medium pl-2',
            'u-controls-checkbox-text2': 'text-neutral-600 dark:text-neutral-400 text-sm leading-5',

            // Icon (e.g. if checkbox is custom-rendered)
            'u-controls-checkbox-icon': 'text-neutral-600 dark:text-neutral-400 my-auto h-6 w-6',

            // Checkbox square indicator
            'u-controls-checkbox-indicator': 'h-5 w-5 m-1 rounded-sm border-2 border-neutral-500 bg-transparent justify-center items-center mr-2',

            // Radiobutton circular indicator
            'u-controls-radiobutton-indicator': 'h-5 w-5 m-1 rounded-full border-2 border-neutral-500 bg-transparent justify-center items-center mr-2',

            // Active mark inside checkbox (filled square)
            'u-controls-checkbox-indicator-active': 'h-2.5 w-2.5 bg-primary m-1 items-center justify-center',

            // Active mark inside radiobutton (filled circle)
            'u-controls-radiobutton-indicator-active': 'h-2.5 w-2.5 rounded-full bg-primary m-1 items-center justify-center'
        },

        button_styles: {
            'u-btn-default-cnt':
                '  bg-muted web:hover:bg-muted/50 ',
            'u-btn-default-text':
                ' font-medium text-card-foreground web:group-hover:text-foreground ',
            'u-btn-default-trans': '  web:duration-200',
            'u-btn-default-ring': ' web:group bg-border/60 web:duration-200 shadow-sm web:active:shadow-none web:active:bg-border ',


            'u-btn-primary-cnt': ' ',
            'u-btn-primary-text': ' font-medium text-primary-foreground ',
            'u-btn-primary-trans': ' web:duration-200',
            'u-btn-primary-ring': ' bg-primary web:hover:bg-primary/90 web:duration-200 shadow-sm web:active:shadow-none web:active:opacity-50  ',

            'u-btn-accent-cnt':
                ' bg-accent bg-accent web:active:ring-2 web:active:ring-accent web:active:ring-offset-2 web:active:outline-none ',
            'u-btn-accent-text':
                ' font-medium text-white ',
            'u-btn-accent-trans': '  web:duration-200',
            'u-btn-accent-ring': ' bg-accent ',

            'u-btn-secondary-cnt':
                '   ',
            'u-btn-secondary-text':
                ' font-medium text-card-foreground web:group-hover:text-foreground  ',
            'u-btn-secondary-trans': ' web:duration-200 ',
            'u-btn-secondary-ring': ' web:group web:duration-200 bg-secondary/60 web:hover:bg-secondary web:active:opacity-50 ',
            
            'u-btn-danger-cnt':
                '  dark:border-transparent bg-red-600 web:hover:bg-red-500 web:hover:shadow web:active:opacity-50 web:active:shadow-none',
            'u-btn-danger-text':
                'font-medium text-danger-foreground',
            'u-btn-danger-trans': '  web:duration-200',
            'u-btn-danger-ring': ' web:group web:duration-200 bg-danger ',

            'u-btn-text-cnt': '  ',
            'u-btn-text-text': ' font-medium text-card-foreground web:group-hover:text-foreground',
            'u-btn-text-trans': '  web:duration-200',
            'u-btn-text-ring': ' web:group web:duration-200 bg-transparent web:hover:bg-secondary/60 web:active:opacity-50 ',


            'u-btn-link-cnt': '  ',
            'u-btn-link-text': ' font-medium text-primary web:group-hover:text-primary/90 ',
            'u-btn-link-trans': ' web:duration-200 ',
            'u-btn-link-ring': ' web:group web:duration-200 bg-transparent web:hover:bg-primary/10 ',

            'u-btn-outline-cnt': ' bg-card ',
            'u-btn-outline-text':' font-medium text-card-foreground web:group-hover:text-foreground ',
            'u-btn-outline-trans': '  web:duration-200',
            'u-btn-outline-ring': ' web:group web:duration-200 bg-border/60 web:hover:bg-border web:active:opacity-50 ',

            'u-btn-group-item-cnt':
                '  bg-muted web:hover:bg-muted/50 ',
            'u-btn-group-item-text':
                ' font-medium text-card-foreground web:group-hover:text-foreground ',
            'u-btn-group-item-icon':
                ' text-card-foreground web:group-hover:text-foreground ',
            'u-btn-group-item-ring': ' web:group bg-border/60 web:duration-200 shadow-sm web:active:shadow-none web:active:bg-border ',

            'u-btn-group-item-default-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
            'u-btn-group-item-default-text': 'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-default-icon': 'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-default-ring': ' bg-border ',

            'u-btn-group-item-primary-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
            'u-btn-group-item-primary-text':
                'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-primary-icon':
                'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-primary-ring': ' bg-primary ',

            'u-btn-group-item-secondary-cnt':
                'border border-transparent dark:border-transparent bg-bgritem dark:bg-bgritem-d web:ctive:opacity-50 flex flex-row overflow-hidden',
            'u-btn-group-item-secondary-text':
                'font-medium text-neutral-800 web:hover:text-neutral-950 dark:text-neutral-200 web:dark:group-hover:text-white',
            'u-btn-group-item-secondary-icon':
                'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-secondary-ring': ' bg-secondary ',

            'u-btn-group-item-text-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgrbutton-h dark:web:hover:bg-bgrbutton-dh web:active:opacity-50',
            'u-btn-group-item-text-text':
                'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-text-icon':           
                'text-neutral-600 dark:text-neutral-400 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-text-ring': ' bg-transparent ',

            'u-btn-group-item-link-cnt': '',
            'u-btn-group-item-link-text':
                'font-medium text-muted-foreground web:hover:text-foreground web:active:text-foreground  ',
            'u-btn-group-item-link-icon':
                'text-primary dark:text-primary web:dark:group-hover:text-primary',
            'u-btn-group-item-link-ring': ' bg-transparent ',
            'u-btn-group-item-link-pressed-cnt': 'bg-primary/10 ',
            'u-btn-group-item-link-pressed-text':
                'text-primary',
            'u-btn-group-item-link-pressed-icon':
                'text-primary',
            'u-btn-group-item-link-pressed-ring': 'bg-primary/10',

            'u-btn-group-item-outline-cnt':
                'border border-bdritem dark:border-bdritem-d web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
            'u-btn-group-item-outline-text':
                'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-outline-icon':
                'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-outline-ring': ' bg-transparent ',

            'u-btn-group-item-accent-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
            'u-btn-group-item-accent-text':
                'font-medium text-neutral-800 dark:text-neutral-200 dark:group-hover:text-neutral-50',
            'u-btn-group-item-accent-icon':
                'text-neutral-700 dark:text-neutral-300 dark:group-hover:text-neutral-50',
                'u-btn-group-item-accent-ring': ' bg-accent ',

            

            'u-btn-label-cnt':
                'border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 web:hover:bg-neutral-100 dark:web:hover:bg-neutral-800 web:active:opacity-70',
            'u-btn-label-text':
                'font-normal text-sm text-neutral-600 dark:text-neutral-400 web:hover:text-neutral-800 dark:web:hover:text-neutral-200',
            'u-btn-label-trans': '  web:duration-200',
            'u-btn-label-ring': ' bg-transparent ',
        },
        buttons_group_styles: {
            'u-btn-default-cnt':
                'border border-bdrbutton dark:border-bdrbutton-d bg-bgrbutton dark:bg-bgrbutton-d flex flex-row',
            'u-btn-default-ring': ' p-[1px] bg-border ',
            'u-btn-accent-cnt':
                'border border-emerald-600 dark:border-emerald-500 bg-emerald-100 dark:bg-emerald-900 flex flex-row',
            'u-btn-accent-ring': ' p-[1px] bg-accent ',
            'u-btn-outline-cnt':
                'border border-bdrbutton dark:border-bdrbutton-d flex flex-row',
            'u-btn-outline-ring': ' p-[1px] bg-border ',

            'u-btn-text-cnt': 'flex flex-row items-center web:active:opacity-50',
            'u-btn-text-ring': ' p-[1px] bg-transparent ',

            'u-btn-secondary-cnt':
                'border border-transparent dark:border-transparent bg-bgritem dark:bg-bgritem-d web:active:opacity-50 flex flex-row',
            'u-btn-secondary-text':
                ' font-medium text-neutral-800 web:hover:text-neutral-950 dark:text-neutral-200 web:dark:group-hover:text-white ',
            'u-btn-secondary-trans': '   web:duration-300 ',
            'u-btn-secondary-ring': ' p-[1px] bg-secondary ',

            'u-btn-link-cnt': ' border border-transparent dark:border-transparent flex flex-row active:opacity-50 items-center ',
            'u-btn-link-text':
                ' font-medium web:group-hover:underline text-card-foreground  web:hover:text-neutral-950 web:dark:hover:text-neutral-50 web:active:opacity-50 ',
            'u-btn-link-trans': '   web:duration-300 ',
            'u-btn-link-ring': ' p-[1px] bg-transparent ',

            

            'u-btn-label-cnt': 'border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex flex-row web:active:opacity-70',
            'u-btn-label-text':
                ' font-normal text-sm text-neutral-600 dark:text-neutral-400 web:hover:text-neutral-800 web:dark:hover:text-neutral-200 ',
            'u-btn-label-trans': '   web:duration-200 ',
            'u-btn-label-ring': ' p-[1px] bg-transparent ',
        },
    },
}
