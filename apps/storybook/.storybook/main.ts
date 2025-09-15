import type { StorybookConfig } from '@storybook/react-native-web-vite';

import { join, dirname } from "path"

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}
const config: StorybookConfig = {
  "stories": [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [],

  framework:  {
    // name: getAbsolutePath('@storybook/react-native-web-vite'),
    name: '@storybook/react-native-web-vite',
    
    options: {
      pluginReactOptions: {
        jsxImportSource: 'nativewind',
      }
    }

  }
};
export default config;