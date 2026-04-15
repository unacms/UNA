

export const settingsElements = {
    context_selector: {
        default_item: '',
        logo: true,
        logo_mode: 'full',
        show_always: false,
        root_url: 'home'
    },
    cover: {
        use_background: true, 
        aspect_ratio: 'aspect-4/1', 
        allow_edit: true, 
        allow_switch: true, 
        fixed: false, 
        scroll: false,
        hide_cover_for_context: false,
        back_button_url_for_profile: '/friends',
        view_by_module: {
            bx_courses: 'min',
            bx_spaces: 'max',
            bx_jobs: 'max',
        },
        show_pic_by_module: {
            bx_spaces: true,
        },
        
    },
    comments: {
        hide_sort: false, //OLD appSetting('layout', 'hide_comments_sort')
        count_in_feed: 3, //OLD appSetting('layout', 'comments_count_in_feed')
        mentions: true, //OLD appSetting('layout', 'comments_mentions')
        in_reply: true, //OLD appSetting('layout', 'show_in_reply_comments')
        submit_comment_on_enter: false,
    },
    carousel: {
        image_width: '', //appSetting('layout', 'carousel_image_width')
        image_aspect_ratio: ' aspect-square ', //appSetting('layout', 'carousel_image_aspect')
    },
    conductor: {
        show_nav_counters: true, // OLD appSetting('layout', 'show_nav_counters')
        show_nav_titles: false, // OLD appSetting('layout', 'show_nav_titles')
        hide_browse_filter: true, // OLD appSetting('layout', 'hide_browse_filter')
        sidebar_container: ' xl:px-4 ',
        sidebar_inner_container: ' p-4 gap-4 overflow-y-auto flex flex-col bg-card shadow-xs dark:shadow-xs-deep rounded-xl ',
        sidebar_title: 'sticky h-10 justify-between items-center z-10',
        sidebar_position: ' z-50 fixed fixed-process ',
        bgrDecorator: true, // Enable/disable decorator background globally for conductor buttons
        add_menu_native:false,
        more_menu_container: 'hidden lg:block items-center mx-3'
    },
    entry: {
        default_view: '',
        default_info_icon: 'Info', //appSetting('layout', 'entity_info_icon')
    },
    jitsi: {
        prefix: 'prefix_',
        domain: 'https://meet.jit.si/',
    },
    async_workers: {
        list: ['CounterChecker'], 
        interval: 10,
    },
    suggestion: {
        list: [
            /*  {
                name: 'friends',
                request_url:
                    '/api.php?r=system/browse_recommendations_friends/TemplServiceProfiles&params[]={user_id}&params[]=',
                title: 'Recommended friends',
                unitType: 'person_friends_suggestion',
                perLine: 3,
            },
            {
                name: 'groups',
                request_url:
                    '/api.php?r=bx_groups/browse_recommendations_fans&params[]={user_id}',
                title: 'Recommended groups',
                unitType: 'person_friends_recommendations',
                perLine: 3,
            },*/
        ],
    },
    auth: {
        enabled: true,
        google: {
            web_client_id:
                '398453829790-egj0o9mm2mq9rua8umq6jcvedtl9cgfu.apps.googleusercontent.com',
            ios_client_id: '',
            android_client_id: '',
        },
        github: false,
        linkedin: false,
        x: false,
        passkey: false,
        saml: false,
    },
    editor: {
        toolbar: {
            padding: 1, // Padding for toolbar buttons in pixels
            colors: {
                background: 'rgba(255, 255, 255, 0)',
                backgroundDark: 'rgba(0, 0, 0, 0)',
                icon: 'rgba(210, 215, 220, 1)',
                iconDark: 'rgba(55, 65, 80, 1)',
            },
        },
        css:'A.bx-mention-link, A.bx-tag{ color: rgba(37, 99, 235, 1)}',
        css_dark:'A.bx-mention-link, A.bx-tag{ color: rgba(59, 130, 246, 1)}}',
    },
}