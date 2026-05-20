# NEO Monorepo

⚛️ A unified cross-platform codebase for web and native applications built with **Expo 54**, **Next.js 16**, and **NativeWind 4**.

---

## Table of Contents

- [About](#about)
- [Monorepo Structure](#monorepo-structure)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Commands Reference](#commands-reference)
- [Configuration](#configuration)
- [Customization Guide](#customization-guide)
- [Branch Development](#branch-development)
- [Deployment](#deployment)
- [Routing Architecture](#routing-architecture)

---

## About

NEO Monorepo is a unified codebase providing web and native UI applications for UNA CMS. It enables code sharing between platforms while maintaining platform-specific optimizations.

**Key Features:**
- Shared business logic and UI components across web and native
- UNA CMS API integration with real-time updates via Pusher
- Tailwind CSS-based design system with NativeWind
- Type-safe development with TypeScript

---

## Monorepo Structure

```
neo/
├── apps/
│   ├── next/           # Main web application (Next.js 16)
│   └── expo/           # Main native application (Expo 54 / React Native)
│
├── packages/
│   └── app/            # Shared application code (components, lib, design)
│
├── crypto-shim/        # Polyfill for crypto module
├── package.json        # Root workspace configuration
├── turbo.json          # Turborepo configuration
└── yarn.lock           # Dependency lockfile
```

### Apps Explained

| App | Purpose | Port | Tech Stack |
|-----|---------|------|------------|
| `apps/next` | **Production web app** - Main web interface for UNA | 3000 | Next.js 16, Tailwind CSS 3, NativeWind |
| `apps/expo` | **Production native app** - iOS/Android apps | - | Expo 54, React Native 0.81, NativeWind |

### Packages Explained

| Package | Purpose |
|---------|---------|
| `packages/app` | Shared application code: components, hooks, utilities, design system, settings, translations |

---

## Technology Stack

### Core Dependencies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.0 | UI framework |
| React Native | 0.81.5 | Native mobile framework |
| Expo | 54.0.x | Native development platform |
| Next.js | 16.0.6 | Web framework |
| TypeScript | 5.7+ | Type safety |
| Tailwind CSS | 3.4.17 | Styling (main apps) |
| NativeWind | 4.2.1 | Tailwind for React Native |

### Key Libraries

| Library | Purpose |
|---------|---------|
| `expo-router` | File-based routing for native |
| `solito` | Cross-platform navigation |
| `@tanstack/react-query` | Data fetching and caching |
| `zustand` | State management |
| `pusher-js` | Real-time WebSocket updates |
| `react-native-reanimated` | Native animations |
| `lucide-react` / `lucide-react-native` | Icons |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Yarn** 1.22+ (package manager - do NOT use npm)
- **Xcode** 15+ (for iOS development)
- **Android Studio** (for Android development)
- **Expo CLI** (`npm install -g expo-cli`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd neo

# Install all dependencies
yarn

# Create environment configuration
cp .env.example .env.local
```

### Environment Configuration

Create `.env.local` in the root directory:

```env
# UNA CMS Configuration
UNA_API_KEY="KEY_FROM_UNA_STUDIO"
UNA_URL=https://api.example.com
NEXT_PUBLIC_UNA_URL=https://api.example.com

# Application URLs
APP_URL=https://example.com
NEXT_PUBLIC_APP_URL=https://example.com
APP_ORIGIN=neo://app

# Server Configuration
PROTO=http:
HOST=localhost
PORT=3000
HTTPS=true
```

---

## Commands Reference

### Development Commands

| Command | Description |
|---------|-------------|
| `yarn web` | Start Next.js web app (port 3000) |
| `yarn native` | Start Expo dev server for native apps |
| `yarn ios` | Run native app on iOS simulator |
| `yarn android` | Run native app on Android emulator |
| `yarn ios:device` | Run native app on physical iOS device |

### Build Commands

| Command | Description |
|---------|-------------|
| `yarn build` | Build Next.js production bundle |
| `yarn analyze` | Analyze bundle size |

### Production Commands

| Command | Description |
|---------|-------------|
| `yarn prod` | Start production server (single instance) |
| `yarn prod:pm2` | Start production server with PM2 (clustered) |

### Utility Commands

| Command | Description |
|---------|-------------|
| `yarn clean` | Remove all node_modules directories |

### Native App Build

```bash
# Navigate to expo app
cd apps/expo

# Build dev client
expo run:ios        # iOS
expo run:android    # Android

# EAS Build (cloud)
eas build --platform ios
eas build --platform android
```

---

## Configuration

### Configuration Files Overview

The project uses a layered configuration approach separating **main/default** files (should not be modified in branches) from **custom** files (safe to modify in branches).

#### Main Files (DO NOT MODIFY IN BRANCHES)

These files contain the base configuration and should only be modified in the main NEO repository:

| File | Purpose |
|------|---------|
| `packages/app/settings-default.js` | Default application settings |
| `packages/app/translation-default.js` | Default translations |
| `packages/app/static-default.js` | Default static content |
| `packages/app/icons.default.js` | Default icon mappings |
| `packages/app/icons-svg.default.js` | Default SVG icons |
| `packages/app/design/tailwind/theme.js` | Main Tailwind theme |
| `packages/app/loading.default.js` | Default loading components |
| `packages/app/lib/functions/functions-default.js` | Default utility functions |
| `packages/app/components/*/\_map_default.js` | Default component mappings |

#### Custom Files (SAFE TO MODIFY IN BRANCHES)

These files are designed for customization in branch/client projects:

| File | Purpose |
|------|---------|
| `packages/app/settings.js` | Override settings |
| `packages/app/translation.js` | Override translations |
| `packages/app/static.js` | Override static content |
| `packages/app/icons.js` | Override/add icons |
| `packages/app/icons-svg.js` | Override/add SVG icons |
| `packages/app/design/tailwind-custom/theme.js` | Custom Tailwind theme |
| `packages/app/loading.js` | Override loading components |
| `packages/app/lib/functions/functions.js` | Override utility functions |
| `packages/app/components/*/\_map.js` | Override component mappings |
| `apps/expo/app.config.custom.js` | Native app build configuration |
| `apps/next/next.config.custom.js` | Next.js custom configuration |

---

## Customization Guide

### Settings Customization

Override settings in `packages/app/settings.js`:

```javascript
import { settingsDefault } from './settings-default';

// Override specific settings
settingsDefault.layout.defaults.name = 'ver';
settingsDefault.app.title = 'My App';

export const settings = settingsDefault;
```

### Translation Customization

Override translations in `packages/app/translation.js`:

```javascript
import { resourcesDefault } from './translation-default';

resourcesDefault.en.translation['bx_market_reviews_title'] = 'Reviews';
resourcesDefault.en.translation['custom_key'] = 'Custom Value';

export const resources = resourcesDefault;
```

### Tailwind Theme Customization

Customize theme in `packages/app/design/tailwind-custom/theme.js`:

```javascript
const colors = {
  bgrcard: {
    DEFAULT: '#ffffff',
    d: '#1a1a1a',
  },
  // Add custom colors...
};

const theme = {
  extend: {
    colors: colors,
    // Add custom theme extensions...
  },
};

module.exports = { theme, colors };
```

### Icon Customization

#### Lucide Icons (`packages/app/icons.js`)

```javascript
'use client'

import { IconSet as IconSetDefault } from './icons.default';
import { Airplane } from 'lucide-react-native';

export const IconSet = {
  'Airplane': Airplane,
  ...IconSetDefault
};
```

#### Custom SVG Icons (`packages/app/icons-svg.js`)

```javascript
'use client'
import * as SvgIconsDef from 'app/icons-svg.default';
import Svg, { Path } from 'react-native-svg';

const CustomIcon = ({ width = "100%", height = "100%", color = "#868686" }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L2 7l10 5 10-5-10-5z" fill={color} />
  </Svg>
);

export default {
  ...SvgIconsDef,
  CustomIcon
};
```

### Native App Configuration

Customize `apps/expo/app.config.custom.js`:

```javascript
module.exports = {
  name: "My App",
  owner: "myorg",
  slug: "my-app",
  scheme: "myapp",
  version: "1.0.0",
  icon: "./assets/custom/icon.png",
  splash: {
    image: "./assets/custom/splash.png",
    backgroundColor: "#ffffff",
  },
  ios: {
    bundleIdentifier: "com.myorg.myapp",
    buildNumber: "1",
  },
  android: {
    package: "com.myorg.myapp",
    versionCode: 1,
  },
  extra: {
    eas: { projectId: "your-project-id" },
    UNA_API_KEY: "your-api-key",
    NEXT_PUBLIC_UNA_URL: "https://api.yoursite.com",
    UNA_URL: "https://api.yoursite.com",
  },
};
```

### Next.js Configuration

Customize `apps/next/next.config.custom.js`:

```javascript
const nextConfigCustom = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yourdomain.com',
        pathname: '**',
      },
    ],
  },
};

module.exports = nextConfigCustom;
```

### Component Overrides

Override components by creating custom files and updating the `_map.js` file:

1. Create `packages/app/ui/molecules/custom/my-component.js`
2. Update `packages/app/ui/molecules/_map.js`:

```javascript
import { componentsMapDefault } from './_map_default';
import MyComponent from 'app/ui/molecules/custom/my-component';

componentsMapDefault['my-component'] = MyComponent;

export const componentsMap = componentsMapDefault;
```

### Static Assets

| Asset Type | Location |
|------------|----------|
| Favicon | `apps/next/public/static/favicon.svg` (or `.ico` via customization) |
| Manifest | `apps/next/public/static/manifest.json` |
| SVG Images | `apps/next/public/svg/local/` |
| App Icons | `apps/expo/assets/` |

---

## Branch Development

### Recommended `.gitignore` for Branch Projects

When creating a branch/client project, add these entries to `.gitignore` to prevent modifying main repository files:

```gitignore
# ===================================
# PROTECT MAIN REPOSITORY FILES
# ===================================

# Settings defaults (modify settings.js instead)
packages/app/settings-default.js

# Translation defaults (modify translation.js instead)
packages/app/translation-default.js

# Static defaults (modify static.js instead)
packages/app/static-default.js

# Icon defaults (modify icons.js instead)
packages/app/icons.default.js
packages/app/icons-svg.default.js

# Loading defaults (modify loading.js instead)
packages/app/loading.default.js

# Main theme (modify tailwind-custom/theme.js instead)
packages/app/design/tailwind/theme.js

# Default component maps (modify _map.js instead)
packages/app/components/**/_map_default.js
packages/app/ui/**/_map_default.js

# Function defaults (modify functions.js instead)
packages/app/lib/functions/functions-default.js

# Feed items defaults
packages/app/lib/feed-items_default.js

# ===================================
# ALLOWED CUSTOM FILES (DO NOT IGNORE)
# ===================================
# packages/app/settings.js
# packages/app/translation.js
# packages/app/static.js
# packages/app/icons.js
# packages/app/icons-svg.js
# packages/app/loading.js
# packages/app/design/tailwind-custom/theme.js
# packages/app/components/**/_map.js
# packages/app/ui/**/_map.js
# packages/app/lib/functions/functions.js
# apps/expo/app.config.custom.js
# apps/next/next.config.custom.js
```

### Branch Workflow

1. **Create branch from main**
2. **Never modify** `*-default.js` or main configuration files
3. **Only modify** designated custom files
4. **Keep changes isolated** to custom files for easy rebasing

---

## Deployment

### Vercel Deployment

The web app is configured for Vercel with `apps/next/vercel.json`:

```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && yarn install",
  "buildCommand": "yarn build",
  "outputDirectory": ".next"
}
```

**Steps:**
1. Connect your repository to Vercel
2. Set root directory to `apps/next`
3. Configure environment variables in Vercel dashboard
4. Deploy

### Self-Hosted Node Server

#### Single Instance

```bash
# Build the application
yarn build

# Start production server
yarn prod
```

#### PM2 Cluster Mode

```bash
# Install PM2 globally
npm install -g pm2

# Build and start with PM2
yarn build
yarn prod:pm2
```

PM2 configuration in `apps/next/pm2.config.js`:
- **Local/Dev:** 2 instances, 250MB memory limit
- **Production:** 4 instances, 1GB memory limit

#### PM2 Management Commands

```bash
pm2 list              # View running processes
pm2 logs neoapp       # View logs
pm2 restart neoapp    # Restart application
pm2 stop neoapp       # Stop application
pm2 delete neoapp     # Remove from PM2
```

### Native App Distribution

#### EAS Build (Recommended)

```bash
cd apps/expo

# Development build
eas build --profile development --platform ios
eas build --profile development --platform android

# Production build
eas build --profile production --platform ios
eas build --profile production --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

#### Local Build

```bash
cd apps/expo

# iOS (requires macOS + Xcode)
expo run:ios --configuration Release

# Android
expo run:android --variant release
```

---

## Routing Architecture

NEO uses a hybrid routing strategy:

- **Native (Expo):** File-based routing with `expo-router` in `apps/expo/app/`
- **Web (Next.js):** App Router in `apps/next/app/`
- **Cross-platform navigation:** `solito` for shared navigation patterns

Agent and UNA integration guidance (including routing context) lives in [`agents.md`](./agents.md) at the repo root and in the [`una-api` skill](.agents/skills/una-api/SKILL.md).

---

## Adding Dependencies

### Pure JS Dependencies (Cross-Platform)

```bash
cd apps/expo
yarn add package-name
cd ../..
yarn
```

Then add to `transpilePackages` in `apps/next/next.config.js`:

```javascript
transpilePackages: [
  'react-native',
  'react-native-web',
  'package-name',  // Add here
  // ...
]
```

### Web-Only Dependencies

```bash
cd apps/next
yarn add package-name
cd ../..
yarn
```

### Native-Only Dependencies

```bash
cd apps/expo
yarn add package-name
cd ../..
yarn
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Module not found | Run `yarn clean && yarn` |
| Metro bundler cache | Run `yarn native --clear` |
| Next.js cache | Delete `.next` folder and rebuild |
| iOS pods outdated | `cd apps/expo/ios && pod install` |
| Type errors | Run `yarn typecheck` to identify issues |

### Useful Debug Commands

```bash
# Check workspace dependencies
yarn workspaces info

# Analyze bundle
yarn analyze

# Clean all caches
yarn clean
rm -rf apps/expo/.expo
rm -rf apps/next/.next
yarn
```

---

## License

See [LICENSE](./LICENSE) for details.
