import { View } from 'app/design/view'
import { SiteTopNav } from 'app/ui/molecules/tests/layouts/nav-components'
import { HeroSection, FeatureGrid } from 'app/ui/molecules/tests/layouts/demo-content'
import { Stack } from 'expo-router'
import { ScrollView } from 'react-native'

export default function SiteTopNavScreen() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 bg-background">
                <SiteTopNav isAuthenticated={false} />
                <ScrollView className="flex-1">
                    <HeroSection />
                    <FeatureGrid />
                </ScrollView>
            </View>
        </>
    )
}









