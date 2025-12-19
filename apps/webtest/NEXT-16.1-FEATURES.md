# Next.js 16.1 Features - webtest App

This document outlines the Next.js 16.1 features enabled in the webtest application.

## Enabled Features

### 1. Turbopack File System Caching (Stable) ✅

**Configuration:** `turbopackFileSystemCache: true` in `next.config.js`

**Benefits:**
- Up to 14× faster compile times when restarting the development server
- Compiler artifacts are stored on disk
- Especially beneficial for large projects
- Enabled by default in Next.js 16.1

**Reference:** [Next.js 16.1 Blog Post](https://nextjs.org/blog/next-16-1#turbopack-file-system-caching-for-next-dev)

### 2. Bundle Analyzer (Experimental) ✅

**Usage:** `yarn analyze` or `next experimental-analyze`

**Features:**
- Interactive UI to inspect production bundles
- Identify large modules and why they're included
- Filter bundles by route
- View full import chain across server-to-client boundaries
- View CSS and asset sizes
- Switch between client and server views

**Benefits:**
- Optimize bundle sizes for better Core Web Vitals
- Reduce lambda cold start times
- Identify bloated dependencies

**Reference:** [Next.js 16.1 Blog Post](https://nextjs.org/blog/next-16-1#nextjs-bundle-analyzer-experimental)

### 3. Easier Debugging with `--inspect` ✅

**Usage:** `yarn dev:debug` or `next dev --inspect`

**Benefits:**
- Enable Node.js debugger directly
- No need for `NODE_OPTIONS=--inspect`
- Attaches inspector only to the process running your code (not all spawned processes)

**Reference:** [Next.js 16.1 Blog Post](https://nextjs.org/blog/next-16-1#easier-debugging-with-next-dev---inspect)

### 4. New `next upgrade` Command ✅

**Usage:** `yarn upgrade` or `next upgrade`

**Benefits:**
- Simplified upgrade process
- No need for manual package.json updates
- Automated upgrade CLI

**Reference:** [Next.js 16.1 Blog Post](https://nextjs.org/blog/next-16-1#other-updates)

## Already Enabled Features

The following Next.js 16 features were already configured:

- ✅ **React Compiler** (`reactCompiler: true`) - Automatic memoization
- ✅ **Cache Components** (`cacheComponents: true`) - Component-level caching
- ✅ **Turbopack** - Used in development mode
- ✅ **Optimize Package Imports** - Tree-shaking for `@heroui/react`
- ✅ **Inline CSS** - CSS inlining optimization
- ✅ **View Transitions API** - Smooth element morphing

## Bundle Optimizations

### Modern Browser Targets & Polyfills

The app targets modern browsers only (Chrome 91+, Firefox 90+, Safari 14+, Edge 91+):
- ✅ All target browsers support ES modules natively
- ℹ️ `polyfill-nomodule.js` (~110 KB) is included but **never loaded** by supported browsers
- ℹ️ Modern browsers ignore `<script nomodule>` tags automatically
- ✅ Zero runtime impact - the polyfill exists in the build but isn't downloaded by users
- ✅ Next.js automatically optimizes polyfills based on `browserslist`

**Note**: The polyfill appears in the bundle analyzer but has no performance impact since:
1. Modern browsers (your targets) never download or execute it
2. Legacy browsers (not supported) would need it but you exclude them via browserslist
3. It's a built-in Next.js safety mechanism

## Available Scripts

```bash
# Development with Turbopack and file system caching
yarn dev

# Development with Node.js debugger attached
yarn dev:debug

# Analyze production bundle sizes
yarn analyze

# Upgrade Next.js to latest version
yarn upgrade

# Production build
yarn build

# Start production server
yarn start

# Type checking
yarn typecheck

# Linting
yarn lint
yarn lint:fix

# Full check (TypeScript + ESLint)
yarn check
```

## Performance Improvements

According to the [Next.js 16.1 announcement](https://nextjs.org/blog/next-16-1):

- **react.dev**: ~10× faster compile times with caching
- **nextjs.org**: ~5× faster compile times with caching
- **Large Vercel apps**: ~14× faster compile times with caching
- **Install size**: 20MB smaller installs

## Additional Improvements in 16.1

- Improved async import bundling (fewer chunks in dev)
- Relative source map paths for better Node.js compatibility
- `generateStaticParams` timing now logged
- Build worker logging shows thread count
- Better handling of `serverExternalPackages` transitive dependencies

## Documentation

- [Next.js 16.1 Release Blog Post](https://nextjs.org/blog/next-16-1)
- [Turbopack File System Caching Docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackFileSystemCache)
- [Bundle Analyzer Guide](https://nextjs.org/docs/app/guides/package-bundling#nextjs-bundle-analyzer-experimental)
- [Next.js Upgrade Guide](https://nextjs.org/docs/app/getting-started/upgrading#latest-version)

## Feedback

Share feedback on Next.js 16.1:
- [GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [Bundle Analyzer Feedback](https://github.com/vercel/next.js/discussions/86731)
- [File System Caching Feedback](https://github.com/vercel/next.js/discussions/87283)

