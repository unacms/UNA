import GroupMember from 'app/ui/molecules/tests/groups/member'
import { Stack } from 'expo-router'

export default function GroupMemberScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Group Member' }} />
            <GroupMember />
        </>
    )
}









