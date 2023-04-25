import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';
import { Platform } from 'react-native'

export default function PageLayout(props) {
    const isWeb = Platform.OS == 'web'

    if (isWeb){
    return (<View className="flex-auto relative w-full flex-row mx-auto  ">
                <View className=" w-0 xl:w-1/5 xl:w-max duration-200 ">
                <BlockByName data={props.data} name={props.blocks.menu} hideTitle={true} hideBg={true} />
            </View>
            <View className="flex-auto w-4/5 flex-row  duration-200">
                <View className="flex-auto  w-2/3">
                <BlockByName data={props.data} name={props.blocks.feed} hideTitle={true} hideBg={true} />
                </View>
                <View className="w-0 lg:w-1/3 flex-none duration-200">
                <BlockByName data={props.data} name={props.blocks.posts} hideTitle={true} hideBg={true} />
                </View>
            </View>
            </View>)
    }

    return (<View className="w-full sm:mt-4">
            <BlockByName data={props.data} name={props.blocks.feed} hideTitle={true} hideBg={true} />
        </View>)

}
