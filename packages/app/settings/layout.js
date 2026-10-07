export const settingsLayout = {
    layout: {
        body: ' bg-background ',
        defaults: {
            name: 'hor',
            theme: 'auto',
            lang: 'en',
            feed_unit: 'default',
        },
        avaliable_layouts: ['hor', 'ver', 'mixed'],
        avaliable_feed_units: ['Full feed', 'Compact feed'],
        avaliable_langs: ['auto', 'en', 'ru', 'es', 'de', 'fr'],
        screen: ' w-full  ',


      

        max_width: ' ns--undefined-- w-full flex-auto web:h-full ne--  ',
        page_content_width_default: ' ns--page-content-width-- w-full max-w-8xl ne--  ',
        
        page_content_width:{
            layout_1_column_thin: 'w-full max-w-md',
            layout_1_column_half: 'w-full max-w-4xl',
            chat: 'w-full',
            // Page URI or layout name. Forks override in customization/settings.js.
            'tasks-home': 'w-full',
            task: 'w-full',
            'view-task': 'w-full',
        },
        page_content_padding: ' p-4 ',
        page_content_padding_default: ' p-4 ',
        // Per-layout padding tiers for `responsiveClasses` (same values as UNA page `config.padding`).
        // Missing key → `page_content_padding_default`. `[]` = off. `true` = all breakpoints.
        // UNA `config.padding` still wins when the page sends it.
        page_content_padding_layouts: {
            chat: [],
        },
        page_content_gap: ' gap-4 ',
        page_content_gap_default: ' sm:gap-4 ',
       
        max_width_landing: 'w-full max-w-8xl ',
        max_width_block: ' max-w-8xl ',
       
        padding_content: ' @list-sm/list:m-1 @list-md/list:m-2',
        feed_container: ' w-full flex-1 max-w-3xl sm:p-4 mx-auto ',
        post_container: ' max-w-3xl w-full flex-1 bg-card text-card-foreground rounded-2xl p-3 sm:py-4 lg:my-4 mx-auto ', // for hor = max-w-screen-xl, for ver = max-w-screen-lg

        search: true,
        sidebar_search: true,
        extended_search: true,
        apps: true,
        add_menu: true,
        show_profile_info: true,
        tooltips: true,
        hide_header_for_non_logged: false,
        hide_header_for_all: false,
        card_animation_duration: 100,
        user_remote_config: true,
        background_image_color: '', 
        background_image: '', 
        background_image_dark: '', 

        sounds: true,
        tab_sounds: false,
        /** When `sounds` is true: enables [web-haptics](https://github.com/lochie/web-haptics) synthesized click audio on mobile web / desktop (same idea as [haptics.lochie.me](https://haptics.lochie.me/)). When false: vibration only, no synth sound. */
        web_haptics_sounds: true,

        show_login_modal: 0,
        //redirect_on_forbidden: '/home',
        lock_unconfirmed: true,
        lock_no_profile: true,
        allow_create_new_profile: true,

        button_style_for_actions: 'secondary',

        share_text: '',
        default_icon_stroke_width: 2,
        tablet_mode_from: 'lg',
        show_tabbar_on_mobile_non_logged: false,

        header: {
            container: ' ns--header-wrapper-- w-full z-50 header-fixed web:fixed native:absolute native:top-0 native:left-0 native:right-0  web:top-0  web:transition-[transform,background-color,border-color] web:duration-300 web:ease-in-out  ne--',
            /**
             * Color wash behind glass chrome. Applied as an overlay that
             * extends `fade_extend` below the measured header.
             */
            fade: 'bg-linear-to-b from-background to-background/0',
            /** Extra px the color wash extends below the header. */
            fade_extend: 0,
            /**
             * Native wash where `fade_blur` is off (Android): solid through the
             * header, easing out over `extend` px below it — like the iOS blur —
             * so content scrolling underneath (chat) doesn't show through the
             * title row. `extend` is visual only (lists keep `fade_extend`).
             * null falls back to `fade` / `fade_extend`.
             */
            fade_native: { className: 'bg-linear-to-b from-background from-75% to-background/0', extend: 16 },
            /**
             * iOS: progressive blur instead of the `fade` wash, like native
             * bars — a SwiftUI material masked by an eased gradient (fully
             * blurred for `hold` of the height, then eases out). `extend` = px
             * past the header. `tint` = opacity of `bg-background` over the
             * material per scheme (dark `thin` alone reads as `bg-card`).
             * null keeps the `fade` wash.
             */
            // Transparency knobs: `opacity` (peak strength, blur + tint) is the
            // gentlest; `material` (ultraThin → thick), `hold`, `tint` also help.
            fade_blur: { material: 'thin', hold: 0.5, opacity: 0.8, extend: 16, tint: { dark: 0.75 } },
            /** Optional. When set (non-blank), appended to `container` while scrollY > 0 (full-width bar: shadow, border, etc.). */
            container_scrolled: ' ns--header-wrapper-scrolled-- shadow-none lg:bg-card/60 lg:backdrop-blur-lg lg:shadow-border-b dark:lg:shadow-border-b-deep ne-- ',
            content: ' ns--header-content-- items-center justify-between h-16 lg:bg-card/60 lg:backdrop-blur-lg lg:shadow-border-b dark:lg:shadow-border-b-deep mx-auto w-full ne-- ',
            /** Optional. When set (non-blank), applied to header content only while scrollY > 0. If unset, legacy `content_pinned_fixed` behavior is unchanged. */
            content_scrolled: ' ns--header-content-scrolled--  ',
            content_pinned_fixed: '  ',
            content_left: 'flex-none 2xl:w-full 2xl:max-w-1/4 px-4 gap-3',
            content_center: ' hidden flex-1 lg:flex gap-2 items-center justify-center max-w-3xl px-4 ',
            content_right: ' items-end flex-none 2xl:w-full 2xl:max-w-1/4 px-4 gap-3',
            active_item_indicator: 'absolute -bottom-2 left-0 h-0.5 rounded-full flex-none bg-ring',
            active_item_indicator_bg: 'absolute bottom-0 left-0 h-12 w-full overflow-hidden rounded-lg flex-none',
        },
        /**
         * iOS: native progressive blur behind bottom composers (post comments,
         * messenger / agent) and in-panel overlay headers, instead of their
         * `bg-linear-to-* … to-transparent` wash — same shape as
         * `header.fade_blur` (`hold` is measured from the anchored edge;
         * `extend` is unused, the containers carry their own fade run-up).
         * null keeps the wash.
         */
        footer_fade_blur: { material: 'thin', hold: 0.45, opacity: 0.8, tint: { dark: 0.75 } },
        /**
         * iOS NativeTabs: native blur behind the floating tab bar on tab
         * screens, matching `header.fade_blur`. Height = the tab screen's bottom
         * safe-area inset (home indicator + tab bar, 83pt on iPhone 15 Pro) +
         * `extend`. null leaves only the system edge effect.
         */
        tabbar_fade_blur: { material: 'thin', hold: 0.5, opacity: 0.8, extend: 44, tint: { dark: 0.75 } },
        vertical: {
            blocks: [
                /*  {
                    name: 'system/profile_menu/TemplServiceProfiles',
                    showTitle: false,
                    showBg: false,
                },*/
            ],
        },
        external_scripts: [],
    },
    layouts: {
        '/': {
            // For the splash screen (home page when not logged in)
            max_width: '',
        },
        '/login': {
            max_width: '',
        },
        '/create-account': {
            max_width: '',
        },
        copilot: {
            layout: 'chat',
        },
        home: {
            adjustable: false,
            sizable: false,
            cells: {
                left: {
                    defaultSize: 0,
                    minSize: 0,
                    maxSize: 25,
                    breakpoint: 'xl',
                    responsive: {
                        xl: {
                            defaultSize: 25,
                            minSize: 25,
                            maxSize: 25,
                        },
                        '2xl': {
                            defaultSize: 25,
                            minSize: 25,
                            maxSize: 25,
                        },
                    },
                },
                center: {
                    defaultSize: 100,
                    minSize: 50,
                    maxSize: 100,
                    responsive: {
                        lg: {
                            defaultSize: 65,
                            minSize: 65,
                            maxSize: 65,
                        },
                        xl: {
                            defaultSize: 50,
                            minSize: 50,
                            maxSize: 50,
                        },
                        '2xl': {
                            defaultSize: 50,
                            minSize: 50,
                            maxSize: 50,
                        },
                    },
                },
                right: {
                    defaultSize: 0,
                    minSize: 0,
                    maxSize: 35,
                    breakpoint: 'lg',
                    responsive: {
                        lg: {
                            defaultSize: 35,
                            minSize: 35,
                            maxSize: 35,
                        },
                        xl: {
                            defaultSize: 25,
                            minSize: 25,
                            maxSize: 25,
                        },
                        '2xl': {
                            defaultSize: 25,
                            minSize: 25,
                            maxSize: 25,
                        },
                    },
                },
            },
        },
        wiki: {
            adjustable: false,
            sizable: true,
            'panel-line': 'bg-border/0 web:hover:bg-accent-foreground/60 w-1 duration-300',
            cells: {
                left: {
                    defaultSize: 0,
                    minSize: 0,
                    maxSize: 25,
                    // Nav is primary — show from lg; TOC waits for xl.
                    breakpoint: 'lg',
                    responsive: {
                        lg: {
                            defaultSize: 25,
                            minSize: 25,
                            maxSize: 25,
                        },
                        xl: {
                            defaultSize: 25,
                            minSize: 25,
                            maxSize: 25,
                        },
                        '2xl': {
                            defaultSize: 20,
                            minSize: 15,
                            maxSize: 25,
                        },
                    },
                },
                center: {
                    defaultSize: 100,
                    minSize: 50,
                    maxSize: 100,
                    responsive: {
                        lg: {
                            defaultSize: 75,
                            minSize: 75,
                            maxSize: 75,
                        },
                        xl: {
                            defaultSize: 50,
                            minSize: 50,
                            maxSize: 50,
                        },
                        '2xl': {
                            defaultSize: 60,
                            minSize: 40,
                            maxSize: 70,
                        },
                    },
                },
                right: {
                    defaultSize: 0,
                    minSize: 0,
                    maxSize: 35,
                    breakpoint: 'xl',
                    responsive: {
                        xl: {
                            defaultSize: 25,
                            minSize: 25,
                            maxSize: 25,
                        },
                        '2xl': {
                            defaultSize: 20,
                            minSize: 15,
                            maxSize: 30,
                        },
                    },
                },
            },
        },
        chat: {
            adjustable: true,
            sizable: true,
            cells: {
                left: {
                    defaultSize: 30,
                    minSize: 20,
                    maxSize: 40,
                    breakpoint: 'lg',
                },
                center: { defaultSize: 70, minSize: 40, maxSize: 80 },
            },
        },
        'cols-c': {
            adjustable: true,
            sizable: true,
            cells: {

                center: { defaultSize: 100, minSize: 50, maxSize: 100 },
            },
        },
        'cols-l-c-r': {
            adjustable: true,
            sizable: true,
            cells: {
                left: {
                    defaultSize: 25,
                    minSize: 20,
                    maxSize: 30,
                    breakpoint: 'xl',
                },
                center: { defaultSize: 50, minSize: 40, maxSize: 60 },
                right: {
                    defaultSize: 25,
                    minSize: 20,
                    maxSize: 30,
                    breakpoint: 'xl',
                },
            },
        },
        'cols-l-c': {
            adjustable: true,
            sizable: true,
            cells: {
                left: {
                    defaultSize: 30,
                    minSize: 15,
                    maxSize: 30,
                    breakpoint: 'xl',
                    responsive: {
                        '2xl':{
                            defaultSize: 20,
                            minSize: 15,
                            maxSize: 30,
                            
                        }
                    }
                   
                },
                center: { 
                    defaultSize: 70, minSize: 70, maxSize: 80,
                    responsive: {
                        '2xl':{
                                defaultSize: 80,
                                minSize: 70,
                                maxSize: 85,
                                
                            }
                        }
                },
            },
        },
        'cols-c-r': {
            adjustable: true,
            sizable: true,
            cells: {
                center: { 
                    defaultSize: 60, 
                    minSize: 50, 
                    maxSize: 70,
                    responsive: {
                        '2xl':{
                            defaultSize: 70,
                            minSize: 65,
                            maxSize: 75,
                            breakpoint: 'xl',
                        }
                    }
                },
                right: {
                    defaultSize: 40,
                    minSize: 30,
                    maxSize: 50,
                    breakpoint: 'lg',
                    responsive: {
                        '2xl':{
                            defaultSize: 30,
                            minSize: 25,
                            maxSize: 35,
                            breakpoint: 'xl',
                        }
                    }
                },
            },
        },
    }
}