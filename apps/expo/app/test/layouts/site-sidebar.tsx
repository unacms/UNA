import { View } from 'app/design/view'
import { SiteSidebar } from 'app/ui/molecules/tests/layouts/nav-components'
import { DashboardContent } from 'app/ui/molecules/tests/layouts/demo-content'
import { Stack } from 'expo-router'
import { ScrollView } from 'react-native'

export default function SiteSidebarScreen() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View className="flex-1 flex-row bg-background">
                <SiteSidebar />
                <ScrollView className="flex-1">
                    <DashboardContent />
                </ScrollView>
            </View>
        </>
    )
}








