const path = require('path');

const { join, dirname: pathDirname } = path;

function getAbsolutePath(value) {
  return pathDirname(require.resolve(join(value, 'package.json')));
}

const config = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [],
  framework: {
    // name: getAbsolutePath('@storybook/react-native-web-vite'),
    name: '@storybook/react-native-web-vite',
    options: {
      pluginReactOptions: {
        jsxImportSource: 'nativewind',
      },
    },
  },
  viteFinal: async (storybookConfig) => {
    const resolveConfig = storybookConfig.resolve || {};
    const alias = resolveConfig.alias || {};

    storybookConfig.resolve = resolveConfig;
    storybookConfig.resolve.alias = {
      ...alias,
      'next/link': join(__dirname, '../src/mocks/next-link.tsx'),
      'app/lib/hooks/router': join(__dirname, '../src/mocks/router.ts'),
    };

    return storybookConfig;
  },
};

module.exports = config;
