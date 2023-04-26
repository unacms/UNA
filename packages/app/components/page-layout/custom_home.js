import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';
import { Platform } from 'react-native'
import { useState, useEffect } from 'react';

export default function PageLayout(props) {
    const isWeb = Platform.OS == 'web'
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        if (isWeb){
            const handleResize = () => {
                setIsDesktop(window.innerWidth > 1024);
            };
            
            window.addEventListener('resize', handleResize);
            handleResize();
            
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    if (isDesktop){
        return (<View className="flex-auto relative w-full flex-row mx-auto  ">
                <View className=" w-0 xl:w-1/5 xl:w-max duration-200 ">
                <BlockByName data={props.data} name={props.blocks.menu} />
            </View>
            <View className="flex-auto w-4/5 flex-row  duration-200">
                <View className="flex-auto  w-2/3">
                <BlockByName data={props.data} name={props.blocks.feed} />
                </View>
                <View className="w-0 lg:w-1/3 flex-none duration-200">
                <BlockByName data={props.data} name={props.blocks.posts} />
                </View>
            </View>
            </View>)
    }

    return (<View className="w-full sm:mt-4">
            <BlockByName data={props.data} name={props.blocks.feed}  />
        </View>)

}