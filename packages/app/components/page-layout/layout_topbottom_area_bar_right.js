
import { View, Row } from 'app/design/view';
import { appSetting } from 'app/lib/util'
export default function PageLayout(props) {
    
    return (
        <View className="flex-auto relative w-full flex-row mx-auto lg:mt-4">
            <View className="flex-auto w-full flex-row lg:gap-8">
                <View className="w-full lg:w-2/3 lg:gap-4">
                    {props.children[1]}
                </View>
                <View className="w-full flex-none lg:w-1/3 lg:gap-4">
                    {props.children[2]}
                </View>
            </View>
        </View>
    )
}
