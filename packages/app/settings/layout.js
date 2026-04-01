

export const settingsLayout = {
    layout: {
        body: ' bg-default ',
        defaults: {
            name: 'hor',
            density: 'default',
            theme: 'auto',
            lang: 'en',
            feed_unit: 'default',
        },
        avaliable_layouts: ['hor', 'ver', 'mixed'],
        avaliable_feed_units: ['default', 'small'],
        avaliable_density: [
            { id: 'compact', title: 'Compact', icon: 'Minus' },
            { id: 'default', title: 'Default', icon: 'Circle' },
            { id: 'relaxed', title: 'Relaxed', icon: 'Plus' },
        ],
        avaliable_langs: ['auto', 'en', 'ru'],
        screen: ' w-full  ',
        ui_density_switcher: true,
        max_width: ' w-full ',
        max_width_content: ' w-full max-w-7xl ',
        max_width_block: ' max-w-7xl ',
        home_container: ' w-full 2xl:max-w-screen-2xl ',
        feed_container: ' w-full max-w-3xl sm:p-4 mx-auto ',
        post_container: ' max-w-3xl w-full flex-1 bg-card text-card-foreground rounded-2xl py-3 sm:py-4 lg:my-4 mx-auto ', // for hor = max-w-screen-xl, for ver = max-w-screen-lg

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
        /** When `sounds` is true: enables [web-haptics](https://github.com/lochie/web-haptics) synthesized click audio on mobile web / desktop (same idea as [haptics.lochie.me](https://haptics.lochie.me/)). When false: vibration only, no synth sound. */
        web_haptics_sounds: true,

        show_login_modal: 0,
        redirect_on_forbidden: '/home',
        lock_unconfirmed: true,
        lock_no_profile: true,
        allow_create_new_profile: true,

        button_style_for_actions: 'secondary',

        share_text: '',
        default_icon_stroke_width: 2,
        tablet_mode_from: 'lg',
        show_tabbar_on_mobile_non_logged: false,

        header: {
            /**
             * Native (`page_header.js`): uses `container`, `content`, `content_left`, `content_center`, `content_right`, `active_item_indicator`, `native_collapse_animation_ms`.
             * Web mobile collapsible (`page_header.web.js`): also uses `initial_surface`, `floating_*`, `fixed_*`, `fixed_reveal_*`.
             */
            /** Base width/z-index; `page_header.web` strips fixed/transition tokens and applies `fixed_layer` for fixed rows. */
            container: ' w-full bg-card z-50 header-fixed web:fixed native:absolute web:top-0 web:transition-transform web:duration-300 web:ease-in-out ',
            /** Native only: `Animated.timing` duration (ms) when translating the collapsible header. Web timing uses `fixed_*_ms` / transitions. */
            native_collapse_animation_ms: 300,
            /** Row layout for `PageHeaderBody` (height, padding, flex). */
            content: '  items-center justify-between h-14 lg:h-16 px-3 lg:px-4 w-full mx-auto gap-4',
            /** Background on the in-flow header row (`fixed_reveal_on: scroll_up` default). Scrolls with the page until floating chrome mounts. */
            initial_surface: ' bg-default ',
            /** Decorative fixed layer behind controls when floating chrome is mounted (pointer-events none). Opacity is driven in JS. */
            floating_surface: ' bg-default shadow-sm border-b border-white/80 dark:border-white/10 ',
            /** Used only when the interactive row is fixed: `scrollDirection` 0 (near top band in scroll sync). */
            floating_content_initial: ' opacity-100 ',
            /** Used only when fixed: scroll direction matches `fixed_reveal_on` (bar should show). */
            floating_content_visible: ' opacity-100 ',
            /** Used only when fixed: scroll direction is the dismiss direction (bar hidden). */
            floating_content_hidden: ' hidden ',
            /**
             * `scroll_up` (default): in-flow header + controls scroll away together; after passing the header, fixed floating chrome + fixed controls appear on scroll-up and dismiss on scroll-down; at scrollY 0, back to in-flow.
             * `scroll_down`: interactive row stays fixed (with spacer) like a classic sticky header; floating surface follows scroll-down mount rules.
             */
            fixed_reveal_on: 'scroll_up',
            /**
             * When `fixed_reveal_on` is `scroll_up`: extra upward scroll distance (px) after a scroll-up gesture
             * before mounting fixed chrome. Dampens iOS rubber-band / bounce at the bottom from toggling mount.
             */
            fixed_reveal_scroll_threshold_px: 100,
            /** Fixed positioning + safe-area shell for fixed rows (web). */
            fixed_layer:
                ' header-fixed web:fixed web:left-0 web:right-0 web:top-0 web:z-50 -mt-[env(safe-area-inset-top)] pt-[env(safe-area-inset-top)] ',
            /** Floating background: transform/opacity while entering (after mount). */
            fixed_enter_transition: 'web:duration-500 web:ease-out',
            /** Starting translate for enter; empty string disables slide-in. */
            fixed_enter_translate: 'web:-translate-y-full',
            /** How long `isOpening` lasts so the enter transition can run (ms). Match `fixed_enter_transition` duration. */
            fixed_enter_ms: 500,
            /** Floating background: transform/opacity while dismissing. */
            fixed_dismiss_transition: 'web:duration-300 web:ease-in-out',
            fixed_dismiss_translate: '',
            /** Unmount delay after dismiss starts; set ≥ longest dismiss transition. */
            fixed_dismiss_ms: 500,
            /** Transition on the fixed `PageHeaderBody` wrapper (enter settle + scroll-driven hide). Include transform + opacity. */
            fixed_content_transition:
                'web:transition-[transform,opacity] web:duration-300 web:ease-in-out',
            content_left: ' items-center justify-start flex-1 lg:flex-none xl:w-80 gap-x-2',
            content_center: ' hidden flex-auto lg:flex gap-2 items-center justify-center max-w-3xl  ',
            active_item_indicator: 'absolute -bottom-2 left-0 h-0.5 rounded-full flex-none bg-ring/80',
            content_right: ' items-center justify-end xl:w-80',
        },
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
        home: {
            adjustable: true,
            sizable: false,
            cells: {
                left: {
                    defaultSize: 25, 
                    minSize: 25, 
                    maxSize: 25,
                    breakpoint: 'xl',
                    responsive: {
                       
                        '2xl':{
                            defaultSize: 25,
                            minSize: 25,
                            maxSize: 25,
                            
                        }
                    }
                },
                center: { 
                    defaultSize: 65, 
                    minSize: 65, 
                    maxSize: 65,
                    responsive: {
                        'xl':{
                            defaultSize: 50,
                            minSize: 50,
                            maxSize: 50,
                        },
                        '2xl':{
                            defaultSize: 50,
                            minSize: 50,
                            maxSize: 50,
                            
                        }
                    }
                },
                right: {
                    defaultSize: 35,
                    minSize: 35,
                    maxSize: 35,
                    breakpoint: 'lg',
                    responsive: {
                        'xl':{
                            defaultSize: 25,
                            minSize: 25,
                            maxSize: 25,
                            
                        },
                        '2xl':{
                            defaultSize: 25,
                            minSize: 25,
                            maxSize: 25,
                            
                        }
                    }
                },
            },
        },
        messenger: {
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