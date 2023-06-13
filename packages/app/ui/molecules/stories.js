import { StoryContainer } from 'react-native-stories-view';
import { View } from 'app/design/view'

export default function Story(props) {
    return <View className="w-full h-48 bg-red-500"><StoryContainer
    visible={true}
    enableProgress={true}
    images={props.data}
    duration={20}  
    onComplete={() => alert("onComplete")}
    containerStyle={{
        width: '100%',
        height: '100%',
    }}
 /></View>
}