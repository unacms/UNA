const merge = require('deepmerge');
let expoConfigCustom = {};
try {
    expoConfigCustom = require('./app.config.custom.js');
} catch (e) { }

const expoConfig = {
    "name": "NEO",
    "slug": "neo",
    "scheme": "neo",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "splash": {
        "image": "./assets/images/splash.png",
        "contentFit": "contain",
        "timeout": 0,
        "backgroundColor": "#111827"
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
            "NSCameraUsageDescription": "This app uses the camera allow calls in Jitsi.",
            "NSPhotoLibraryUsageDescription": "This app uses the camera allow calls in Jitsi.",
            "NSPhotoLibraryAddUsageDescription": "This app uses the camera allow calls in Jitsi.",
            "NSMicrophoneUsageDescriptionin": "This app uses the mic allow calls in Jitsi.",
            "NSCalendarsUsageDescription": "See your scheduled meetings in Jitsi.",
            "NFCReaderUsageDescription": "Quick contacts between users.",
            "NSBluetoothAlwaysUsageDescription": "Quick contacts between users.",
            "NSBluetoothPeripheralUsageDescription": "Quick contacts between users.",
            "NSLocationWhenInUseUsageDescription": "Quick contacts between users.",
            "UIUserInterfaceStyle": "Automatic",
            "OneSignal_disable_badge_clearing": "YES"
        },
        "entitlements": {
            "aps-environment": "development"
        }
    },
    "android": {
        "package": "com.neo.so",
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
            "android.permission.FOREGROUND_SERVICE",
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
            "android.permission.SCHEDULE_EXACT_ALARM"
        ],
        "adaptiveIcon": {
            "foregroundImage": "./assets/images/adaptive-icon.png",
            "backgroundColor": "#ffffff"
        },
        "config": {
            "googleMaps": {
                "apiKey": "AIzaSyAhrci201-9xXIRAy0kLOHFGppeTk8AHmo"
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
        "UNA_URL": process.env.UNA_URL,
        "API_PROXY_URL": process.env.API_PROXY_URL,
        "APP_ORIGIN": process.env.APP_ORIGIN,
        "PROTO": process.env.PROTO,
        "HOST": process.env.HOST,
        "PORT": process.env.PORT,
        "APP_URL": process.env.APP_URL,
        "EXPO_OS": "native",
    },
    plugins: [
        [
    "expo-web-browser"
  ],

        ["expo-router", {}],
        ["@rnmapbox/maps", {"RNMapboxMapsDownloadToken": "sk.eyJ1Ijoicm9tYW5sZXMiLCJhIjoiY204Zm9sMWMzMGJiaTJqcXRvdmpseHBuaiJ9.uajA_y3AmjRkBYgy4i2RdQ"}],
        ["expo-video", {"supportsBackgroundPlayback": false, "supportsPictureInPicture": false}],
        // ["@stripe/stripe-react-native", {"merchantIdentifier": "merchantIdentifier","enableGooglePay": true}],
        ["expo-build-properties", 
            {
                ios: {
                    deploymentTarget: '15.1',
                },
                android: {
                    minSdkVersion: 29, // Android 10
                    compileSdkVersion: 35,
                    targetSdkVersion: 35,
                    buildToolsVersion: "35.0.0"
                }
            },
        ]
        /*[
          "onesignal-expo-plugin",
          {
            mode: "development",
            smallIcons:["./assets/images/ic_stat_onesignal_default.png"],
            largeIcons:["./assets/images/ic_onesignal_large_icon_default.png"]
          }
        ],*/
        /* [
           "react-native-ble-plx",
           {
             "isBackgroundEnabled": true,
             "modes": ["peripheral", "central"],
             "bluetoothAlwaysPermission": "Allow $(PRODUCT_NAME) to connect to bluetooth devices"
           }
         ],*/
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

//console.log("merge(expoConfig, expoConfigCustom)", merge(expoConfig, expoConfigCustom))

module.exports = merge(expoConfig, expoConfigCustom);
