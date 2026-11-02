const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Resolve the Stripe iOS SDK through CocoaPods instead of Swift Package Manager.
 *
 * stripe-react-native 0.81 pulls Stripe through SPM, which needs dynamic
 * frameworks; with the default static linkage `pod install` fails. Switching
 * the whole app to `useFrameworks: 'dynamic'` is a much bigger change, so
 * keep static linkage until Stripe drops this option.
 *
 * @see https://github.com/facebook/react-native/pull/44627#issuecomment-2123119711
 */
const FLAG_LINE = '$StripeDisableSPM = true # static linkage: Stripe via CocoaPods, not SPM';

function withStripeDisableSpm(config) {
    return withDangerousMod(config, [
        'ios',
        async (config) => {
            const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
            let contents = await fs.promises.readFile(podfilePath, 'utf8');
            if (!contents.includes('$StripeDisableSPM')) {
                contents = `${FLAG_LINE}\n${contents}`;
                await fs.promises.writeFile(podfilePath, contents);
            }
            return config;
        },
    ]);
}

module.exports = withStripeDisableSpm;
