import type { Preview } from '@storybook/react-vite'
import '../../../packages/app/styles/global.default.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;