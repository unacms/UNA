import { View } from 'app/design/view';

export default function PageLayout(props) {
    return (<View className="flex-auto relative w-full flex-row mx-auto  ">
    <View className=" w-0 xl:w-1/5 duration-200 ">
       {props.children[1]}
    </View>
    <View className=" w-full xl:w-4/5 flex-row  duration-200">
       <View className="flex-auto w-2/3">
           {props.children[2]}
       </View>
       <View className=" w-0  lg:w-1/3  duration-200">
           {props.children[3]}
       </View>
    </View>
</View>)
}