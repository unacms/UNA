const merge = require('deepmerge');
let expoConfigCustom = {};
try {
    expoConfigCustom = require('./app.config.custom.js');
} catch (e) {}

const expoConfig = {
    "name": "NEO",
    "slug": "neo",
    "scheme": "neo",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "platforms": [
      "ios",
      "android"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.una.neo",
      "backgroundColor": "#000000"
    },
    "android": {
      "package": "com.una.neo",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
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
      "UNA_API_KEY": process.env.UNA_API_KEY,
      "UNA_URL": process.env.UNA_URL,
      "API_PROXY_URL": process.env.API_PROXY_URL,
      "PROTO": process.env.PROTO,
      "HOST": process.env.HOST,
      "PORT": process.env.PORT
    },    
};
module.exports = merge(expoConfig, expoConfigCustom);
