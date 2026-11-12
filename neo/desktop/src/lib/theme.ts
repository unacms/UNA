/**
 * Light, dark or the system's appearance. The choice is this computer's (localStorage, which
 * may be unavailable: then the system's appearance is used). The page follows `data-theme` on
 * <html> (tokens.css); in the app the window takes it too (setTheme), so the title bar, the
 * background Rust paints and the web view's prefers-color-scheme all match.
 */
import { getCurrentWindow } from '@tauri-apps/api/window';

import { t } from './i18n';
import { inApp } from './native';
import { readStored, writeStored } from './storage';

export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

const KEY = 'una-desktop-theme';

export function isTheme(value: unknown): value is Theme {
    return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

export function savedTheme(): Theme {
    const value = readStored(KEY);
    return isTheme(value) ? value : 'system';
}

/** Use a theme now (on <html> and the window) and remember it. */
export function applyTheme(theme: Theme, remember = true): void {
    const root = document.documentElement;
    const before = root.dataset.theme;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
    if (root.dataset.theme !== before) switchWithoutTransitions();
    if (remember) writeStored(KEY, theme === 'system' ? null : theme);
    if (inApp) void getCurrentWindow().setTheme(theme === 'system' ? null : theme).catch((e: unknown) => console.error('setTheme', e));
}

/**
 * Every colour changes at once when the theme does: transitions would fade each control on its
 * own clock. They are off for one frame (the reflow applies the new colours without them).
 */
function switchWithoutTransitions(): void {
    if (typeof document === 'undefined' || !document.head) return;
    const style = document.createElement('style');
    style.textContent = '*,*::before,*::after{transition:none!important}';
    document.head.appendChild(style);
    void getComputedStyle(document.body).opacity;
    const remove = () => style.remove();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(remove);
    // a hidden web view may run no frames
    setTimeout(remove, 100);
}

/** What people read when a theme is chosen. */
export function themeAnnouncement(theme: Theme): string {
    return theme === 'system' ? t('Theme follows the system') : theme === 'light' ? t('Light theme') : t('Dark theme');
}
