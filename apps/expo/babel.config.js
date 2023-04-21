module.exports = function (api) {
  api.cache(true)
  return {
    presets: [[
        'babel-preset-expo',
        { jsxRuntime: 'automatic' }
    ]],
    plugins: [
      '@babel/plugin-proposal-export-namespace-from',
      'react-native-reanimated/plugin',
      'transform-inline-environment-variables',
      'nativewind/babel',
      // https://expo.github.io/router/docs/intro#configure-the-babel-plugin
      require.resolve('expo-router/babel'),
    ],
  }
}
