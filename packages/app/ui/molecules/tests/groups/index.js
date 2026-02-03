// Groups test index - Server Component
// Interactive elements use client wrappers

import { View, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import { LinkCard } from '../layouts/client-wrappers'

const groupTests = [
    {
        title: 'Unauthenticated User',
        description: 'How a group page looks to visitors who are not signed in',
        icon: 'UserX',
        href: '/test/groups/unauthenticated',
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-500/10',
    },
    {
        title: 'Non-Member',
        description: 'Authenticated user who has not joined the group',
        icon: 'UserMinus',
        href: '/test/groups/non-member',
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10',
    },
    {
        title: 'Group Member',
        description: 'Authenticated user who is a member of the group',
        icon: 'UserCheck',
        href: '/test/groups/member',
        iconColor: 'text-green-500',
        iconBg: 'bg-green-500/10',
    },
]

export default function GroupsTestIndex() {
    return (
        <ScrollView className="p-4">
            <Text className="text-3xl font-bold mb-2">Group Page Mocks</Text>
            <Text className="text-muted-foreground mb-8">
                Test different user states and permission levels on group pages.
            </Text>

            <View className="gap-4">
                {groupTests.map((item) => (
                    <LinkCard
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        title={item.title}
                        description={item.description}
                        iconColor={item.iconColor}
                        iconBg={item.iconBg}
                    />
                ))}
            </View>

            {/* Static info card */}
            <View className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
                <Text className="font-semibold text-foreground mb-2">About these mocks</Text>
                <Text className="text-sm text-muted-foreground">
                    These pages demonstrate how group content and actions change based on user authentication
                    and membership status. Use them to verify UI consistency and test permission-based features.
                </Text>
            </View>
        </ScrollView>
    )
}
