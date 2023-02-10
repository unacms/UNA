import { Text} from 'app/design/typography'
import { View } from 'app/design/view'

export default function ElementMsg({data}) {
    if (!data.length)
        return null;
    return (
        <View className="alert alert-info shadow-lg ">
            <View>
                <Text>{data}</Text>
            </View>
        </View>
    );
}
