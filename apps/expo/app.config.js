const merge = require('deepmerge');
const withPinFbjni = require('./plugins/with-pin-fbjni');
let expoConfigCustom = {};
try {
    expoConfigCustom = require('app/customization/config/app.config.js');
} catch (e) { }

const expoConfig = {
    "name": "NEO",
    "slug": "neo",
    "scheme": "neo",
    "version": "1.0.0",
    // OTA (EAS Update): forks set EAS_PROJECT_ID / override updates via customization/config/app.config.js
    "runtimeVersion": {
        "policy": "appVersion",
    },
    "updates": {
        "enabled": false,
        "checkAutomatically": "ON_LOAD",
        "fallbackToCacheTimeout": 0,
        // Forks: set EAS_PROJECT_ID in env (or override updates.url / enabled in customization/config/app.config.js)
       // "url": `https://u.expo.dev/##EAS_PROJECT_ID##`,
    },
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "splash": {
        "image": "./assets/images/splash.png",
        "contentFit": "contain",
        "resizeMode": "contain",
        "timeout": 0,
        "backgroundColor": "#111827",
         // Expo 52+ splash plugin: centered logo size (dp). Fullscreen iOS via enableFullScreenImage_legacy.
        "imageWidth": 280,
        "enableFullScreenImage_legacy": true,
    },
    "experiments": {
        "autolinkingModuleResolution": true,
        // React Compiler via babel-preset-expo (app code only, not node_modules).
        // Same rules as web: components violating the Rules of React are skipped;
        // opt a file out with 'use no memo'. Forks: override in
        // customization/config/app.config.js (`experiments.reactCompiler: false`).
        "reactCompiler": true
    },
    "platforms": [
        "ios",
        "android"
    ],
    "userInterfaceStyle": "automatic",
    "ios": {
        "supportsTablet": true,
        "associatedDomains": ["neo.so"],
        "bundleIdentifier": "com.neo.so",
        "backgroundColor": "#111827",
        "infoPlist": {
            "NSCameraUsageDescription": "Application uses the camera to take photos for your profile and posts, and for video during calls—for example, a profile picture or a video call.",
            "NSPhotoLibraryUsageDescription": "Application accesses your photo library so you can choose photos and videos for your profile, posts, and messages.",
            "NSPhotoLibraryAddUsageDescription": "Application can save photos to your library when you download images from the app.",
            "NSMicrophoneUsageDescription": "Application uses the microphone so others can hear you during voice and video calls in the app.",
            "NSCalendarsUsageDescription": "Application can add scheduled video calls and events to your calendar as reminders.",
            "NSLocationWhenInUseUsageDescription": "Application uses your location to show distance to events you've joined and to set a place on your profile or posts.",
            "UIUserInterfaceStyle": "Automatic",
            "OneSignal_disable_badge_clearing": "YES",
            "ITSAppUsesNonExemptEncryption": false
        },
        "entitlements": {
            "aps-environment": "development"
        }
    },
    "android": {
        "package": "com.neo.so",
        "softwareKeyboardLayoutMode": "resize",
        "permissions": [
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.CAMERA",
            "android.permission.CAMERA_ROLL",
            "android.permission.INTERNET",
            "android.permission.MANAGE_OWN_CALLS",
            "android.permission.MODIFY_AUDIO_SETTINGS",
            "android.permission.RECORD_AUDIO",
            "android.permission.WAKE_LOCK",
            "android.permission.ACCESS_WIFI_STATE",
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.ACCESS_BACKGROUND_LOCATION",
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.NFC",
            "android.permission.BLUETOOTH",
            "android.permission.BLUETOOTH_ADMIN",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.BLUETOOTH_SCAN",
            "android.permission.BLUETOOTH_CONNECT",
            "android.permission.BLUETOOTH_ADVERTISE",
            "android.permission.WAKE_LOCK",
            "android.permission.RECEIVE_BOOT_COMPLETED",
            "com.google.android.c2dm.permission.RECEIVE",
            "android.permission.SCHEDULE_EXACT_ALARM",
            "android.permission.POST_NOTIFICATIONS"
        ],
        "adaptiveIcon": {
            "foregroundImage": "./assets/images/adaptive-icon.png",
            "backgroundColor": "#ffffff"
        },
        "config": {
            "googleMaps": {
                "apiKey": process.env.GOOGLE_MAPS_API_KEY
            }
        },
        "intentFilters": [
            {
                "action": "VIEW",
                "data": [
                    {
                        "scheme": "https",
                        "host": "neo.so",
                        "pathPrefix": "/"
                    }
                ],
                "category": ["BROWSABLE", "DEFAULT"]
            }
        ]
    },
    extra: {
        "eas": {
        "projectId": process.env.EAS_PROJECT_ID
        },
        "UNA_URL": process.env.UNA_URL,
        "API_PROXY_URL": process.env.API_PROXY_URL,
        "APP_ORIGIN": process.env.APP_ORIGIN,
        "PROTO": process.env.PROTO,
        "HOST": process.env.HOST,
        "PORT": process.env.PORT,
        "APP_URL": process.env.APP_URL,
        "GOOGLE_WEB_CLIENT_ID": process.env.GOOGLE_WEB_CLIENT_ID,
        "EXPO_OS": "native",
    },
    plugins: [
        "expo-web-browser",
        ["expo-router", {}],
        [
            "expo-maps",
            {
                "requestLocationPermission": true,
                "locationPermission": "Allow $(PRODUCT_NAME) to use your location"
            }
        ],
        ["expo-video", {"supportsBackgroundPlayback": false, "supportsPictureInPicture": false}],
        [
            "expo-audio",
            {
                "microphonePermission": false,
                "recordAudioAndroid": false,
            },
        ],
        "./plugins/with-expo-audio-no-foreground-services.js",
        "./plugins/with-disable-enriched-markdown-math.js",
        // Lucide as native template images (iOS asset catalog, Android vector drawables)
        // for Expo UI buttons and NativeTabs (`expo_ui.iosIconSource` / `androidIconSource`).
        "./plugins/with-lucide-assets.js",
        // Android NativeTabs bar takes its items' height (no 80dp floor), so it
        // is shorter with `native.tab_labels` off.
        "./plugins/with-android-tab-bar-height.js",
        [
            "expo-image-picker",
            {
                photosPermission: "Application accesses your photo library so you can choose photos and videos for your profile, posts, and messages.",
                cameraPermission: "Application uses the camera to take photos for your profile and posts, and for video during calls—for example, a profile picture or a video call.",
            },
        ],
        "expo-image",
        "expo-splash-screen",
        "expo-status-bar",
        // merchantIdentifier / enableGooglePay can be overridden in customization/config/app.config.js
        ["@stripe/stripe-react-native", { enableGooglePay: false }],
        ["expo-build-properties", 
            {
                ios: {
                    deploymentTarget: '16.4',
                    // UIKit scene lifecycle (ExpoAppSceneDelegate + UIApplicationSceneManifest):
                    // apps built with the iOS 27 SDK (Xcode 27) are killed at launch on iOS 27
                    // without it. Needs expo >= 57.0.23; a no-op (with a warning) from SDK 58.
                    enableSceneSupport: true,
                },
                android: {
                    minSdkVersion: 29, // Android 10
                    compileSdkVersion: 36,
                    targetSdkVersion: 36,
                    buildToolsVersion: "36.0.0"
                }
            },
        ],
    ],
};

if (typeof (expoConfigCustom.ios?.infoPlist) !== 'undefined')
    expoConfig.ios.infoPlist = {};

if (typeof (expoConfigCustom.ios?.associatedDomains) !== 'undefined')
    expoConfig.ios.associatedDomains = [];

if (typeof (expoConfigCustom.android?.permissions) !== 'undefined')
    expoConfig.android.permissions = [];

if (typeof (expoConfigCustom.android?.intentFilters) !== 'undefined')
    expoConfig.android.intentFilters = [];

if (typeof (expoConfigCustom.plugins) !== 'undefined')
    expoConfig.plugins = [];

// Applied after the merge so forks that replace `plugins` still get it.
module.exports = withPinFbjni(merge(expoConfig, expoConfigCustom));
