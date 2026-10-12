import { Dimensions, Platform } from 'react-native';
import Constants from 'expo-constants';
import i18n from 'i18next';
import type { AnalyticsClient } from './analytics.types';

type ApplicationModule = {
    applicationId?: string | null;
    nativeApplicationVersion?: string | null;
};

// Guarded: binaries built before expo-application was added have no native module.
let Application: ApplicationModule | null = null;
try {
    Application = require('expo-application');
} catch {
    Application = null;
}

let client: AnalyticsClient | null = null;

export function isClientAvailable(): boolean {
    return true;
}

/** Device language as a tag UNA accepts (`en`, `pt-BR`, `zh-Hans`), or the app language. */
function getLanguage(): string {
    let locale = '';
    try {
        locale = Intl.DateTimeFormat().resolvedOptions().locale || '';
    } catch {
        locale = '';
    }
    const match = /^([a-zA-Z]{2,3})(?:[-_]([a-zA-Z0-9]{2,4}))?/.exec(locale || i18n.language || '');
    if (!match) return '';
    return match[2] ? `${match[1]}-${match[2]}` : (match[1] ?? '');
}

/** App, system and device: the apps have no browser user agent for UNA to read them from. */
export function getClient(): AnalyticsClient {
    if (client) return client;

    const screen = Dimensions.get('screen');
    const ios = Platform.OS === 'ios';
    const tablet = Platform.OS === 'ios' ? Platform.isPad : Math.min(screen.width, screen.height) >= 600;
    const osVersion = Platform.OS === 'android' ? String(Platform.constants?.Release ?? '') : String(Platform.Version ?? '');
    const expoConfig = Constants.expoConfig;

    client = {
        platform: ios ? 'rn-ios' : 'rn-android',
        app: Application?.applicationId || (ios ? expoConfig?.ios?.bundleIdentifier : expoConfig?.android?.package) || expoConfig?.slug || '',
        app_version: Application?.nativeApplicationVersion || expoConfig?.version || '',
        language: getLanguage(),
        screen: `${Math.round(screen.width)}x${Math.round(screen.height)}`,
        os: ios ? (tablet ? 'iPadOS' : 'iOS') : 'Android',
        os_version: /^[0-9.]+$/.test(osVersion) ? osVersion : '',
        device: tablet ? 'tablet' : 'mobile',
    };
    return client;
}

/** The path events are sent with before the first screen view. */
export function getFallbackUrl(): string {
    return '/';
}

export function getInitialReferrer(): string {
    return '';
}

/** Apps have no Do Not Track signal. */
export function isTrackingBlocked(_respectDnt: boolean): boolean {
    return false;
}
