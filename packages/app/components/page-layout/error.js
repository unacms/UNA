import { View } from 'app/design/view'
import { Text, H1 } from 'app/design/typography'

export default function Home(props) {
    return (
        <View className="flex-auto relative w-xl flex-col mx-auto">
            <H1 className="text-destructive">{props.status}</H1>            
            <Text className="text-card-foreground">{props.error}</Text>            
        </View>
    );
}