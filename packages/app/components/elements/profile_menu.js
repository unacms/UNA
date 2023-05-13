import { View } from 'app/design/view';
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import {  Dimensions, Platform  } from 'react-native';
import { appSetting } from 'app/lib/util'

//2xl:bg-transparent 2xl:dark:bg-transparent  bg-sidebar dark:bg-sidebar-dark border-r 2xl:border-none border-neoborder dark:border-neoborder-dark
export default function ElementProfileMenu(props) {

    let windowHeight = Dimensions.get('window').height;

    let styles ={};
    if(Platform.OS === 'web') {
        styles = {height: windowHeight - 64}
    }
    
    const handleLayout = (event) => {

        windowHeight = Dimensions.get('window').height;
        if(Platform.OS === 'web') {
            styles = {height: windowHeight - 64}
        }
        
        
    }

    return (
        
        <View  style={styles} className="   px-4 py-4  max-h-screen overflow-y-scroll profile-menu flex-col gap-2">
            <View className="flex-col gap-0.5 mb-16" >
            {appSetting('menu', 'left').map((item, index) => (
                <Link key={`menu-${index}`} href= {item.link.replace('?owner=1', '')}>
                    <Button variant="text" startDecorator={item.icon} fullWidth solid align='start' title = {item.title} />
                </Link>
            ))}
            </View>
        </View>
    );
}