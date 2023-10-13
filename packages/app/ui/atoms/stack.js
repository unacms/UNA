import { Stack } from "expo-router";
import { Theme } from 'app/design/theme';
import { useTranslation } from 'react-i18next';

const StackCustom = () => {
    const { t } = useTranslation();
    const { colors } = Theme();
    return <Stack 
        screenOptions={({ navigation, route  }) => ({
            title: t('Loading...'),
            headerBackVisible: false, 
            headerStyle: {
                backgroundColor: colors.barsBackground,
            }, 
            freezeOnBlur: true,
            unmountOnBlur: false,
    })}/>;
};
export default StackCustom;