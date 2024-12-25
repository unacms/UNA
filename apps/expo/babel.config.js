module.exports = function (api) {
    api.cache(true)
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: [
            'transform-inline-environment-variables',
            // https://expo.github.io/router/docs/#configure-the-babel-plugin
            "@babel/plugin-transform-export-namespace-from",
            'react-native-reanimated/plugin',
        ],
    }
}
