/**
 * Stub for `@expo/ui` on web.
 *
 * Native NeoButtons live in `neo-button-native.{ios,android}.js`. If webpack
 * ever resolves those files (or a transitive import), named Expo UI exports
 * must not pull SwiftUI / Compose into the Next bundle.
 */
const noop = () => null;
const handler = {
    get: (_target, prop) => {
        if (prop === '__esModule') return true;
        if (prop === 'default') return noop;
        return noop;
    },
};

module.exports = new Proxy(noop, handler);
