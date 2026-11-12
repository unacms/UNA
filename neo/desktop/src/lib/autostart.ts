/**
 * Start at login (tauri-plugin-autostart, Settings): the app is registered with the system
 * (a Launch Agent on macOS, the Run key on Windows, an autostart entry on Linux) with --hidden,
 * so it starts with its window closed and keeps the badge and notifications current
 * (src-tauri/src/tray.rs). Off until it is turned on. Not there outside the app.
 */
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';

import { t } from './i18n';
import { inApp } from './native';

export const autostartAvailable = inApp;

export async function startsAtLogin(): Promise<boolean> {
    return inApp ? isEnabled() : false;
}

export async function setStartAtLogin(on: boolean): Promise<void> {
    if (!inApp) throw new Error(t('Start at login works in the desktop app'));
    await (on ? enable() : disable());
}
