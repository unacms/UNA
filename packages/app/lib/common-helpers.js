import { View, Row } from 'app/design/view';
import { Button } from 'app/design/controls';
import { Platform } from 'react-native'
import Link from 'app/ui/atoms/link'
import { memo } from 'react';
import Profile from "app/ui/molecules/profile";

export function getBackButtonWeb() {
    const isWeb = Platform.OS === 'web';
    if (!isWeb) return <></>;
    if (history.length > 2) {
        return (
            <View className="lg:hidden mr-1"  >
               <Button rounded={true} size="sm" ring="p-1" variant="secondary" startDecorator="ArrowLeft" onPress={() => history.back()}/>
            </View>
        )
    }
    else{
        return (
            <View className="lg:hidden mr-1"  >
                <Link href='/'>
                    <Button rounded={true} size="sm" ring="p-1" variant="secondary" startDecorator="ArrowLeft" />
                </Link>
            </View>
        )
    }
}

export const AuthorData = memo(({ authorData, displaySize }) => (
    <Profile
        {...authorData}
        displayType="unit"
        displaySize={displaySize || "xs"}
        showInfo="false"
    />
));