

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
         // Paths not stored in tab back-stack (repeat tab tap / header back). String prefix or { prefix }, { regex } on path without query.
        tab_history_exclude: [],
        allow_font_scaling: true,
        // Expo UI NeoButton (iOS SwiftUI / Android Material).
        expo_ui_buttons: true,
        // System tab bar (expo-router NativeTabs). Requires expo_ui_buttons.
        // false = JS tab bar while Expo UI buttons can stay on.
        expo_native_tabs: false,
        // Text under tab bar icons (web mobile footer + native JS / NativeTabs).
        // false = icon-only. Per-tab empty `title` still hides that label.
        tab_labels: false,
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
        // In-memory page / conductor / wiki caches (not web storage `list`).
        // Forks without the key keep caching on (`!== false`).
        enable_web: true,
        enable_native: false,
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
    // Web smart app banner (iOS Safari meta + Android custom bar). Empty apple_app_id = no iOS meta.
    smart_app_banner: {
        apple_app_id: '',
        apple_app_argument: '',
        play_store_url: '',
        app_icon_url: '',
    },
}