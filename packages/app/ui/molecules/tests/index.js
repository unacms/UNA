// Tests index - Server Component
// Interactive list items use client wrappers for icons

import { View, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import { LinkCard } from './layouts/client-wrappers'

const prototypes = [
    {
        title: 'UI Components',
        description: 'Buttons, HoverCards, Tabs, and other core UI elements',
        icon: 'Palette',
        href: '/test/ui',
    },
    {
        title: 'Group Pages',
        description: 'Group page mocks for different user states and permissions',
        icon: 'Users',
        href: '/test/groups',
    },
    {
        title: 'Layouts',
        description: 'Navigation layouts for different user states and interfaces',
        icon: 'Layout',
        href: '/test/layouts',
    },
]

export default function TestsIndex() {
    return (
        <ScrollView className="p-4">
            <Text className="text-3xl font-bold mb-2">Prototypes & Mocks</Text>
            <Text className="text-muted-foreground mb-8">
                A collection of component demos, UI experiments, and testing grounds.
            </Text>

            <View className="gap-4">
                {prototypes.map((item) => (
                    <LinkCard
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        title={item.title}
                        description={item.description}
                    />
                ))}
            </View>
        </ScrollView>
    )
}
