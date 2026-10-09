# NEO

NEO is the web and native client for [UNA CMS](https://unacms.com). One codebase in `packages/app` runs as a Next.js site (`apps/next`) and as an Expo app for iOS and Android (`apps/expo`). UNA describes the pages and their blocks through its API, and NEO renders them on every platform.

- **Contributing to NEO:** NEO is developed in the [UNA repository](https://github.com/unacms/UNA) at `neo/`. Branch from `master` there and open a pull request against unacms/UNA. [unacms/neo](https://github.com/unacms/neo) is a read-only mirror of that folder; don't open pull requests on it.
- **Building a client project:** fork [unacms/neo](https://github.com/unacms/neo), change only `packages/app/customization/`, and sync your fork from unacms/neo `main` to take updates.

[AGENTS.md](AGENTS.md) is the guide for both, for people and coding agents: the rules for forks, every customization seam, the architecture and the code conventions. This README covers setup and deployment.

## Repository layout

```
apps/next        Next.js web app
apps/expo        Expo app for iOS and Android
packages/app     shared code (design system, components, UNA client, settings)
  customization/ the only folder a fork changes
scripts/         typecheck, customization merge and translation checks
patches/         patch-package patches, applied on install
```

Stack: Next.js 16 (webpack), React 19.2, Expo SDK 57 with React Native 0.86, TypeScript 6, Tailwind CSS 4 on web and Uniwind on native, Node 24 and Yarn 1 workspaces. `package.json` files hold the exact versions.

## Setup

Requirements:

- Node.js 24 and Yarn 1.22 (use Yarn, not npm).
- For iOS: macOS with Xcode. For Android: Android Studio with an emulator or a device. Use the Xcode and Android SDK versions that Expo SDK 57 supports.
- A UNA site. In UNA Studio → API, add an API key and the origins NEO uses (the web app URL, and `APP_ORIGIN` for the native app).

```bash
yarn            # from the NEO root (neo/ in the UNA repo)
```

`yarn.lock` is not committed, so `yarn` resolves the version ranges in `package.json` afresh. Keep your local `yarn.lock` between installs, and don't edit dependency ranges unless you mean to upgrade.

Create `.env.local` in the NEO root:

```env
UNA_URL=https://una.example.com
NEXT_PUBLIC_UNA_URL=https://una.example.com
UNA_API_KEY=key-from-una-studio
APP_URL=https://app.example.com
NEXT_PUBLIC_APP_URL=https://app.example.com
APP_ORIGIN=neo://app
```

| Variable | Used for |
|---|---|
| `UNA_URL`, `NEXT_PUBLIC_UNA_URL` | The UNA site. On web, `NEXT_PUBLIC_UNA_URL` wins. |
| `UNA_API_KEY` | UNA API key. Server only: the web proxy and page shell send it. Never ship it in the native app. |
| `APP_URL`, `NEXT_PUBLIC_APP_URL` | The NEO web app's own URL. |
| `APP_ORIGIN` | The `Origin` header the native app sends to UNA; UNA must allow it. |
| `UNA_PREVIEW_DOMAIN`, `NEXT_PUBLIC_UNA_PREVIEW_DOMAIN`, `UNA_PREVIEW_API_KEY` | Optional. Routes `pr-<n>.<domain>` to a preview UNA backend. |
| `GOOGLE_WEB_CLIENT_ID` | Optional. Google sign-in. Google sign-in doesn't work on `.localhost` URLs. |
| `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional. Maps. |
| `ONE_SIGNAL_API_KEY` | Optional. Push notifications. |
| `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` | Optional. Downloads the Mapbox native SDK at build time. |
| `EAS_PROJECT_ID` | Optional. EAS builds and updates. |
| `REDIS_URL` | Multi-tenant mode only: the domain map. |
| `PORT`, `HOST`, `PROTO`, `HTTPS` | Self-hosted web server (`apps/next/pm2.config.js`). |
| `NEO_IMAGES_ALLOW_LOCAL_IP` | Local development only. `1` lets `next/image` load images from a UNA on your machine or network; see below. |

Next.js refuses to optimize an image whose host resolves to a private IP address (`127.0.0.1`, `::1`, `10.x`, `192.168.x`, ...). Against a local UNA (`UNA_URL=http://localhost:8088`), the dev server then logs "upstream image ... hostname resolved to private IP" and `/_next/image` answers 400 for every UNA image. Set `NEO_IMAGES_ALLOW_LOCAL_IP=1` in `.env.local` and restart the dev server; it turns on Next's `images.dangerouslyAllowLocalIP`.

Never set it on a deployed server. The check stops server-side request forgery (SSRF): `/_next/image` fetches any URL on the image allowlist, and the allowlist includes `localhost` on every port. With the flag on, anyone can make the server request its own internal services through the image optimizer.

The native app resizes images through the optimizer at `config.native_app_images_url`, a deployed NEO site by default. That site can't reach your local UNA, so the request fails and the app loads UNA's image URL directly. If you point `native_app_images_url` at your local web dev server, the same flag applies there.

The web build on Vercel goes through Turborepo, which hides variables that `turbo.json` `globalEnv` doesn't list. Add new variables there.

## Commands

Run every command from the NEO root. The scripts load `.env.local`; running `next` or `expo` directly doesn't.

| Command | What it does |
|---|---|
| `yarn web2` | Next.js dev server on port 3000 (`yarn web2 -p 3001` for another port). |
| `yarn web` | The same through [portless](https://github.com/vercel-labs/portless) at `neo.localhost` (needs the global `portless` CLI). |
| `yarn native` | Metro for the native app, with a cleared cache. |
| `yarn ios --device <udid or name>` | Builds the iOS app, installs it on a simulator and starts Metro. |
| `yarn ios:device <udid>` | The same on a physical iPhone. |
| `yarn android` | Builds and installs the Android app. Add `--no-bundler` when Metro already runs. |
| `yarn build` | Production build of the web app. |
| `yarn prod2`, `yarn prod`, `yarn prod:pm2` | Serve the production web build: plain, through portless, or with PM2. |
| `yarn analyze` | Web bundle analysis. |
| `yarn typecheck` | TypeScript check of web and native (`yarn typecheck web` for one platform). |
| `yarn lint` | ESLint, including the React Compiler rules. |
| `yarn clean` | Deletes every `node_modules`. |

`apps/expo/ios` and `apps/expo/android` are generated (`expo prebuild`) and not committed. The first `yarn ios` or `yarn android` creates them. After you change `apps/expo/app.config.js`, a config plugin, fonts or a native dependency, run the build again so prebuild picks up the change. The debug app loads its JavaScript from Metro on port 8081.

## Deployment

### Web on Vercel

Create a Vercel project from your repository with Root Directory `apps/next`, and set the environment variables above in the project settings.

### Web on your own server

```bash
yarn build
yarn prod2          # or: yarn prod:pm2
```

`yarn prod:pm2` starts the `neoapp` PM2 process from `apps/next/pm2.config.js`: 2 instances with a 250 MB memory limit, or 4 instances with 1 GB in the production profile. The `Dockerfile` builds an image the same way; it needs a `yarn.lock` in the build context.

### Native apps

Build store and test builds with [EAS Build](https://docs.expo.dev/build/introduction/). The repository has no `eas.json`; a fork adds `apps/expo/eas.json` with its own profiles, and sets the environment variables in EAS, because `.env.local` isn't uploaded. `.easignore` makes EAS upload your local `yarn.lock`, so the cloud build installs the versions you tested.

```bash
cd apps/expo
eas build --profile production --platform ios
eas build --profile production --platform android
```

## Troubleshooting

| Problem | Try |
|---|---|
| Module not found after pulling | `yarn`, then restart Metro (`yarn native`) or the dev server. |
| Native app shows an old screen or a red box about a native module | The native code changed: rebuild with `yarn ios` / `yarn android`. |
| Stale web build | Delete `apps/next/.next` and restart. |
| Type errors | `yarn typecheck`. The Next build ignores type errors, so this is the only check. |

## License

See [LICENSE](LICENSE).
