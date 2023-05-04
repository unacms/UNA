import { Stack } from "expo-router";
import { Theme } from 'app/design/theme';

const StackCustom = () => {
    const { colors } = Theme();
    return <Stack 
        screenOptions={({ navigation, route  }) => ({
            headerBackVisible: false, 
            headerStyle: {
                backgroundColor: colors.barsBackground,
            }, 
    })}/>;
};
export default StackCustom;