import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';
import { Platform } from 'react-native'
import { useState, useEffect } from 'react';
import { appSetting } from 'app/lib/util'

export default function PageLayout(props) {
    const isWeb = Platform.OS == 'web'
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        if (isWeb){
            const handleResize = () => {
                setIsDesktop(window.innerWidth > 768);
            };
            
            window.addEventListener('resize', handleResize);
            handleResize();
            
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    if (isDesktop){
        return (<View className={ appSetting('layout', 'max_width') + ' mx-auto w-full h-48'} >
            <View className="flex-auto relative w-full flex-row mx-auto  ">

            <View className="hidden md:block  w-1/4 xl:w-1/5    duration-200 ">
                <BlockByName data={props.data} name={props.blocks.menu}  />

            </View>
            <View className="flex-auto  w-3/4 xl:w-4/5 flex-row duration-200">
                <View className="flex-auto w-2/3">
                <BlockByName data={props.data} name={props.blocks.feed} />
                </View>

                <View className="hidden xl:block w-1/3   flex-none duration-200">
                <BlockByName data={props.data} name={props.blocks.posts} />
                </View>
            </View>
            </View>
            </View>)
    }


    return (<View className="w-full ">
            <BlockByName data={props.data} name={props.blocks.feed} />
        </View>)

}