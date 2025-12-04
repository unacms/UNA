import GroupNonMember from 'app/ui/molecules/tests/groups/non-member'
import { Stack } from 'expo-router'

export default function GroupNonMemberScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Non-Member' }} />
            <GroupNonMember />
        </>
    )
}








