import { View } from 'app/design/view'
import { appSetting } from 'app/lib/util'
import BottomSheet from 'app/ui/molecules/bottomsheet_content';
import { ImageBackground } from 'react-native';
import { appStatic } from 'app/lib/app-static'
import { useMemo, useState } from 'react';

export default function Layout(props) {
    const [child] = useState(props.children);
    const isUseBg = appSetting('layout', 'background_native');
    if (props.data.page_status == 503) {
        return <>
            {appStatic('maintenance_mode')}
        </>
    }

    const backgroundImage = useMemo(() => (
        <ImageBackground
            source={require('app/background.png')}
            resizeMode="cover"
            style={{ flex: 1, justifyContent: 'center' }}>
            {child}
        </ImageBackground>
    ), [child]); // Memoize background image

    const content = useMemo(() => {
        return (

            isUseBg ? backgroundImage : child
        )
    }, [isUseBg, backgroundImage, child]);

    return (
        <View className=" bg-bgrbody dark:bg-bgrbody-d text-neutral-900 dark:text-neutral-50 w-full h-full flex-1">
            {content}
            <BottomSheet />
        </View>
    );
}

/*
import { View } from 'app/design/view'
import { appSetting } from 'app/lib/util'
import BottomSheet from 'app/ui/molecules/bottomsheet_content';
import { ImageBackground } from 'react-native';
import { appStatic } from 'app/lib/app-static'

export default function Layout(props) {
    const isUseBg = appSetting('layout', 'background_native');
    if (props.data.page_status == 503){
        return   <>
            {appStatic('maintenance_mode')}
        </>
    }

    return (
        <>
           
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

*/
