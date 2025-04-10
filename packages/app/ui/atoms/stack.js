import { Stack } from 'app/lib/hooks/router'

const StackCustom = () => {
    return <Stack 
        screenOptions={() => ({
            header:(props) => <></>,/*<Header header="Loading..." />*/
            headerBackVisible: true, 
            headerShadowVisible: true,
            freezeOnBlur: true,
            unmountOnBlur: false,
            lazy: true,
            headerTransparent:true
    })}/>
};

export default StackCustom;