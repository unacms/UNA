const { withAndroidManifest } = require('expo/config-plugins');

/** Permissions added by expo-audio SDK 54 library manifest (not needed for short UI sounds). */
const REMOVED_PERMISSIONS = [
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
    'android.permission.FOREGROUND_SERVICE_MICROPHONE',
];

/** Relative + fully-qualified names seen after manifest merge. */
const REMOVED_SERVICES = [
    'expo.modules.audio.service.AudioControlsService',
    'expo.modules.audio.service.AudioRecordingService',
    '.service.AudioControlsService',
    '.service.AudioRecordingService',
];

function ensureToolsNamespace(manifest) {
    manifest.$ = manifest.$ ?? {};
    if (!manifest.$['xmlns:tools']) {
        manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }
}

function pushRemoveEntry(list, entry) {
    const items = list == null ? [] : Array.isArray(list) ? list : [list];
    const key = entry.$['android:name'];
    if (items.some((item) => item?.$?.['android:name'] === key && item?.$?.['tools:node'] === 'remove')) {
        return items;
    }
    items.push(entry);
    return items;
}

function getMainApplication(manifest) {
    const app = manifest.application;
    if (!app) {
        return null;
    }
    return Array.isArray(app) ? app[0] : app;
}

/**
 * Strip expo-audio foreground-service permissions/services from the merged Android manifest.
 * Required on Expo SDK 54 where expo-audio hardcodes FGS entries (see expo/expo#44242).
 * Uses manifest merger tools:node="remove" (works on Expo SDK 54 without patch-package).
 */
function withExpoAudioNoForegroundServices(config) {
    return withAndroidManifest(config, (config) => {
        const manifest = config.modResults.manifest;
        ensureToolsNamespace(manifest);

        for (const permission of REMOVED_PERMISSIONS) {
            manifest['uses-permission'] = pushRemoveEntry(manifest['uses-permission'], {
                $: {
                    'android:name': permission,
                    'tools:node': 'remove',
                },
            });
        }

        const application = getMainApplication(manifest);
        if (application) {
            for (const serviceName of REMOVED_SERVICES) {
                application.service = pushRemoveEntry(application.service, {
                    $: {
                        'android:name': serviceName,
                        'tools:node': 'remove',
                    },
                });
            }
        }

        return config;
    });
}

module.exports = withExpoAudioNoForegroundServices;
