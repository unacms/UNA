import { View, ScrollView } from 'app/design/view'
import BottomBar from 'app/ui/molecules/bottombar';
import { KeyboardAvoidingView } from 'react-native';
import { Text } from 'app/design/typography'
export const siteTitle = 'NEO';


export default function Layout(props) {
    return (<View  className="bg-backgroundbody dark:bg-backgroundbody-dark text-gray-900 dark:text-gray-50 w-full h-full flex-1">{props.children}</View>);
}
