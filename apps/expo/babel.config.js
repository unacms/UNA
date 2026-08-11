module.exports = function (api) {
    api.cache(true)
    return {
        presets: ['babel-preset-expo'],
        plugins: ['@babel/plugin-transform-export-namespace-from'],
        overrides: [
            {
                // Function form: Metro cache-key calls Babel without `filename`;
                // RegExp/string `test` throws ConfigError in that case.
                test: (filename) =>
                    typeof filename === 'string' &&
                    /[/\\]expo-modules-core[/\\]src[/\\]Platform\.[tj]s$/.test(filename),
                presets: [require('./babel-expo-os-fallback')],
            },
        ],
    }
}
