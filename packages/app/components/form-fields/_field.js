
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'


export default function FormField(props) {

    const sClassName = 'w-full form-control ' + (props.format == 'default' ? 'mb-4' : '')+ ' form-control-' + props.name ;

    return (
        <View className={sClassName}>
            { (!!props.caption && props.format == 'default') &&
            <View className="label">
                <Text className="label-text capitalize block mb-1 ml-1 text-sm font-medium text-gray-700 dark:text-gray-200">{props.caption}</Text>
            </View> }
            {props.children}
            { !!props.error &&
                <View className="label" >
                    <Text className="label-text-alt mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{props.error}</Text>
                </View>}
        </View>
    );
}
