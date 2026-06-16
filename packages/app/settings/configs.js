

export const settingsConfigs = {
    native: {
        enable_screens: true, //OLD appSetting('layout', 'native_enable_screens')
        lazy_tabs_preload_delay: 10000, 
        disable_screenshots: false, // OLD appSetting('layout', 'disable_screenshots')
        show_tabs_non_logged: true, // OLD appSetting('layout', 'show_nav_non_logged_native')
        bluetooth: false, //OLD appSetting('layout', 'bluetooth')
        bluetooth_device_name_prefix: 'NEO', //OLD appSetting('layout', 'bluetooth_device_name_prefix')
        onesignal_request_on_load: true,
        check_version: 'optional', // variants: [no, required, optional]
        collapsible_header: true,
        backbutton_in_header: false,
        scroll_to_top_button: true,
         // Paths not stored in tab back-stack (repeat tab tap / header back). String prefix or { prefix }, { regex } on path without query.
        tab_history_exclude: [],
        allow_font_scaling: true,
    },
    urls: {
        embeds: '/oembed.php?html=1&a=get_link&l=',
        embeds_new: 'system/get_url_info/TemplServicePages&params[]=',
        cmts: 'system/get_data_api/TemplCmtsServices',
        feed_item: 'bx_timeline/get/&params[]=',
    },
    cache: {
        list: true,
        compress: true,
        items_lifetime: 30,
    },
    dashboard: {
        url: '/dashboard', 
        switch_theme: true, 
        modules_list: [
            'friends',
            'followers',
            'bx_ads',
            'bx_forum',
            'bx_posts',
            'bx_events',
            'bx_groups',
            'bx_organizations',
            'bx_spaces',
        ],
    },
    notifications: {
        url: '/notifications-view', 
        count_in_title: true, 
        show_plain_text: true,
        onesignal_prompt_delay_ms: 2 * 60 * 1000,
        onesignal_request_on_load: true,
    },
    messenger: {
        url: '/messenger', 
        back_button: false, 
    },
    
}