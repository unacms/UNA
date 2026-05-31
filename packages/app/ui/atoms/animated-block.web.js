import { View } from 'app/design/view';
import { appSetting } from 'app/lib/util';

const AnimatedContainer = (props) => {
    return (
        <View className='w-full mx-auto'>
            {props.children}
        </View>
    );
} 

export default AnimatedContainer;