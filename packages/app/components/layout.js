import { View } from 'app/design/view'
import Suggestions from 'app/ui/molecules/suggestions';
import AsyncWorker from 'app/ui/molecules/async_worker';
import { useFonts } from 'expo-font';
import { appSetting } from 'app/lib/util'
import BottomSheet from 'app/ui/molecules/bottomsheet_content';
import { ImageBackground } from 'react-native';
import { appStatic } from 'app/lib/app-static'

export default function Layout(props) {
    const isUseCustomFont = appSetting('layout', 'use_custom_font');
    const fontsToLoad = isUseCustomFont ? { default: require('app/design/fonts/DefaultFont.ttf') } : {};
    const [fontsLoaded] = useFonts(fontsToLoad);
    const isUseBg = appSetting('layout', 'background_native');

    if (!fontsLoaded) {
        return null;
    }

    if (props.data.page_status == 503){
        return   <>
            {appStatic('maintenance_mode')}
        </>
    }

    return (
        <>
            <Suggestions />
            <AsyncWorker />
            <View className=" bg-bgrbody dark:bg-bgrbody-d text-neutral-900 dark:text-neutral-50 w-full h-full flex-1">
                {isUseBg ? <ImageBackground source={require('app/background.png')} resizeMode="cover" style={{
                    flex: 1,
                    justifyContent: 'center',
                }}>
                    {props.children}
                </ImageBackground> : props.children} 
                <BottomSheet />
            </View>
        </>
    );
}
