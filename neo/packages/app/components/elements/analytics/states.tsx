import { useTranslation } from 'react-i18next';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton } from 'app/design/controls';
import { cn } from 'app/lib/util';

/** Grey placeholder bars while a report loads for the first time. */
export function AnalyticsSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
    return (
        <View className={cn('w-full gap-3', className)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
            {Array.from({ length: rows }, (_, i) => (
                <View key={i} className={cn('h-5 rounded-md bg-muted', i % 2 ? 'w-2/3' : 'w-full')} />
            ))}
        </View>
    );
}

export function AnalyticsError({ text, onRetry }: { text: string; onRetry: () => void }) {
    const { t } = useTranslation();
    return (
        <View className="w-full items-center gap-3 py-4" accessibilityLiveRegion="polite">
            <Text className="text-center text-sm text-muted-foreground" accessibilityRole="alert">{text}</Text>
            <NeoButton style="bordered" controlSize="regular" label={t('Retry')} image="RotateCw" onPress={() => onRetry()} />
        </View>
    );
}

export function AnalyticsEmpty({ text }: { text: string }) {
    return (
        <View className="w-full items-center py-6">
            <Text className="text-center text-sm text-muted-foreground">{text}</Text>
        </View>
    );
}
