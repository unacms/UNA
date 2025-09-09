import type { StorybookConfig } from '@storybook/react-native-web-vite';

// Note: Absolute path resolver is not needed in this setup
const config: StorybookConfig = {
  "stories": [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [],

  framework:  {
    name: '@storybook/react-native-web-vite',
    
    options: {
      pluginReactOptions: {
        jsxImportSource: 'nativewind',
        babel: {
          plugins: [
            ['nativewind/babel', { mode: 'compileOnly' }]
          ]
        }
      }
    }

  }
};
export default config;