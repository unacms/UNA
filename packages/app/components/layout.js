import { View, ScrollView } from 'app/design/view'
import BottomBar from 'app/ui/molecules/bottombar';
import { KeyboardAvoidingView } from 'react-native';
import { Text } from 'app/design/typography'
export const siteTitle = 'NEO';


export default function Layout(props) {
    let data =props.data;
   /* let isBrowse = false;
    let oComments=false;

    
    // TODO IMPROVE
    if (props.uri && props.uri.includes('view-post')){
        oComments = true;
    }

    Object.keys(data?.elements).forEach(key => {
        Object.keys(data.elements[key]).forEach(key2 => {
            Object.keys(data.elements[key][key2].content).forEach(key3 => {
                if(data.elements[key][key2].content[key3].type == 'browse'){
                    isBrowse = true;
                }
            });
        });
    });
*/

   // const sClassName = 'relative overflow-hidden ' + (oComments ? ' ' : '');
    console.log('----------------', props.children)
    return (<View  className="bg-screen dark:bg-screen-dark text-gray-900 dark:text-gray-50 w-full h-full flex-1">{props.children}</View>);
    return (
        
            <View className="h-full">
            { isBrowse && <View >
                <View className = {sClassName}>
                    {props.children}
                </View>
            </View>
            }
            { !isBrowse && <ScrollView className="bg-screen dark:bg-screen-dark text-gray-900 dark:text-gray-50">
                <View className = {sClassName}>
                    {props.children}
                </View>
            </ScrollView>
            }
            { (oComments != null ) &&   <KeyboardAvoidingView
            keyboardVerticalOffset={92}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          ><BottomBar/></KeyboardAvoidingView>}
            </View>

    );
}
