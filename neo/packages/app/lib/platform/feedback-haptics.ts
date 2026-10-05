import * as Haptics from 'expo-haptics';

/**
 * Native haptics (expo-haptics). Web uses `feedback-haptics.web.ts` ([web-haptics](https://github.com/lochie/web-haptics)).
 */
export function hasRecentUserGesture() {
    return true;
}

export function FeedbackHaptics(type?: string) {
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
        /** Matches web-haptics `nudge` preset ([web-haptics presets](https://github.com/lochie/web-haptics)): strong tap, pause, softer tap */
        case 'Nudge':
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setTimeout(() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }, 80);
            break;
        default:
            break;
    }
}
