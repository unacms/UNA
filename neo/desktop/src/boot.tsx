/**
 * The app itself, imported by main.tsx once the language's words have loaded, so that every
 * module here can say something as it loads.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import { editorChunk } from './components/rich-editor/lazy';
import { taskViewsChunk } from './features/tasks/lazy';
import { retryOnce } from './lib/api';
import { initChrome } from './lib/chrome';
import { windowRoute } from './lib/native';
import { SecondaryApp } from './secondary';
import { overlayTitleBar } from './lib/platform';
import { loadSettings } from './lib/settings';
import { applyTheme, savedTheme } from './lib/theme';
import './styles/tokens.css';
import './styles.css';

// the page draws under the macOS title bar: tokens.css leaves room for the traffic lights
if (overlayTitleBar) document.documentElement.dataset.titlebar = 'overlay';
// light, dark or the system's, as chosen last time on this computer
applyTheme(savedTheme(), false);
// the rest of Settings (single keys, notifications, close to tray): the page applies them as they load
void loadSettings().catch((e: unknown) => console.error('settings', e));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: retryOnce },
    },
});

// a window of its own (src-tauri/src/windows.rs) shows one detail; it keeps the native title bar
const route = windowRoute();
if (route) delete document.documentElement.dataset.titlebar;

// the platform and the material the sidebar is drawn over, before anything is drawn: one IPC
// call while the window is still hidden (lib/chrome.ts)
void initChrome().finally(() => {
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>{route ? <SecondaryApp path={route} /> : <App />}</QueryClientProvider>
        </StrictMode>,
    );
    // the editor and the task views are not in the startup script (lib/lazy-module.ts): they load
    // once the window has drawn, unless something drawn first needed them sooner
    requestAnimationFrame(() =>
        setTimeout(() => {
            for (const chunk of [editorChunk, taskViewsChunk]) void chunk.load().catch((e: unknown) => console.error('loading a part of the app', e));
        }, 0),
    );
});
