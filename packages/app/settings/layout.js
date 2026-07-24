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
        avaliable_langs: ['auto', 'en', 'ru'],
        screen: ' w-full  ',

        neoshell_main_wrapper: ' ns--main-wrapper-- ',
        neoshell_main_content: ' ns--main-content-- ',
        neoshell_header_wrapper: ' ns--header-wrapper-- ',
        neoshell_header_wrapper_scrolled: ' ns--header-wrapper-scrolled-- ',
        neoshell_header_content: ' ns--header-content-- ',
        neoshell_header_content_scrolled: ' ns--header-content-scrolled-- ',


        max_width: ' ns--undefined-- w-full flex-auto web:h-full ne--  ',
        page_content_width_default: ' ns--page-content-width-- w-full max-w-8xl ne--  ',
        page_content_width:{
            layout_1_column_thin: 'w-full max-w-md',
            layout_1_column_half: 'w-full max-w-2xl',
        },
        page_content_padding: ' p-4 ',
        page_content_padding_default: ' p-4 ',
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
            container: ' ns--header-wrapper-- w-full z-50 header-fixed web:fixed native:absolute bg-card web:top-0 web:transition-transform web:duration-300 web:ease-in-out border-b border-border/60 ne--',
            /** Optional. When set (non-blank), appended to `container` while scrollY > 0 (full-width bar: shadow, border, etc.). */
            container_scrolled: ' ns--header-wrapper-scrolled-- shadow-sm dark:shadow-sm-deep ne-- ',
            content: ' ns--header-content-- items-center justify-between h-16 mx-auto w-full ne-- ',
            /** Optional. When set (non-blank), applied to header content only while scrollY > 0. If unset, legacy `content_pinned_fixed` behavior is unchanged. */
            content_scrolled: ' ns--header-content-scrolled--  ',
            content_pinned_fixed: ' bg-card ',
            content_left: 'flex-none 2xl:w-full 2xl:max-w-1/4 px-3 sm:px-4 gap-2',
            content_center: ' hidden flex-1 lg:flex gap-2 items-center justify-center max-w-3xl px-4 ',
            content_right: ' items-end flex-none 2xl:w-full 2xl:max-w-1/4 px-3 sm:px-4 gap-2',
            active_item_indicator: 'absolute -bottom-2 left-0 h-0.5 rounded-full flex-none bg-ring',
            active_item_indicator_bg: 'absolute bottom-0 left-0 h-12 w-full overflow-hidden rounded-lg flex-none',
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