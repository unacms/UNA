

export const settingsElements = {
    conductor: {
        menu: ' w-full items-left justify-center ',
        menu_max_width: ' w-full max-w-7xl px-3 lg:px-4 mx-auto',
        
        content_max_width: ' w-full max-w-7xl mx-auto ',
        content_max_width_nav: ' w-full max-w-screen-2xl  ',
        menu_is_dynamic: false,
        menu_cnt: ' flex-row flex-none gap-1 h-14 items-center overflow-x-auto ',
        menu_categ_indent: ' pl-8 ',
        topmenu_cnt:
            'w-full px-8 pt-6 items-stretch justify-stretch sticky z-50 t-8 gap-x-8 hidden lg:flex p',
        topmenu_button_variant: 'secondary',
        topmenu_button_variant_active: 'secondary',
        topmenu_button_align: 'start',
        topmenu_button_fullWidth: false,
        topmenu_button_size: 'base',
        topmenu_button_pressed: true,
        left_menu_cnt: '  ',
        cover_base: 'w-full bg-card ',
        cover_content:
            'items-center h-full w-full justify-between',
        cover_small: 'max-w-7xl mx-auto flex-row w-full items-center ',
        hide_top_menu_from: 'xl',
    },
    dropdown_menu: {
        content_shadow: ' shadow-lg ',
        content_ver: '',
        content_hor: 'flex-row  ',
        item_ver:
            ' web:group px-2 py-1.5 web:group flex h-12 flex-row items-center rounded-lg font-medium web:hover:bg-muted/60 text-card-foreground web:hover:text-foreground web:hover:cursor-pointer ',
        item_hor:
            'flex block web:dark:hover:text-white rounded-full web:hover:cursor-pointer text-muted-foreground web:duration-200 outline-none ',
        item_np:
            'flex flex-row web:focus:outline-none items-center justify-between px-1 py-0.5 rounded-lg font-medium text-sm text-muted-foreground  web:hover:cursor-pointer',
        /** Tabs overflow menu — match tab strip item height, padding, hover; text aligned in dropdown-item via item_text_key */
        item_tabs_overflow_sm:
            'group flex w-full min-h-9 h-9 px-3 flex-row items-center rounded-lg font-medium text-secondary-foreground web:hover:bg-muted/60 web:duration-200 web:hover:text-foreground web:cursor-pointer web:focus-visible:outline-2',
        item_tabs_overflow_md:
            'group flex w-full min-h-10 h-10 px-4 flex-row items-center rounded-lg font-medium text-base text-secondary-foreground web:hover:bg-muted/60 web:duration-200 web:hover:text-foreground web:cursor-pointer web:focus-visible:outline-2',
        item_tabs_overflow_lg:
            'group flex w-full min-h-12 h-12 px-6 flex-row items-center rounded-lg font-medium text-lg text-secondary-foreground web:hover:bg-muted/60 web:duration-200 web:hover:text-foreground web:cursor-pointer web:focus-visible:outline-2',
        item_tabs_overflow_text_sm:
            'text-left text-sm font-medium text-secondary-foreground web:group-hover:text-foreground whitespace-nowrap',
        item_tabs_overflow_text_md:
            'text-left text-base font-medium text-secondary-foreground web:group-hover:text-foreground whitespace-nowrap',
        item_tabs_overflow_text_lg:
            'text-left text-lg font-medium text-secondary-foreground web:group-hover:text-foreground whitespace-nowrap',
        item_cnt: 'items-center w-full flex-row',
        item_cnt_tabs_overflow: 'items-center w-full flex-row justify-start flex-1',
        item_text: ' text-sm font-semibold text-secondary-foreground web:group-hover:text-foreground px-2',
        item_icon:
            'flex items-center w-9 h-9 bg-muted web:group-hover:bg-border rounded-full justify-center',
        icon_size: 20, // Default icon size for dropdown menu icons
    },
    modal: {
        fog: ' bg-background/95 ',
        container:
        ' bg-card backdrop-blur web:shadow-sm md:rounded-2xl overflow-hidden ',
        content: '',
        header: ' p-3 min-h-14 items-start justify-start border-b border-border/60',
    },
    cards: {
        'u-card-list': ' u-card-list bg-card shadow-card-outline dark:shadow-card-outline-deep sm:rounded-xl ',
        'u-card-list-padding': ' p-3 lg:p-4 ',
        'u-card-base': 'u-card-base bg-card text-card-foreground rounded-xl shadow-card-outline dark:shadow-card-outline-deep ',
        'u-card-padding': 'py-3 sm:py-4 ',
        'u-card-header': 'px-4',
        'u-card-icon': ' ',
        'u-card-title': 'font-semibold text-base tracking-tight text-secondary-foreground',
        'u-card-description': 'text-muted-foreground text-sm sm:text-base text-balance',
        'u-card-actions': ' ',
        'u-card-content': 'px-3 sm:px-4 ',
        'u-card-footer': 'px-4 gap-1',
    },
    panels: {
        'u-panel-base': ' h-full flex-col ',
        'u-panel-handler': 'relative w-0 web:before:absolute web:before:inset-y-0 web:before:-left-0.5 web:before:-right-0.5 web:before:bg-transparent web:before:hover:bg-accent web:before:active:bg-accent/50 web:before:duration-200 ',
        'u-panel-line':
            'absolute w-px h-full bg-border/0 web:group-hover:bg-primary/50 active:bg-primary/50 rounded-full left-1/2 top-0 -translate-x-1/2',
        'u-panel-group': ' h-full flex ',
    },
    blocks: {
        'u-block-base':
            ' text-card-foreground gap-3 sm:gap-4',
        'u-block-bg':
            ' bg-card/80 shadow-card-outline dark:shadow-card-outline-deep ',
        'u-block-pad':
            ' p-3 sm:p-4 sm:rounded-2xl',
        'u-block-header':
            ' flex-row items-center gap-3 justify-center ',
        'u-block-icon': ' items-center justify-center h-11 w-11 bg-muted/60 rounded-xl text-card-foreground flex-none',
        'u-block-name': ' flex-auto ',
        'u-block-title':
            'text-card-foreground leading-6 text-lg font-bold tracking-tight',
        'u-block-description': 'text-muted-foreground text-sm font-medium leading-5',
        'u-block-content': 'gap-4 ',  
        'u-block-footer':
            'flex text-card-foreground gap-4 pt-2',
        'u-block-actions':
            'flex flex-row text-card-foreground gap-2 mb-auto ',
        'u-block-animate':
            'animate-in fade-in slide-in-from-top-2 duration-200',
    },
   
    tables: {
        // Base
        'u-table-base':
            'w-full border border-border/60 bg-transparent border-collapse overflow-hidden rounded-lg',
        'u-table-header': 'border-border',
        'u-table-body': 'border-border',
        'u-table-footer': 'bg-muted/60 font-medium',
        'u-table-row':
            'flex overflow-hidden flex-row border-border border-b web:transition-colors web:hover:bg-muted/60 web:data-[state=selected]:bg-muted',
        'u-table-head':
            'text-muted-foreground text-left justify-center font-medium flex-1 h-12 px-4 text-sm',
        'u-table-cell':
            ' flex-row items-center text-foreground px-3 text-sm py-2',
        'u-table-head-text':
            'text-muted-foreground font-semibold tracking-tight leading-tight text-sm',
        'u-table-cell-text': 'text-foreground text-sm',
    },
    // Tooltip component styles and configuration
    tooltip: {            
        // Content container (no overflow-hidden to allow arrow to show)
        'tooltip-content': [
            'z-50 rounded-lg px-3 py-2',
            'bg-foreground shadow-lg',
        ].join(' '),
        
        // Text inside tooltip
        'tooltip-text': 'text-background text-sm font-medium',
        
        // Arrow base (rotated square approach - works with NativeWind)
        'tooltip-arrow': 'absolute w-3 h-3 bg-foreground rotate-45',
        
        // Arrow positions per placement
        'tooltip-arrow-bottom': '-top-1 left-1/2 -translate-x-1/2',   // tooltip below trigger
        'tooltip-arrow-top': '-bottom-1 left-1/2 -translate-x-1/2',   // tooltip above trigger
        'tooltip-arrow-left': '-right-1 top-1/2 -translate-y-1/2',    // tooltip left of trigger
        'tooltip-arrow-right': '-left-1 top-1/2 -translate-y-1/2',    // tooltip right of trigger
    }, 
}