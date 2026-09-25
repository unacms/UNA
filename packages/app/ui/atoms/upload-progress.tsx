import { View } from 'app/design/view';
import { useTheme } from 'app/design/theme';
import { useTranslation } from 'react-i18next';
import { useUploadProgress } from 'app/lib/upload-progress';
import CircularProgress from 'app/ui/atoms/circular-progress';
import Loading from 'app/ui/atoms/loading';

type UploadProgressProps = {
    uploadId?: string | null;
    size?: number;
};

/**
 * Percent ring while the file is being sent; a spinner before the first progress
 * event (image prep, token fetch) and after 100% while UNA processes the file.
 */
export default function UploadProgress({ uploadId, size = 48 }: UploadProgressProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const percent = useUploadProgress(uploadId);

    if (percent === undefined || percent >= 100) return <Loading />;

    return (
        <View
            accessibilityRole="progressbar"
            accessibilityLabel={t('Uploading')}
            accessibilityValue={{ min: 0, max: 100, now: percent }}
        >
            <CircularProgress
                percentage={percent}
                size={size}
                strokeWidth={10}
                bgColor={colors.border}
                progressColor={colors.primary}
                textClassName="text-[11px] font-semibold tabular-nums text-foreground"
            />
        </View>
    );
}
