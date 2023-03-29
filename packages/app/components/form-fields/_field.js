
import { useWindowDimensions } from 'react-native'
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'


export default function FormField(props) {
    let w ='w-full';
    let { width } = useWindowDimensions()
    if (props.name == 'cmt_text'){
        w ='w-11/12';
    }
    if (props.name == 'cmt_submit'){
        w ='w-1/12 ml-1';
    }

    const sClassName = w +' form-control ' + (w == 'w-full' ? 'mb-4' : '')+ ' form-control-' + props.name ;

    return (
        <View className={sClassName}>
            { !!props.caption && 
            <View className="label">
                <Text className="label-text capitalize block mb-1 ml-1 text-sm font-medium text-neogray-700 dark:text-neogray-200">{props.caption}</Text>
            </View> }
            {props.children}
            { !!props.error &&
                <View className="label" >
                    <Text className="label-text-alt mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{props.error}</Text>
                </View>}
        </View>
    );
}
