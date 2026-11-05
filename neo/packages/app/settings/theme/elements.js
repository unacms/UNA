
/**
 * Menu item sizes, the NeoButton heights (`neo_button.controlSizes`): mini 28, small 36, regular 44, large 52,
 * xlarge 64. A row is 8px from the popup's sides (`px-2`, 10px at xlarge); its icon circle fills the row less the
 * vertical padding (44 − 2 × 6 = 32 at regular, 52 − 2 × 8 = 36 at large) and its glyph is the button's icon size
 * one step down. The corners are the button's (`borderShapes.roundedRectangle`). Small and mini rows are meant for
 * text and inline icons more than circles, but the circle still fits.
 */
const MENU_ITEM_SIZES = {
    mini:    { item: 'min-h-7 px-1.5 py-0.5 rounded-md',  icon: 'w-6 h-6',   icon_size: 14, text: 'text-xs' },
    small:   { item: 'min-h-9 px-2 py-1 rounded-lg',      icon: 'w-7 h-7',   icon_size: 16, text: 'text-sm' },
    regular: { item: 'min-h-11 px-2 py-1.5 rounded-xl',   icon: 'w-8 h-8',   icon_size: 20, text: 'text-sm' },
    large:   { item: 'min-h-13 px-2 py-2 rounded-xl',     icon: 'w-9 h-9',   icon_size: 24, text: 'text-base' },
    xlarge:  { item: 'min-h-16 px-2.5 py-2.5 rounded-2xl', icon: 'w-11 h-11', icon_size: 28, text: 'text-base' },
};

// The parts of a row that don't change with its size. `item_ver`, `item_icon`, `item_text` and friends below are
// these plus the regular size, so code that reads them directly (feed, tasks, dashboard stats) keeps 44px rows.
const MENU_ITEM_BASE = 'group flex w-full min-w-0 flex-row items-center font-medium web:hover:bg-muted/80 text-card-foreground web:hover:text-foreground web:hover:cursor-pointer';
const MENU_ICON_BASE = 'flex shrink-0 items-center bg-muted/50 web:group-hover:bg-border rounded-full justify-center web:transition-colors web:duration-150 web:ease-out';
const MENU_ICON_ACTIVE_BASE = 'flex shrink-0 items-center bg-primary rounded-full justify-center';
const MENU_TEXT_BASE = 'block w-full font-semibold text-secondary-foreground web:group-hover:text-foreground px-2 web:transition-colors web:duration-150 web:ease-out';
const MENU_TEXT_SELECTED_BASE = 'block w-full font-semibold text-accent-foreground px-2 web:transition-colors web:duration-150 web:ease-out';

export const settingsElements = {
    conductor: {
        menu: ' w-full items-left justify-center',
        menu_is_dynamic: false,
        // Padding lives on the scroll *content* (w-max), not the overflow parent —
        // otherwise tabs clip at the inset instead of scrolling edge-to-edge.
        // Below lg: a 52px row (8px above and below the pills) plus mb-0.5,
        // 10px from the pills to the end of the header band.
        menu_cnt: ' flex-row flex-none w-max gap-2 min-h-13 lg:min-h-14 mb-0.5 lg:mb-0 items-center px-4 ',
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
        cover_base: 'ns--cover-base- w-full bg-card-surface ne--',
        cover_content:
            'ns--conductor-cover-content-- items-center h-full w-full justify-between lg:p-4 ne--',
        cover_small: 'mx-auto flex-row items-center ',

        // Where the left column takes over the tab row and the section title (a breakpoint
        // prefix). Keep it equal to the left column's `breakpoint` in `layouts.cols-l-c` and
        // `layouts.cols-l-c-r`, or a width range shows the tabs in neither place.
        hide_top_menu_from: 'lg',
        // Section title + icon next to conductor tabs (TopSidebar).
        show_title: true,
        standalone_context_selector: 'items-center justify-center w-full h-14 px-2',
    },
    dropdown_menu: {
        content_shadow: ' shadow-lg ',
        content_ver: 'flex-col gap-1',
        content_hor: 'flex-row  ',
        item_ver: `${MENU_ITEM_BASE} ${MENU_ITEM_SIZES.regular.item}`,
        item_hor:
            'flex block web:dark:hover:text-white rounded-full web:hover:cursor-pointer text-muted-foreground web:duration-200 outline-none ',
        item_np:
            'flex flex-row web:focus:outline-none items-center justify-between px-1 py-0.5 rounded-lg font-medium text-sm text-muted-foreground  web:hover:cursor-pointer',
        /** Tabs overflow menu — match tab strip item height, padding, hover; text aligned in dropdown-item via item_text_key */
        item_tabs_overflow_sm:
            'group flex w-full min-h-9 h-9 px-3 flex-row items-center rounded-lg font-medium text-secondary-foreground web:hover:bg-muted/80 web:duration-200 web:hover:text-foreground web:cursor-pointer web:focus-visible:outline-2',
        item_tabs_overflow_md:
            'group flex w-full min-h-10 h-10 px-4 flex-row items-center rounded-lg font-medium text-base text-secondary-foreground web:hover:bg-muted/80 web:duration-200 web:hover:text-foreground web:cursor-pointer web:focus-visible:outline-2',
        item_tabs_overflow_lg:
            'group flex w-full min-h-12 h-12 px-6 flex-row items-center rounded-lg font-medium text-lg text-secondary-foreground web:hover:bg-muted/80 web:duration-200 web:hover:text-foreground web:cursor-pointer web:focus-visible:outline-2',
        item_tabs_overflow_text_sm:
            'text-left text-sm font-medium text-secondary-foreground web:group-hover:text-foreground whitespace-nowrap',
        item_tabs_overflow_text_md:
            'text-left text-base font-medium text-secondary-foreground web:group-hover:text-foreground whitespace-nowrap',
        item_tabs_overflow_text_lg:
            'text-left text-lg font-medium text-secondary-foreground web:group-hover:text-foreground whitespace-nowrap',
        item_cnt: 'items-center w-full min-w-0 flex-row',
        item_text_cnt: 'min-w-0 flex-1 flex flex-col self-center justify-center overflow-hidden',
        item_cnt_tabs_overflow: 'items-center w-full flex-row justify-start flex-1',
        /** Label, icon glyph and icon circle change colour together, with the row's hover highlight (150ms ease-out,
            `.neo-menu-highlight` in global.web.css), so nothing in the row swaps ahead of the rest. */
        item_text: `${MENU_TEXT_BASE} ${MENU_ITEM_SIZES.regular.text}`,
        /** The glyph in an item's icon circle (`item_icon`): the label's colour, so both brighten on hover as one. */
        item_icon_glyph: 'text-secondary-foreground web:group-hover:text-foreground web:transition-colors web:duration-150 web:ease-out',
        /** Selected item (current tab / page, picked option): the toggled look — `bg-accent` + `text-accent-foreground`.
            Its icon circle is the solid primary (`item_icon_active`) with a primary-foreground glyph, so the circle
            still reads on the accent row. */
        item_selected: ' bg-accent ',
        item_text_selected: `${MENU_TEXT_SELECTED_BASE} ${MENU_ITEM_SIZES.regular.text}`,
        item_icon_selected: 'text-primary-foreground',
        item_description: 'block w-full text-xs font-normal leading-tight text-pretty text-muted-foreground px-2 break-words',
        item_group_header: 'px-2 pt-3 pb-1',
        item_group_header_first: 'p-2.5',
        item_group_header_text: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
        /** Sectioned menus (More): column tracks are set in dropdown-menu. */
        content_sections: 'items-stretch gap-1',
        content_sections_stacked: 'flex-col gap-1 w-full',
        section: 'min-w-0',
        /** Apps launcher waffle — icon above label, no description. */
        content_grid: 'w-full',
        item_grid:
            'group flex w-full min-w-0 min-h-24 flex-col items-center justify-start gap-1.5 rounded-xl px-1 py-2.5 text-secondary-foreground web:hover:bg-muted/80 web:hover:text-foreground web:hover:cursor-pointer web:focus-visible:outline-2 web:transition-colors web:duration-150 web:ease-out',
        item_icon_grid:
            'flex shrink-0 items-center w-12 h-12 bg-muted/50 web:group-hover:bg-border rounded-full justify-center web:transition-colors web:duration-150 web:ease-out',
        item_text_grid:
            'w-full text-center text-xs font-medium leading-tight text-secondary-foreground web:group-hover:text-foreground px-0.5 web:transition-colors web:duration-150 web:ease-out',
        item_icon: `${MENU_ICON_BASE} ${MENU_ITEM_SIZES.regular.icon}`,
        item_icon_active: `${MENU_ICON_ACTIVE_BASE} ${MENU_ITEM_SIZES.regular.icon}`,
        icon_size: MENU_ITEM_SIZES.regular.icon_size, // Default icon size for dropdown menu icons
        /** An item's image (avatar) takes the icon circle's size. */
        item_image: `rounded-full ${MENU_ITEM_SIZES.regular.icon}`,
        /** `DropdownMenu size` (vertical lists): the size-free parts above plus one of `MENU_ITEM_SIZES`. */
        item_ver_base: MENU_ITEM_BASE,
        item_icon_base: MENU_ICON_BASE,
        item_icon_active_base: MENU_ICON_ACTIVE_BASE,
        item_text_base: MENU_TEXT_BASE,
        item_text_selected_base: MENU_TEXT_SELECTED_BASE,
        item_sizes: MENU_ITEM_SIZES,
        icon_size_grid: 24,
    },
    modal: {
        fog: ' bg-background/95 ',
        container:
        ' bg-popover overflow-hidden ',
        // A dialog over the page (desktop, or a small centred one): on the near-opaque fog it needs its
        // edge too, the popover edge and drop, as menus. A modal that fills the screen has no edge or corners.
        dialog: ' shadow-popover dark:shadow-popover-deep rounded-3xl ',
        dialog_native: ' shadow-popover dark:shadow-popover-deep rounded-2xl ',
        // Native full screen: behind the status bar and the home indicator, the panel's own colour.
        fullscreen_bg: ' bg-popover ',
        content: '',
        // A block's padding (16px) and title (`blocks.u-block-title`).
        header: ' p-4 min-h-14 items-start justify-start border-b border-border/60 ',
        // headerBorder={false} (Sheet on web and Android): the same bar without the line, as the iOS sheet.
        header_plain: ' p-4 min-h-14 items-start justify-start ',
        title: 'text-card-foreground text-lg leading-7 font-semibold tracking-tight',
    },
    cards: {
        // The card surface (bg-card/60) on every size: edge to edge with no outline shadow on
        // mobile, detached and rounded with the outline shadow from sm. Overlays use bg-popover.
        'u-card-list': ' u-card-list bg-card/60 sm:shadow-card-outline sm:dark:shadow-card-outline-deep sm:rounded-2xl ',
        'u-card-list-padding': 'p-4 sm:rounded-2xl',
        // Profile listings: photo + meta + actions on mobile, card chrome from sm (grid).
        // Mobile: edge-to-edge rows on the card surface, 1px apart (feed cards are 2px), like
        // the Messages and Notifications rows.
        'u-card-list-flush': ' u-card-list u-flush-nav relative isolate mt-px sm:mt-0 bg-card/60 sm:shadow-card-outline sm:dark:shadow-card-outline-deep sm:rounded-2xl transition-colors duration-200 ease-out active:bg-muted/60 group-active:bg-muted/60 sm:active:bg-muted/60 sm:group-active:bg-muted/60 ',
        'u-card-list-flush-padding': 'px-4 py-2 sm:p-4 sm:rounded-2xl',
        'u-card-base': 'u-card-base rounded-2xl bg-card/60 text-card-foreground shadow-card-outline dark:shadow-card-outline-deep ',
        'u-card-padding': 'py-4 ',
        'u-card-header': 'px-4',
        'u-card-icon': ' ',
        'u-card-title': 'font-semibold text-base tracking-tight text-secondary-foreground',
        'u-card-description': 'text-muted-foreground text-sm sm:text-base text-balance',
        'u-card-actions': ' ',
        'u-card-content': 'px-4 ',
        'u-card-footer': 'px-4 gap-1',
    },
    panels: {
        'u-panel-base': ' ns--panel-base-- web:h-full min-w-0 flex-col ne-- ',
        // Invisible until hovered. Tailwind v4 applies variants left to right: `hover:before:` is
        // `:hover::before`, while `before:hover:` would be `::before:hover`, which never matches.
        // The line's `group-*` variants need the plain `group` marker PanelHandler puts on the handle.
        'u-panel-handler': 'relative w-0 web:before:absolute web:before:inset-y-0 web:before:-left-0.5 web:before:-right-0.5 web:before:bg-transparent web:hover:before:bg-accent web:active:before:bg-accent/50 web:before:duration-200 ',
        'u-panel-line':
            'absolute w-px web:h-full web:group-hover:bg-primary/50 web:group-active:bg-primary/50 rounded-full left-0 top-0 ',
        'u-panel-group': ' ns--panel-group-- web:h-full flex ne-- ',
    },
    blocks: {
        'u-block-base':
            ' text-card-foreground gap-4 ',
        'u-block-bg':
            ' bg-card/60 shadow-block-outline dark:shadow-block-outline-deep ',
        // 16px on every screen size, like cards. Call sites and blocks that set padding per
        // breakpoint (designbox.padding) can still change it.
        'u-block-pad':
            ' p-4 ',
        'u-block-pad-y':
            ' py-4 ',
        'u-block-pad-x':
            ' px-4 ',
        'u-block-rounded': 'rounded-2xl',
        // Corners of a block that doesn't set `designbox.rounded`, in layouts that don't say
        // where their padding is (home, profile, post ...). Elsewhere corners follow the page
        // padding: rounded where it keeps the block off the screen edge (block-wrapper.js).
        'u-block-rounded-default': 'sm:rounded-2xl',
        'u-block-header':
            ' flex-row gap-3  ',
        'u-block-icon': ' items-center w-9 h-9 justify-center bg-muted/50 rounded-lg text-card-foreground flex-none',
        'u-block-icon-size': 20, // Default icon size for block header icons
        'u-block-name': ' flex-auto gap-1 ',
        // text-lg on every screen size; line height = the mini (legacy xs) button height, 28px, so the title lines up with header buttons.
        'u-block-title':
            'text-card-foreground px-0.5 text-lg leading-7 font-semibold tracking-tight',
        'u-block-description': 'text-muted-foreground text-xs lg:text-sm leading-5 px-px',
        'u-block-content': 'gap-0.5 ',  
        'u-block-footer':
            'flex text-card-foreground gap-4 pt-2',
        'u-block-actions':
            'flex flex-row text-card-foreground gap-2  ',
        // Header "View all" link (small, 36px). -my-1 centres it on the 28px title line without making
        // the header taller; -me-1.5 pulls it 6px toward the content edge (its 12px padding keeps the label
        // inside). max-w-none: the link's own max-w-full would cap it at its narrower margin box and truncate the label.
        'u-block-more-link': '-my-1 -me-1.5 max-w-none',
        'u-block-animate':
            'animate-in fade-in slide-in-from-top-2 duration-200',
    },
   
    tables: {
        // Base
        'u-table-base':
            'w-full border border-border/60 bg-transparent border-collapse overflow-hidden rounded-lg',
        'u-table-header': 'border-border',
        'u-table-body': 'border-border',
        'u-table-footer': 'bg-muted/50 font-medium',
        'u-table-row':
            'flex overflow-hidden flex-row border-border border-b web:transition-colors web:hover:bg-muted/50 web:data-[state=selected]:bg-muted',
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