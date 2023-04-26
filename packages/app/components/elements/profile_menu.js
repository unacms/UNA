import { View } from 'app/design/view';
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import {  Dimensions, Platform  } from 'react-native';
import { processMenu } from 'app/lib/util'

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
        
        <View  style={styles} className="hidden sm:visible lg:block  top-100  xl:flex p-4  max-h-screen overflow-y-scroll profile-menu flex-col space-y-2">
            <View className="flex-col space-y-0.5 mb-16" >
            {processMenu('profile_menu', props.data.items).map((item, index) => (
                <Link key={`menu-${index}`} href= {item.link.charAt(0) == '/' ? item.link : '/' + item.link}>
                    <Button variant="text" startDecorator={item.icon} fullWidth solid align='start' title = {item.title} />
                </Link>
            ))}
            </View>
        </View>
    );
}
