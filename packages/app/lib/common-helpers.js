import { View, Row } from 'app/design/view';
import { Button } from 'app/design/controls';
import { Platform } from 'react-native'

export function getBackButtonWeb() {
    const isWeb = Platform.OS === 'web';
    if (!isWeb) return <></>;
    if (history.length > 2) {
        return (
            <View className="lg:hidden mr-2"  >
               <Button rounded={true} variant="secondary" startDecorator="ArrowLeft" onPress={() => history.back()}/>
            </View>
        )
    }
    return <></>
}