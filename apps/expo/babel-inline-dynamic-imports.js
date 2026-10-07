/**
 * Registry `_map.js` files load components with `dynamic(() => import('./x'))`
 * (next/dynamic) for web code splitting. Native has nothing to split, and with
 * Expo's lazy bundling every `import()` would become its own dev bundle fetched
 * at startup (hundreds of them: EMFILE on Windows, blank screen while they load).
 *
 * Inside a `dynamic(...)` call this turns `import('./x')` into
 * `Promise.resolve(require('./x'))`: the module is in the main bundle again,
 * exactly like the static imports before, and the native `next/dynamic` shim
 * (packages/app/lib/platform/next-dynamic.native.js) renders it synchronously.
 */
module.exports = function inlineDynamicImports({ types: t }) {
    function isInsideDynamicCall(path) {
        const fn = path.getFunctionParent();
        const call = fn && fn.parentPath;
        return !!call
            && call.isCallExpression()
            && t.isIdentifier(call.node.callee, { name: 'dynamic' })
            && call.node.arguments[0] === fn.node;
    }

    return {
        name: 'inline-dynamic-imports',
        visitor: {
            // Own traversal on Program enter: babel-preset-expo turns ESM into
            // CommonJS in the same pass, after which `dynamic(...)` reads
            // `(0, _dynamic.default)(...)` and no longer matches.
            Program(programPath) {
                programPath.traverse({
                    CallExpression(path) {
                        if (path.node.callee.type !== 'Import' || !isInsideDynamicCall(path)) return;
                        path.replaceWith(
                            t.callExpression(
                                t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
                                [t.callExpression(t.identifier('require'), path.node.arguments)]
                            )
                        );
                    },
                });
            },
        },
    };
};
