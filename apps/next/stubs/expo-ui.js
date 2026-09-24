/**
 * Stub for `@expo/ui` on web.
 *
 * Expo UI NeoButtons live in `neo-button/neo-button-expoui.{ios,android}.tsx`. If webpack
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
