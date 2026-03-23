import * as Haptics from 'expo-haptics';

/**
 * Native haptics (expo-haptics). Web uses `feedback-haptics.web.js` ([web-haptics](https://github.com/lochie/web-haptics)).
 */
export function FeedbackHaptics(type) {
    if (typeof type !== 'string') return;
    switch (type) {
        case 'Success':
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            );
            break;
        case 'Error':
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error
            );
            break;
        case 'Warning':
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
            );
            break;
        case 'Select':
            Haptics.selectionAsync();
            break;
        case 'Light':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
        case 'Medium':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
        case 'Heavy':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
        default:
            break;
    }
}
