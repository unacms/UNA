import { ActivityIndicator } from 'react-native';
import { Theme } from 'app/design/theme';

export default function ElementLoading(props) {
    const { colors } = Theme();
    return (
        <ActivityIndicator  accessibilityRole="progressbar" accessibilityLabel="Loading" size="large" color={colors.primary}  />
    )
}
