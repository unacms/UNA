import type { Preview } from '@storybook/react-vite'
import '../../../packages/app/styles/global.default.css';
import { useEffect } from 'react';
import { useLayoutSettingsStore } from '../../../packages/app/context/layout-settings';

const ThemeDecorator = (Story: any, context: any) => {
  const theme = context.globals.theme || 'light';
  
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('theme', theme);
    root.setAttribute('data-theme', theme);
    
    // Also set class for Tailwind dark mode
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Update the layout settings store so components can react
    const store = useLayoutSettingsStore.getState();
    store.updateLayoutSettings({ theme });
  }, [theme]);

  return (
    <div className=" flex p-8 items-center justify-center align-middle">
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' }
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [ThemeDecorator],
};

export default preview;