

export const settingsLayout = {
    layout: {
        body: ' bg-background ',
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
        home_container: ' w-full 2xl:max-w-screen-2xl web:duration-500 web:border-x-0 web:border-guide/20 web:border-dashed',
        feed_container: ' w-full max-w-3xl sm:p-3 lg:p-4 mx-auto ',
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
            container: 'bg-card w-full z-50 header-fixed backdrop-blur-xl web:fixed native:absolute web:top-0 web:transition-transform web:duration-300 web:ease-in-out lg:shadow-custom',
            content: ' items-center justify-between h-14 lg:h-16 px-3 lg:px-4 w-full mx-auto',
            content_center: ' hidden flex-auto lg:flex gap-1 items-center justify-center max-w-3xl xl:px-3 ',
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