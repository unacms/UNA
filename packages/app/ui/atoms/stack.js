import { Stack } from "expo-router";
import Header from 'app/components/nav/header';
const StackCustom = () => {
    return <Stack 
        screenOptions={() => ({
            header:(props) => <Header header="Loading..." />,
            headerBackVisible: true, 
            headerShadowVisible: true,
            freezeOnBlur: true,
            unmountOnBlur: false,
            lazy: true,
    })}/>
};

export default StackCustom;