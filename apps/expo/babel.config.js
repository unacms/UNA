module.exports = function (api) {
    api.cache(true)
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            '@babel/plugin-transform-export-namespace-from',
            // dynamic(() => import('./x')) → static require on native (see the file).
            require('./babel-inline-dynamic-imports'),
        ],
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
