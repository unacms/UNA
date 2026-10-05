const { withProjectBuildGradle } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Pin com.facebook.fbjni:fbjni to the version React Native is built with.
 *
 * Some libraries ask for `fbjni:+` (e.g. react-native-shiki-engine), so Gradle
 * picks the newest release (0.8.1) over React Native's own (0.7.0). The APK
 * then ships a libfbjni.so that RN's native libraries can't load and the app
 * crashes on start: `SoLoaderDSONotFoundError: couldn't find DSO to load:
 * libfbjni.so`.
 *
 * The version is read from react-native/gradle/libs.versions.toml, so an RN
 * upgrade moves the pin along with it.
 *
 * @see https://github.com/CherryHQ/cherry-studio-app/pull/1110
 */
const MARKER = '// with-pin-fbjni';

function getReactNativeFbjniVersion(projectRoot) {
    try {
        const rnDir = path.dirname(
            require.resolve('react-native/package.json', { paths: [projectRoot] }),
        );
        const toml = fs.readFileSync(path.join(rnDir, 'gradle', 'libs.versions.toml'), 'utf8');
        return toml.match(/^fbjni\s*=\s*"([^"]+)"/m)?.[1] ?? null;
    } catch (e) {
        return null;
    }
}

function pinFbjni(contents, version) {
    if (contents.includes(MARKER)) return contents;
    return `${contents}
${MARKER}
allprojects {
    configurations.all {
        resolutionStrategy.force 'com.facebook.fbjni:fbjni:${version}'
    }
}
`;
}

function withPinFbjni(config) {
    return withProjectBuildGradle(config, (config) => {
        const version = getReactNativeFbjniVersion(config.modRequest.projectRoot);
        if (!version) {
            console.warn('[with-pin-fbjni] fbjni version not found in react-native; skipped');
            return config;
        }
        config.modResults.contents = pinFbjni(config.modResults.contents, version);
        return config;
    });
}

module.exports = withPinFbjni;
module.exports.pinFbjni = pinFbjni;
module.exports.getReactNativeFbjniVersion = getReactNativeFbjniVersion;
