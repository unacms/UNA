

export const settingsConfigs = {
    native: {
        app_version_pages: ['about'], // page uris that show the native app version + build at the bottom
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
        // Page uris (UNA page `uri`) that show the header back button on
        // native even when `backbutton_in_header` is off.
        backbutton_in_header_path: ['item'],
         // Paths not stored in tab back-stack (repeat tab tap / header back). String prefix or { prefix }, { regex } on path without query.
        tab_history_exclude: [],
        allow_font_scaling: true,
        // Expo UI NeoButton (iOS SwiftUI / Android Material).
        expo_ui_buttons: true,
        // System tab bar (expo-router NativeTabs). Requires expo_ui_buttons.
        // false = JS tab bar while Expo UI buttons can stay on.
        expo_native_tabs: true,
        // Text under tab bar icons (web mobile footer + native JS / NativeTabs).
        // false = icon-only. Per-tab empty `title` still hides that label.
        tab_labels: true,
    },
    urls: {
        embeds: '/oembed.php?html=1&a=get_link&l=',
        embeds_new: 'system/get_url_info/TemplServicePages&params[]=',
        cmts: 'system/get_data_api/TemplCmtsServices',
        feed_item: 'bx_timeline/get/&params[]=',
    },
    cache: {
        // In-memory page / conductor / wiki caches.
        // Forks without the key keep caching on (`!== false`).
        enable_web: true,
        enable_native: true,
        // Next server cache for UNA get_page_by_request (seconds). 0 disables.
        // Viewer-keyed; person/org profiles keep a slightly longer window so
        // list → profile prefetch is reused on click.
        una_page_ttl: 20,
        una_page_profile_ttl: 30,
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
    // Floating Agent for UNA operators (`user.operator`). Which agent, and the rest of
    // the block flags, come from the server (`get_block_ai_agent_operator`). These
    // keys are the float's own chrome: `enabled: false` hides it; `show_history`
    // is off because the panel is too narrow for a "Chats" list (the page block
    // still follows the server's `show_history`).
    ai: {
        operator_agent: { enabled: true, show_history: true },
    },
    // Web smart app banner (iOS Safari meta + Android custom bar). Empty apple_app_id = no iOS meta.
    smart_app_banner: {
        apple_app_id: '',
        apple_app_argument: '',
        play_store_url: '',
        app_icon_url: '',
    },
}