import TestsIndex from 'app/ui/molecules/tests/index'
import { Stack } from 'expo-router'

export default function TestScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Prototypes' }} />
            <TestsIndex />
        </>
    )
}





