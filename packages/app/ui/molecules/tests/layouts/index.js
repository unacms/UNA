// Layouts test index - Server Component
// Interactive elements use client wrappers

import { View, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import { LinkCard, AuthBadge, Icon } from './client-wrappers'

const layoutTests = [
    {
        title: 'Site Top Nav',
        description: 'Public/unauthenticated pages with horizontal navigation bar',
        icon: 'PanelTop',
        href: '/test/layouts/site-topnav',
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10',
        isAuthenticated: false,
    },
    {
        title: 'Site Sidebar',
        description: 'Authenticated users with vertical sidebar navigation',
        icon: 'PanelLeft',
        href: '/test/layouts/site-sidebar',
        iconColor: 'text-green-500',
        iconBg: 'bg-green-500/10',
        isAuthenticated: true,
    },
    {
        title: 'App Top Nav',
        description: 'Authenticated app interface with compact top navigation',
        icon: 'LayoutDashboard',
        href: '/test/layouts/app-topnav',
        iconColor: 'text-purple-500',
        iconBg: 'bg-purple-500/10',
        isAuthenticated: true,
    },
    {
        title: 'App Sidebar',
        description: 'Authenticated app interface with icon-focused sidebar navigation',
        icon: 'Sidebar',
        href: '/test/layouts/app-sidebar',
        iconColor: 'text-orange-500',
        iconBg: 'bg-orange-500/10',
        isAuthenticated: true,
    },
]

// Client component for layout card with auth badge
function LayoutCard({ item }) {
    return (
        <LinkCard
            href={item.href}
            icon={item.icon}
            title={item.title}
            description={item.description}
            iconColor={item.iconColor}
            iconBg={item.iconBg}
        />
    )
}

export default function LayoutsTestIndex() {
    return (
        <ScrollView className="p-4">
            <Text className="text-3xl font-bold mb-2">Layout Mocks</Text>
            <Text className="text-muted-foreground mb-8">
                Experimental navigation layouts for different user states and interfaces.
            </Text>

            <View className="gap-4">
                {layoutTests.map((item) => (
                    <LayoutCard key={item.href} item={item} />
                ))}
            </View>

            {/* Static info card - no icons needed */}
            <View className="mt-8 p-4 rounded-lg bg-muted/50 border border-border/60">
                <Text className="font-semibold text-foreground mb-2">About these layouts</Text>
                <Text className="text-sm text-muted-foreground mb-3">
                    These are isolated experimental layouts using server components with caching enabled.
                    They demonstrate different navigation patterns for:
                </Text>
                <View className="gap-2">
                    <View className="flex-row items-start gap-2">
                        <Text className="text-sm text-muted-foreground flex-1">
                            <Text className="font-medium text-foreground">• Site layouts</Text> - Marketing, public pages, landing pages
                        </Text>
                    </View>
                    <View className="flex-row items-start gap-2">
                        <Text className="text-sm text-muted-foreground flex-1">
                            <Text className="font-medium text-foreground">• App layouts</Text> - Social features, feed, messaging
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    )
}
