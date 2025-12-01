import GroupUnauthenticated from 'app/ui/molecules/tests/groups/unauthenticated'
import { Stack } from 'expo-router'

export default function GroupUnauthenticatedScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Unauthenticated User' }} />
            <GroupUnauthenticated />
        </>
    )
}





