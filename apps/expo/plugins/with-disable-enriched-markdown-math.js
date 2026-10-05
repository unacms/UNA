const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Disable RaTeX SPM from react-native-enriched-markdown on iOS.
 *
 * Xcode 26 cannot open Pods.xcodeproj when CocoaPods injects
 * XCRemoteSwiftPackageReference via spm_dependency — builds fail with
 * `_setSavedArchiveVersion:` / "Pods project is damaged" and cascading
 * "no such module 'Expo'" errors. Math rendering falls back without RaTeX.
 *
 * @see https://github.com/software-mansion/react-native-enriched-markdown/blob/main/docs/LATEX_MATH.md
 */
const ENV_LINE =
    "ENV['ENRICHED_MARKDOWN_ENABLE_MATH'] = '0' # Xcode 26: RaTeX SPM corrupts Pods.xcodeproj";

function withDisableEnrichedMarkdownMath(config) {
    return withDangerousMod(config, [
        'ios',
        async (config) => {
            const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
            let contents = await fs.promises.readFile(podfilePath, 'utf8');
            if (!contents.includes('ENRICHED_MARKDOWN_ENABLE_MATH')) {
                contents = `${ENV_LINE}\n${contents}`;
                await fs.promises.writeFile(podfilePath, contents);
            }
            return config;
        },
    ]);
}

module.exports = withDisableEnrichedMarkdownMath;
