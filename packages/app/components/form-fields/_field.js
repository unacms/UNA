
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { appSetting, stripTags, stripTagsWithLinks } from 'app/lib/util'

function replaceLinks(htmlString) {
    const linkRegex = /<a href="(.*?)".*?>(.*?)<\/a>/g;
    const parts = htmlString.split(linkRegex);
  
    return parts.map((part, index) => {
      if (index % 3 === 0) {
        // This part is not a link
        return <Text key={index}>{part}</Text>;
      } else if (index % 3 === 1) {
        // This part is a link URL
        const linkText = parts[index + 1];
        part = part.replace(appSetting('urls', 'root'), '/');
        return <Link key={index} href={part}>{linkText}</Link>;
      }
      // Skip link text parts because they're handled in the link URL parts
      return null;
    }).filter(Boolean);
  }

export default function FormField(props) {
    let caption = props.caption;
    if (props.format == 'notitle')
        caption = '';
    let sClassName = ' my-2 '+(props?.width ? ' ' + props?.width : 'w-full')+' form-control form-control-' + props.name + (props?.classes ? ' ' + props?.classes : '') ;
    
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
                    <Text className="ml-0.5 mt-0.5 label-text-alt text-sm text-red-600 animate-pulse dark:text-red-400 font-medium">{replaceLinks(stripTagsWithLinks(props.error))}</Text>
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
