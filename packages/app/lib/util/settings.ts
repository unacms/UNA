import { appSetting as setting } from 'app/config';

/**
 * Value from the settings tree (`settings[section][name][path]`), cached; `''` when missing.
 * Returns `any`: settings are a large, per-project dynamic object.
 */
export function appSetting(section: string, name?: string, path?: string): any {
    return (setting as (...args: any[]) => any)(section, name, path);
}
