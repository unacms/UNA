import { View } from 'app/design/view';

const AnimatedContainer = (props) => {
    return (
        <View className='w-full mx-auto'>
            {props.children}
        </View>
    );
} 

export default AnimatedContainer;