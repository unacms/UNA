import { inApp, isSecondaryWindow } from './native';
import type { Platform } from './shortcuts';

export const isMac = typeof navigator !== 'undefined' && /\bMac/.test(navigator.userAgent);
export const isWindows = typeof navigator !== 'undefined' && /\bWindows/.test(navigator.userAgent);

/** The OS, as `data-platform` on the page's root names it (tokens.css sizes per platform). */
export const platformName: 'mac' | 'windows' | 'linux' = isMac ? 'mac' : isWindows ? 'windows' : 'linux';

/**
 * On macOS the app has a native menu, which handles the shortcuts that have an accelerator. Its
 * clicks reach the main window only, so a window of its own handles its few keys itself.
 */
export const platform: Platform = { mac: isMac, nativeMenu: inApp && isMac && !isSecondaryWindow };

/**
 * The macOS main window uses an overlay title bar (tauri.conf.json): the page draws under it,
 * leaves room for the traffic lights and drags the window from its headers. Windows of their
 * own (windows.rs) keep the native title bar.
 */
export const overlayTitleBar = inApp && isMac && !isSecondaryWindow;

/** Spread on a header to let it drag the window. Only the element itself drags, not its children. */
export const dragRegion: Record<string, string> = overlayTitleBar ? { 'data-tauri-drag-region': '' } : {};
