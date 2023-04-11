
import { View, Row } from 'app/design/view';
import { appSetting } from 'app/lib/util'
export default function PageLayout(props) {
    return (<View className="flex-auto relative w-full flex-row mx-auto">
    <View className="hidden lg:flex w-1/3 max-w-xs xl:bg-transparent xl:dark:bg-transparent bg-sidebar dark:bg-sidebar-dark border-r xl:border-none border-neoborder dark:border-neoborder-dark ">
       {props.children[1]}
   </View>
   <View className="flex-auto w-2/3 flex-row">
       <View className="flex-auto w-2/3 sm:m-4 sm:mr-0 gap-1">
           {props.children[2]}
       </View>
       <View className="hidden sticky lg:flex sticky top-0 lg:flex flex-none w-1/3 sm:m-4">
           {props.children[3]}
       </View>
   </View>
</View>)
}
