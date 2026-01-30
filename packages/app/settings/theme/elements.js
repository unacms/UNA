

export const settingsElements = {
    conductor: {
        menu: ' w-full items-left justify-center ',
        menu_max_width: ' w-full max-w-7xl ',
        content_max_width: ' w-full max-w-7xl ',
        content_max_width_nav: ' w-full max-w-screen-2xl xl:border-x-0 xl:border-guide/20 border-dashed  ',
        menu_is_dynamic: false,
        menu_cnt: ' flex-row flex-none gap-1 px-2 h-14 items-center overflow-x-auto ',
        menu_categ_indent: ' pl-12 ',
        topmenu_cnt:
            'w-full px-8 pt-6 items-stretch justify-stretch sticky z-50 t-8 gap-x-8 hidden lg:flex p',
        topmenu_button_variant: 'secondary',
        topmenu_button_variant_active: 'secondary',
        topmenu_button_align: 'start',
        topmenu_button_fullWidth: false,
        topmenu_button_size: 'base',
        topmenu_button_pressed: true,
        left_menu_cnt: '  ',
        cover_base: 'w-full bg-card/70 backdrop-blur-xl',
        cover_content:
            'items-center h-full w-full overflow-hidden justify-between',
        cover_small: 'max-w-7xl mx-auto flex-row w-full px-3 items-center '
    },
    dropdown_menu: {
        content_shadow: ' shadow-lg ',
        content_ver: '',
        content_hor: 'flex-row  ',
        item_ver:
            ' px-2 py-1.5 web:group flex h-12 flex-row items-center rounded-lg font-medium web:hover:bg-muted/60 text-card-foreground web:hover:text-foreground web:hover:cursor-pointer',
        item_hor:
            'flex block web:dark:hover:text-white rounded-full web:hover:cursor-pointer text-neutral-700    web:duration-200 dark:text-neutral-300 outline-none ',
        item_np:
            'flex flex-row web:focus:outline-none items-center justify-between px-1 py-0.5 rounded-lg font-medium web:hover:bg-bgritem web:dark:hover:bg-bgritem-d text-sm text-neutral-700 dark:text-neutral-300 web:dark:hover:text-white web:hover:cursor-pointer',
        item_cnt: 'items-center w-full flex-row',
        item_text: ' text-sm font-medium text-card-foreground px-2',
        item_icon:
            'flex items-center w-9 h-9 bg-secondary/80 web:group-hover:bg-secondary rounded-full justify-center',
        icon_size: 20, // Default icon size for dropdown menu icons
    },
    modal: {
        fog: 'bg-background/80  ',
        container:
        '  shadow-xl bg-card/80 backdrop-blur border border-border sm:rounded-2xl overflow-hidden ',
        content: '',
        header: ' p-3 items-start justify-start border-b border-border/60',
    },
    cards: {
        'u-card-list':
            ' u-card-list bg-card/70 web:shadow-border text-card-foreground overflow-hidden sm:rounded-xl ',
        'u-card-list-padding': ' p-3 lg:p-4 ',
        'u-card-base':
            ' u-card-base bg-card/70 web:shadow-border text-card-foreground overflow-hidden rounded-2xl',
        'u-card-padding': ' p-4 ',
        'u-card-header': 'flex gap-1',
        'u-card-icon': 'text-card-foreground px-4 gap-2',
        'u-card-title':
            ' text-foreground leading-none text-xl font-semibold leading-none tracking-tight',
        'u-card-description': ' text-secondary-foreground text-sm lg:text-base text-balance',
        'u-card-content': 'text-card-foreground ',
        'u-card-footer': 'bg-background/40 border-t border-card p-4 flex text-base text-card-foreground gap-2',
    },
    panels: {
        'u-panel-base': ' h-full flex-col ',
        'u-panel-handler': 'relative w-0 web:before:absolute web:before:inset-y-0 web:before:-left-0.5 web:before:-right-0.5 web:before:bg-transparent web:before:hover:bg-accent web:before:active:bg-accent/50 web:before:duration-200 ',
        'u-panel-line':
            'absolute w-px h-full bg-border/0 web:group-hover:bg-primary/50 active:bg-primary/50 rounded-full left-1/2 top-0 -translate-x-1/2',
        'u-panel-group': ' h-full flex',
    },
    blocks: {
        'u-block-base':
            'u-max-width-block sm:rounded-xl ',
        'u-block-bg':
            'bg-card/80 web:shadow-border text-card-foreground overflow-hidden ',
        'u-block-pad':
            'p-2 @xl/block:p-2',
        'u-block-header':
            ' flex-row items-center gap-2 py-1.5 px-2 ',
        'u-block-icon': 'text-card-foreground',
        'u-block-name': 'flex flex-col flex-auto gap-y-2 gap-x-4 ',
        'u-block-title':
            'text-muted-foreground leading-none text-base font-semibold tracking-tight',
        'u-block-description': 'text-muted-foreground text-sm font-medium leading-6',
        'u-block-content': 'text-card-foreground  ',  
        'u-block-footer':
            'flex text-card-foreground gap-4 ',
        'u-block-actions':
            'flex flex-row text-card-foreground mb-auto gap-2 ',
    },
   
    tables: {
        // Base
        'u-table-base':
            'w-full border border-border bg-transparent border-collapse overflow-hidden rounded-lg',
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
        'tooltip-arrow-bottom': '-top-1.5 left-1/2 -translate-x-1/2',   // tooltip below trigger
        'tooltip-arrow-top': '-bottom-1.5 left-1/2 -translate-x-1/2',   // tooltip above trigger
        'tooltip-arrow-left': '-right-1.5 top-1/2 -translate-y-1/2',    // tooltip left of trigger
        'tooltip-arrow-right': '-left-1.5 top-1/2 -translate-y-1/2',    // tooltip right of trigger
    }, 
}