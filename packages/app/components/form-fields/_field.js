
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { appSetting, stripTags, linkedText } from 'app/lib/util'

export default function FormField(props) {
    let caption = props.caption;
    if (props.format == 'notitle')
        caption = '';
    let sClassName = ' my-2 w-full form-control form-control-' + props.name + (props?.classes ? ' ' + props?.classes : '') ;
    if (Platform.OS != 'web')
        sClassName += '  ';
    return (
        <View className={sClassName}>
            { (!!props.caption && props.format == 'default') &&
            <View >
                <Text className="label-text block ml-0.5 mb-1 text-sm text-neutral-700 dark:text-neutral-200">
                    <Text className="font-medium">{caption}</Text> 
                    {(props.checker || props.required) ? '' : ' (Optional)'}
                </Text>
            </View> }
            {props.children}
            {!!props.error && Array.isArray(props.error) && 
                <View className="label" >
                    <Link href={props.error[1]}><Text className="ml-0.5 mt-0.5 label-text-alt text-sm text-red-600 animate-pulse dark:text-red-400 font-medium">{props.error[0]}</Text></Link>
                </View>
            }
            {!!props.error && !Array.isArray(props.error) && 
                <View className="label" >
                    <Text className="ml-0.5 mt-0.5 label-text-alt text-sm text-red-600 animate-pulse dark:text-red-400 font-medium">{linkedText(props.error)}</Text>
                </View>
            }
            {!!props.info &&
                <View className="label" >
                    <Text className="ml-0.5 mt-0.5 text-xs text-neutral-700 dark:text-neutral-200">{props.info}</Text>
                </View>
            }
        </View>
    );
}
