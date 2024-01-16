import { View } from 'app/design/view'
import Suggestions from 'app/ui/molecules/suggestions';
import AsyncWorker from 'app/ui/molecules/async_worker';
import { useFonts } from 'expo-font';
import { appSetting } from 'app/lib/util'
import BottomSheet from 'app/ui/molecules/bottomsheet_content';
import { ImageBackground, StyleSheet } from 'react-native';

export default function Layout(props) {
    const isUseCustomFont = appSetting('layout', 'use_custom_font');
    const fontsToLoad = isUseCustomFont ? { default: require('app/design/fonts/DefaultFont.ttf') } : {};
    const [fontsLoaded] = useFonts(fontsToLoad);

    if (!fontsLoaded) {
        return null;
    }

    const image = { uri: 'https://legacy.reactjs.org/logo-og.png' };

    const styles = StyleSheet.create({

        image: {
            flex: 1,
            justifyContent: 'center',
        },

    });

    return (
        <>
            <Suggestions />
            <AsyncWorker />
            <View className=" bg-bgrbody dark:bg-bgrbody-d text-neutral-900 dark:text-neutral-50 w-full h-full flex-1">
                <ImageBackground source={image} resizeMode="cover" style={styles.image}>
                    {props.children}
                </ImageBackground>
                <BottomSheet />
            </View>
        </>
    );
}
