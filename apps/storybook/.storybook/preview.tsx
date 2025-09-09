import type { Preview } from '@storybook/react-vite'
import '../../../packages/app/styles/global.default.css';
// Ensure settings are available for appSetting calls BEFORE any components load
import { settings } from '../../../packages/app/settings';
import { remoteSettings } from '../../../packages/app/settings-remote';

// Initialize settings immediately at module load time for Storybook
if (!remoteSettings.data) {
  (remoteSettings as { data: any }).data = settings;
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import React, { Component, type ReactNode } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: unknown }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      const err = this.state.error as Error | string | undefined;
      return <div role="alert">Story error: {String((err as Error)?.message || err)}</div>;
    }
    return this.props.children as ReactNode;
  }
}



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
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-4">
        <ErrorBoundary>
          <Story />
        </ErrorBoundary>
      </div>
    ),
    (Story) => (
      <div className="min-h-screen bg-background p-4">
        <ErrorBoundary>
          <Story />
        </ErrorBoundary>
      </div>
    ),
  ],
};

export default preview;