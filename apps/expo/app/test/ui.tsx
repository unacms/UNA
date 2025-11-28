import UIComponents from 'app/ui/molecules/tests/ui'
import { Stack } from 'expo-router'

export default function TestUIScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'UI Components' }} />
            <UIComponents />
        </>
    )
}



