module.exports = function (api) {
    api.cache(true)
    return {
        presets: [
            'babel-preset-expo',
        ],
        plugins: [
            'transform-inline-environment-variables',
            '@babel/plugin-transform-export-namespace-from',
            'react-native-worklets/plugin'
        ],
    }
}
