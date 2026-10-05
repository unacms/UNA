/**
 * Runs after `babel-preset-expo` (presets apply last-to-first).
 *
 * When Metro transforms a module without `platform` in the Babel caller,
 * `babel-preset-expo` inlines `process.env.EXPO_OS` to `null`/`undefined`,
 * which makes expo-modules-core emit a dev warning on every load.
 */
module.exports = function expoOsFallbackPreset(api) {
    const platform = api.caller((caller) => caller?.platform) || 'ios'

    return {
        plugins: [
            function expoOsFallbackPlugin({ types: t }) {
                return {
                    name: 'expo-os-fallback',
                    visitor: {
                        MemberExpression(path) {
                            if (!path.get('object').matchesPattern('process.env')) {
                                return
                            }
                            const key = path.toComputedKey()
                            if (
                                key.type !== 'StringLiteral' ||
                                key.value !== 'EXPO_OS' ||
                                (path.parentPath.isAssignmentExpression() &&
                                    path.parentPath.node.left === path.node)
                            ) {
                                return
                            }
                            path.replaceWith(t.stringLiteral(platform))
                        },
                        BinaryExpression(path) {
                            const { node } = path
                            if (
                                node.operator !== '===' ||
                                !t.isStringLiteral(node.right, { value: 'undefined' }) ||
                                !t.isUnaryExpression(node.left, { operator: 'typeof' })
                            ) {
                                return
                            }
                            const arg = node.left.argument
                            if (
                                !t.isNullLiteral(arg) &&
                                !t.isIdentifier(arg, { name: 'undefined' })
                            ) {
                                return
                            }
                            // `typeof null/undefined === 'undefined'` is always false.
                            path.replaceWith(t.booleanLiteral(false))
                        },
                    },
                }
            },
        ],
    }
}
