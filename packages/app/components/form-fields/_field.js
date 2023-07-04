
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'


export default function FormField(props) {

    let caption = props.caption;
    if (props.format == 'notitle')
        caption = '';

    const sClassName = 'w-full form-control ' + (props.format != 'custom' ? 'mb-4' : '')+ ' form-control-' + props.name ;
    return (
        <View className={sClassName}>
            { (!!props.caption && props.format == 'default') &&
            <View >
                <Text className="label-text  block ml-0.5 my-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-200">{caption}</Text>
            </View> }
            {props.children}
            { !!props.error &&
                <View className="label" >
                    <Text className="label-text-alt text-sm ml-1 text-red-600 dark:text-red-400 font-medium">{props.error}</Text>
                </View>
            }
        </View>
    );
}
