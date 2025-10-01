import { ActivityIndicator } from 'react-native';
import { Theme } from 'app/design/theme';

export default function ElementLoading({size, color}) {
    const { colors } = Theme();
    return (
        <ActivityIndicator color={color ? color : colors.primary}  aria-label="Loading" size={size? size :"large"}   />
    )
}
