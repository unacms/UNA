import { Stack } from "expo-router";
import { Theme } from 'app/design/theme';

const Layout = () => {
  const { colors } = Theme();
  return <Stack screenOptions={({ navigation, route  }) => ({
    headerStyle: {
        backgroundColor: colors.barsBackground,
    },    
})}/>;
};
export default Layout;