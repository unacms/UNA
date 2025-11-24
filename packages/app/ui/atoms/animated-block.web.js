import { View } from 'app/design/view';
import { appSetting } from 'app/lib/util';

const AnimatedContainer = (props) => {
    return (
        <View className={appSetting('layout', 'max_width_content') + ' w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500'}>
            {props.children}
        </View>
    );
} 

export default AnimatedContainer;