import { ActivityIndicator } from 'react-native';
import { useTheme } from 'app/design/theme';

export default function ElementLoading({size, color}) {
    const { colors } = useTheme();
    return (
        <ActivityIndicator color={color ? color : colors.primary}  aria-label="Loading" size={size? size :"large"}   />
    )
}
