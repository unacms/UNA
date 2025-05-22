
import { View } from 'app/design/view';
export default function PageLayout(props) {
    
    return (
        <View className="flex-auto relative w-full flex-row mx-auto lg:p-4">
            <View className="flex-auto w-full flex-row ">
                <View className="w-full lg:w-2/3 lg:pr-4">
                    {props.children[1]}
                </View>
                <View className="w-full flex-none lg:w-1/3 lg:space-y-4">
                    {props.children[2]}
                </View>
            </View>
        </View>
    )
}
