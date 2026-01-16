import { env } from 'app/lib/env'
import { settingsLayout } from 'app/settings/layout';
import { settingsForms } from 'app/settings/forms';
import { settingsFeed } from 'app/settings/feed';
import { settingsBrowse } from 'app/settings/browse';
import { settingsSocialActions } from 'app/settings/social_actions';
import { settingsMenus } from 'app/settings/menus';
import { settingsHeaderToolbar } from 'app/settings/header_toolbar';
import { settingsTheme } from 'app/settings/theme';
import { settingsElements } from 'app/settings/elements';
import { settingsConfigs } from 'app/settings/configs'; 

export const settingsDefault = {
    config: {
        una_url: env('UNA_URL'),
        app_url: env('APP_URL'),
        una_api_key: env('UNA_API_KEY'),
        app_origin: env('APP_ORIGIN'),
        native_app_images_url:
            env('APP_URL') == 'http://localhost:3000'
                ? 'https://neo.so'
                : 'https://neo.so',
        noprefetch: false,
        debug: true,
        use_proxy_web: true,
        use_proxy_native: false,
        sockets: {
            host: 'ci.una.io',
            port: '443',
            key: 'app-key',
        },
        api_keys: {
            google_maps: 'AIzaSyAhrci201-9xXIRAy0kLOHFGppeTk8AHmo',
            open_ai: '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',
            onesignal: 'a36d17c1-693e-40e1-98e9-41a62a9b5e7d',
            mapbox: 'pk.eyJ1Ijoicm9tYW5sZXMiLCJhIjoiY204Zm9kY3ByMGE4bzJrc2R6Zzg4NW0zMCJ9.Jme_Zudsug5mmqcbjII9cQ',
          
        },
        show_ui: true,
        app_version: '15.0.0',
        min_server_version: '15.0.0',
        stable_server_version: '15.x.x',
        multitenant: false,
        title: 'UNA',
        multitenant_images_proxy: null,// 'http://localhost:3000', // or null to disable
    },

    ...settingsLayout,
    ...settingsForms,
    ...settingsFeed,
    ...settingsBrowse,
    ...settingsSocialActions,
    ...settingsMenus,
    ...settingsHeaderToolbar,
    ...settingsTheme,
    ...settingsElements,
    ...settingsConfigs,
}
