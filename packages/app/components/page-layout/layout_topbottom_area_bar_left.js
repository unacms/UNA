import { View } from 'app/design/view';

export default function PageLayout(props) {
    return (<View className="flex-auto relative w-full flex-row mx-auto  ">
    <View className=" w-0 xl:w-1/5 xl:w-max duration-200">
       {props.children[1]}
   </View>
   <View className="flex-auto w-4/5 flex-row sm:mx-4 xl:mx-8 duration-200">
       <View className="flex-auto w-2/3">
           {props.children[2]}
       </View>
       <View className=" w-0  lg:w-1/3 flex-none  lg:ml-4 xl:ml-8 duration-200">
           {props.children[3]}
       </View>
   </View>
</View>)
}
