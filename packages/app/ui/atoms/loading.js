import { ActivityIndicator } from 'react-native';
import { useTheme } from 'app/design/theme';
import { useTranslation } from 'react-i18next';

export default function ElementLoading({size, color}) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    return (
        <ActivityIndicator color={color ? color : colors.primary}  aria-label={t('Loading')} size={size? size :"large"}   />
    )
}
