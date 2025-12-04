import GroupsTestIndex from 'app/ui/molecules/tests/groups/index'
import { Stack } from 'expo-router'

export default function GroupsTestScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Group Page Mocks' }} />
            <GroupsTestIndex />
        </>
    )
}








