import { ActivityIndicator } from 'react-native';
import { useTheme } from 'app/design/theme';
import { useTranslation } from 'react-i18next';

type LoadingProps = {
    size?: 'small' | 'large' | number;
    color?: string;
};

export default function ElementLoading({size, color}: LoadingProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    return (
        <ActivityIndicator color={color ? color : colors.primary}  aria-label={t('Loading')} size={size? size :"large"}   />
    )
}
