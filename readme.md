# NEO Monorepo
⚛️ Expo52 + NextJS14 + Nativewind4


## 🔦 About

NEO Monorepo is a unified codebase for web and native UI apps for UNA. 

## 🏁 Start the app

- Install dependencies: `yarn`

- Next.js local dev: `yarn web`
  - Runs `yarn next`
    
- Expo local dev:
  - First, build a dev client onto your device or simulator
    - `cd apps/expo`
    - Then, either `expo run:ios`, or `eas build`
  - After building the dev client, from the root of the monorepo...
    - `yarn native` (This runs `expo start --dev-client`)

- Add configutaion file .env.local in root folder

```UNA_API_KEY="KEY_FROM_UNA_STUDIO"
PROTO="http:"
HOST="localhost"
PORT="3000"
HTTPS=true

APP_ORIGIN = origin scheme, example - neo://app

NEXT_PUBLIC_UNA_URL = URL of UNA instance, example - https://api.neo.so
NEXT_PUBLIC_APP_URL = URL of NEO instance, example - https://neo.so
UNA_URL = URL of UNA instance, example - https://api.neo.so
APP_URL = URL of NEO instance, example - https://neo.so

```


## 🆕 Add new dependencies

### Pure JS dependencies

If you're installing a JavaScript-only dependency that will be used across platforms, install it in `apps/expo`:

```sh
cd apps/expo
yarn add date-fns
cd ../..
yarn
```
then add it to next.config.js in transpilePackages like

```  transpilePackages: [
    'react-native',
    'react-native-web',
    ...
```

### Next.JS dependencies

If you're installing a library for web version only, you must install it in `apps/next`:

```sh
cd apps/next
yarn add react-native-reanimated

cd ../..
yarn
```

## 🛠️ List of files that can be changed for customization

### apps\next\next.config.custom.js - allows you to change configuration for native apps's build

Example:
```

module.exports = {
  "name": "Weave",
  "owner": "unacms", 
  "slug": "neo-weave",
  "scheme": "weave",
  "version": "1.1.8",
  "icon": "./assets/testsite/icon.png",
  "splash": {
    "image": "./assets/testsite/splash.png",
    "contentFit": "contain",
    "backgroundColor": "#ffffff",
    "timeout":4000
  },
  "ios": {
    "bundleIdentifier": "com.testsite.app",
    "associatedDomains": ["applinks:testsite.com"],
    "buildNumber": "1181",
    "entitlements": {
      "aps-environment": "production"
    },
    "userInterfaceStyle": "automatic",
    "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera allow calls in Jitsi.",
        "NSPhotoLibraryUsageDescription": "This app uses the camera allow calls in Jitsi.",
        "NSPhotoLibraryAddUsageDescription": "This app uses the camera allow calls in Jitsi.",
        "NSMicrophoneUsageDescriptionin": "This app uses the mic allow calls in Jitsi.",
        "NSCalendarsUsageDescription": "See your scheduled meetings in Jitsi.",
        "NSLocationWhenInUseUsageDescription": "Quick contacts between users.",
        "UIUserInterfaceStyle": "Light",
        "LSMinimumSystemVersion": "14.0",
        "OneSignal_disable_badge_clearing": "NO"
      },
  },
  "android": {
    "package": "com.testsite.app",
    "versionCode": "1181",
    "gradlePath": "gradle/wrapper/gradle-wrapper.properties",
    "kotlinVersion": "1.9.25",
    "adaptiveIcon": {
      "foregroundImage": "./assets/testsite/adaptive-icon.png",
    },
    "permissions":  [
      "android.permission.ACCESS_NETWORK_STATE", 
      "android.permission.CAMERA", 
      "android.permission.INTERNET"
    ],
    "intentFilters": [
      {
        "action": "VIEW",
        "data": [
          {
            "scheme": "https",
            "host": "testsite.com",
            "pathPrefix": "/"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  "extra": {
    "eas": {
      "projectId": "---"
    },
    "UNA_API_KEY": "---",

    "NEXT_PUBLIC_UNA_URL": "https://api.testsite.com",
    "UNA_URL": "https://api.testsite.com",
    "NEXT_PUBLIC_APP_URL": "https://testsite.com",
    "APP_URL": "https://testsite.com",
    "APP_ORIGIN" : "testsite://app",
    "PROTO": "http:",
    "HOST": "localhost",
    "PORT": "3000",
    "HTTPS": true
  },
  plugins: [
    [
      "expo-router",
      {
       
      }
    ],
    [
      "expo-video",
      {
        "supportsBackgroundPlayback": false,
        "supportsPictureInPicture": false
      }
    ],
    [
      "onesignal-expo-plugin",
      {
        mode: "production",
        smallIcons:["./assets/testsite/ic_stat_onesignal_default.png"],
        largeIcons:["./assets/testsite/ic_onesignal_large_icon_default.png"]
      }
    ],
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '15.1',
        },
        android: {
          minSdkVersion: 29, // Android 10
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          buildToolsVersion: "35.0.0",
          kotlinVersion: '1.9.25'
        }
      },
    ],
  ],
};


```

### apps\next\next.config.custom.js - allows you to change next.JS configuration

```
const nextConfigCustom = {
    images: {
        remotePatterns: [
            {
              protocol: 'https',
              hostname: 'dev.test.com',
              pathname: '**',
            },
        ]
    }
};

module.exports = nextConfigCustom;

```

### settings.js - allows you to override default/add new settings  

Example:
```
import { settingsDefault } from './settings-default';
settingsDefault.layout.default_layout = 'hor';
...
export const settings = settingsDefault;
```

### translation.js - allows you to override default/add new translations

```
import { resourcesDefault } from './translation-default';
resourcesDefault.en.translation['bx_market_reviews_title'] = 'Reviews'
...
export const resources = resourcesDefault;
```

### static.js - allows you to override default/add new static content or design parts 

```
import { staticDefault } from './static-default';
const LogoMark = (
    <Svg width={46} height={46} viewBox="0 0 46 46" >
        <G stroke="#6941C6" strokeWidth={2}>
            <Path
                d="M4 11a8 8 0 0116 0v7a1 1 0 01-1 1h-7a8 8 0 01-8-8zM26 26a1 1 0 011-1h7a8 8 0 11-8 8v-7zM4 33a8 8 0 018-8h7a1 1 0 011 1v7a8 8 0 11-16 0z"
                fill="#6941C6"
            />
            <Path d="M26 11a8 8 0 118 8h-7a1 1 0 01-1-1v-7z" />
        </G>
        <Defs></Defs>
    </Svg>
)
...
staticDefault.logo_mark = LogoMark;
export const staticComponents = staticDefault;
```

### override default/add new icons 

#### icons.js - icons for native app from phosphor-react-native

```
'use client'

import { IconSet as IconSetDedault } from './icons.default';
import { Airplane}  from "phosphor-react-native";


export const IconSet = {
	'Airplane': Airplane,
	...IconSetDedault
}
```

#### icons-svg.js - custom SVG icons

```
'use client'
import * as SvgIconsDef from  'app/icons-svg.default';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg'

const CustomIcon = ({ width = "100%", height = "100%", color="#868686" }) => (
	<Svg width={width} height={height} viewBox="0 0 17 18" fill="none" >
		<Path fillRule="evenodd" clipRule="evenodd" d="M12.9107 0.836272C13.5087 0.134793 14.5621 0.0509244 15.2636 0.648949C15.9651 1.24697 16.049 2.30043 15.4509 3.00191L10.4143 8.90987L9.13989 9.64897C8.11983 10.2406 6.92313 9.22034 7.34587 8.11953L7.87402 6.74423L12.9107 0.836272ZM14.4527 1.60019C14.2766 1.45004 14.0121 1.4711 13.8619 1.64722L8.96417 7.39224L8.51278 8.56766L9.60197 7.93598L14.4997 2.19096C14.6499 2.01484 14.6288 1.75034 14.4527 1.60019ZM4.39467 2.32223C3.13147 2.32223 2.125 3.32694 2.125 4.54485V12.3556C2.59826 12.0068 3.17737 11.7998 3.81136 11.7998H14.6247V7.06102C14.6247 6.71584 14.9045 6.43602 15.2497 6.43602C15.5948 6.43602 15.8747 6.71584 15.8747 7.06102V11.7998L15.875 13.0498H14.4273V16.6972H15.6587C16.0039 16.6972 16.2837 16.977 16.2837 17.3222C16.2837 17.6674 16.0039 17.9472 15.6587 17.9472H3.81136C2.15615 17.9472 0.875 16.5366 0.875 14.8735V4.54485C0.875 2.61736 2.4605 1.07223 4.39467 1.07223H8.73666C9.08184 1.07223 9.36166 1.35205 9.36166 1.69723C9.36166 2.0424 9.08184 2.32223 8.73666 2.32223H4.39467ZM13.1773 16.6972V13.0498H3.81136C2.91351 13.0498 2.125 13.8318 2.125 14.8735C2.125 15.9152 2.91351 16.6972 3.81136 16.6972H13.1773Z" fill={color} />
	</Svg>

)

export default {
    ...SvgIconsDef,
    CustomIcon
};

```

### packages\app\design\tailwind-custom\theme.js - override default/customize tailwind theme

```
const colors = {
  screen: {
      DEFAULT: '#f3f4f6',
      d: '#030712',
  },
}
const theme = {
   extend: {
    colors: colors,
    aspectRatio: {
        '3/1': '3 / 1',
        '4/1': '4 / 1',
        '5/1': '5 / 1',
        '5/2': '5 / 2',
    },
  },
}
module.exports = { theme, colors };

```

### packages\app\lib\functions\functions.js - override default/customize common functions

```
...
export function getBadgeForTab(currentUser, url) {
    ...
}
...

```

### override default/add new elements 

1) create folder "custom" in packages\app\ui\molecules\
2) add needed file in packages\app\ui\molecules\custom
3) modify packages\app\ui\molecules\_map.js

```
import Reports from 'app/ui/molecules/custom/reports';
import { componentsMapDefault } from './_map_default';

componentsMapDefault.reports = Reports

export const componentsMap = componentsMapDefault

```

### override default/add new service workers 

1) create folder "custom" in packages\app\ui\workers\
2) add needed file in packages\app\ui\workers\custom
3) modify papackages\app\ui\workers\_map.js

```
import { componentsMapDefault } from 'app/ui/workers/_map_default';

import Counters from 'app/ui/workers/custom/counters';
componentsMapDefault['Counters'] = Counters;

export const componentsMap = componentsMapDefault

```

### override default/add new page blocks 

1) create folder "custom" in packages\app\components\elements\
2) add needed file in packages\app\components\elements\custom
3) modify packages\app\components\elements\_map.js

```
import { componentsMapDefault } from './_map_default';

import EntityCover from './custom/entity_cover';
componentsMapDefault.entity_cover = EntityCover;

export const componentsMap = componentsMapDefault
```

### override default/add new form fields

1) create folder "custom" in packages\app\components\form-fields\
2) add needed file in packages\app\components\form-fields\custom
3) modify packages\app\components\form-fields\_map.js

```
import { componentsMapDefault } from './_map_default';

import EntityCover from './custom/entity_cover';
componentsMapDefault.entity_cover = EntityCover;

export const componentsMap = componentsMapDefault
```

### override default/add new forms

1) create folder "custom" in packages\app\components\form\
2) add needed file in packages\app\components\form\custom
3) modify packages\app\components\form\_map.js

```
import { componentsMapDefault } from './_map_default';

import EntityCover from './custom/entity_cover';
componentsMapDefault.entity_cover = EntityCover;

export const componentsMap = componentsMapDefault
```

### override default/add new menu items

1) create folder "custom" in packages\app\components\menu-items\
2) add needed file in packages\app\components\menu-items\custom
3) modify packages\app\components\menu-items\_map.js

```
import { componentsMapDefault } from './_map_default';

import EntityCover from './custom/entity_cover';
componentsMapDefault.entity_cover = EntityCover;

export const componentsMap = componentsMapDefault
```

### override default/add new page layouts

1) create folder "custom" in packages\app\components\page-layout\
2) add needed file in packages\app\components\page-layout\custom
3) modify packages\app\components\page-layout\_map.js

```
import { componentsMapDefault } from './_map_default';
import PageCustomPost from 'app/components/page-layout/custom/post';
componentsMapDefault['post-new'] = PageCustomPost;
export const componentsMap = componentsMapDefault

```

### override default/add new skeletons

1) create folder "custom" in packages\app\components\skeletons\
2) add needed file in packages\app\components\skeletons\custom
3) modify packages\app\components\skeletons\_map.js

```
import { skeletonsMapDefault } from './_map_default';
import {Market, Jobs, Persons} from 'app/components/skeletons/custom/skeletons';
skeletonsMapDefault['bx_market'] = Market;
skeletonsMapDefault['bx_jobs'] = Jobs;
skeletonsMapDefault['bx_persons'] = Persons;
skeletonsMapDefault['bx_organizations'] = Persons;
export const skeletonsMap = skeletonsMapDefault

```

### override default/add new common units

1) create folder "custom" in packages\app\components\units\
2) add needed file in packages\app\components\units\custom
3) modify packages\app\components\units\_map.js

```
import { componentsMapDefault } from './_map_default';
import Feed from 'app/components/units/custom/feed';
componentsMapDefault['feed'] = Feed;
export const componentsMap = componentsMapDefault

```

### override default/add new content units

1) create folder "custom" in packages\app\components\units\content-list\
2) add needed file in packages\app\components\units\content-list\custom
3) modify packages\app\components\units\content-list\_map.js

```
import { componentsMapDefault } from './_map_default';
import UnitGroup from 'app/components/units/content-list/custom/bx_groups';
componentsMapDefault['bx_groups'] = UnitGroup;
export const componentsMap = componentsMapDefault

```

### override default/add new profile units

1) create folder "custom" in packages\app\components\units\profile-list\
2) add needed file in packages\app\components\units\profile-list\custom
3) modify packages\app\components\units\profile-list\_map.js

```
import { componentsMapDefault } from './_map_default';
import UnitGroup from 'app/components/units/profile-list/custom/bx_groups';
componentsMapDefault['bx_groups'] = UnitGroup;
export const componentsMap = componentsMapDefault

```