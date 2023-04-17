import { View, ScrollView } from 'app/design/view'
import BottomBar from 'app/ui/molecules/bottombar';
import LayoutDataContext from 'app/context/layout';

export const siteTitle = 'NEO';

export default function Layout(props) {

    var oBreadCrump = null;
    var oComments = null;
    
    // TODO IMPROVE
    if (props.uri && props.uri.includes('view-post')){
        oComments = true;
    }
    const sClassName = 'relative overflow-hidden ' + (oComments ? ' ' : '');

    return (
        <LayoutDataContext>
            <View className="h-full bg-red">
            <ScrollView className="bg-screen dark:bg-screen-dark text-gray-900 dark:text-gray-50">
                <View className = {sClassName}>
                    {props.children}
                </View>
            </ScrollView>
            { (oComments != null ) &&   <View><BottomBar/></View>}
            </View>
        </LayoutDataContext>
    );
}
