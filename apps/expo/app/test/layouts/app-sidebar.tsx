import { View } from 'app/design/view'
import { AppSidebar } from 'app/ui/molecules/tests/layouts/nav-components'
import { FeedContent } from 'app/ui/molecules/tests/layouts/demo-content'
import { Stack } from 'expo-router'
import { ScrollView } from 'react-native'

export default function AppSidebarScreen() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 flex-row bg-background">
                <AppSidebar expanded={true} />
                <ScrollView className="flex-1">
                    <FeedContent />
                </ScrollView>
            </View>
        </>
    )
}









