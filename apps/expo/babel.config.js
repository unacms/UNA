module.exports = function (api) {
    api.cache(true)
    return {
        presets: ['babel-preset-expo'],
        plugins: ['@babel/plugin-transform-export-namespace-from'],
        overrides: [
            {
                test: /[/\\]expo-modules-core[/\\]src[/\\]Platform\.[tj]s$/,
                presets: [require('./babel-expo-os-fallback')],
            },
        ],
    }
}
