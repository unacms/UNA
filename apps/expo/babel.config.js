module.exports = function (api) {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]],
    plugins: [
      'transform-inline-environment-variables',
      // https://expo.github.io/router/docs/#configure-the-babel-plugin
      require.resolve('expo-router/babel'),
      "nativewind/babel",
      '@babel/plugin-proposal-export-namespace-from',
      'react-native-reanimated/plugin',
    ],
  }
}
