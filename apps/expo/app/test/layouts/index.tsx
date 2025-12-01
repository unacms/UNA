import LayoutsTestIndex from 'app/ui/molecules/tests/layouts/index'
import { Stack } from 'expo-router'

export default function LayoutsTestScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Layout Mocks' }} />
            <LayoutsTestIndex />
        </>
    )
}




