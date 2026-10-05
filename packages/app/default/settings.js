import { env } from 'app/lib/platform/env'
import { settingsLayout } from 'app/settings/layout';
import { settingsForms } from 'app/settings/forms';
import { settingsFeed } from 'app/settings/feed';
import { settingsBrowse } from 'app/settings/browse';
import { settingsSocialActions } from 'app/settings/social-actions';
import { settingsMenus } from 'app/settings/menus';
import { settingsHeaderToolbar } from 'app/settings/header-toolbar';
import { settingsWiki } from 'app/settings/wiki';
import { settingsTheme } from 'app/settings/theme';
import { settingsElements } from 'app/settings/elements';
import { settingsConfigs } from 'app/settings/configs'; 
import { ImageAllowlistHostnames } from 'app/settings/images-allowlist'; 
export const settingsDefault = {
    config: {
        una_url: env('UNA_URL'),
        app_url: env('APP_URL'),
        una_api_key: env('UNA_API_KEY'),
        // CI previews: pr-<n>.<domain> is served by the backend at api-pr-<n>.<domain>,
        // authenticated with preview_api_key (server only). Unset = no preview hosts.
        preview_domain: env('UNA_PREVIEW_DOMAIN'),
        preview_api_key: env('UNA_PREVIEW_API_KEY'),    
        app_origin: env('APP_ORIGIN'),
        native_app_images_url:'https://neo.so',
          
        noprefetch: false,
        // Gates `_log`. Always off in production; forks can set false in customization.
        debug: true,
        use_proxy_web: true,
        use_proxy_native: false,
        // Per-attempt API timeout. UNA list endpoints (the feed with preloaded comments) can
        // legitimately take several seconds; a timed-out GET is not retried (see fetcher.ts).
        fetch_timeout_ms: 30000,
         // Uploads (especially video) need a longer window than regular API calls.
        upload_timeout_ms: 300000,
        // Web: files over this size (MB) go straight to UNA with a one-time token instead of
        // through the Next proxy (Vercel caps request bodies at 4.5MB). 0 = always direct.
        direct_upload_over_mb: 4,
        sockets: {
            host: 'ci.una.io',
            port: '443',
            key: 'app-key',
        },
        api_keys: {
            google_maps: env('GOOGLE_MAPS_API_KEY'),
            onesignal: env('ONE_SIGNAL_API_KEY'),
            mapbox: env('RNMAPBOX_MAPS_DOWNLOAD_TOKEN'),
        },
        show_ui: true,
        app_version: '15.0.0',
        min_server_version: '15.0.0',
        stable_server_version: '15.x.x',
        multitenant: false,
        title: 'NEO',
        multitenant_images_proxy: null,// 'http://localhost:3000', // or null to disable
        use_customizations: true,
        image_allowlist_hostnames: ImageAllowlistHostnames,
    },

    ...settingsLayout,
    ...settingsForms,
    ...settingsFeed,
    ...settingsBrowse,
    ...settingsSocialActions,
    ...settingsMenus,
    ...settingsHeaderToolbar,
    ...settingsWiki,
    ...settingsTheme,
    ...settingsElements,
    ...settingsConfigs,
}
