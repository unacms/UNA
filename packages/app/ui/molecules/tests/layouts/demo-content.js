'use client'

// Demo content for layout previews
// Requires 'use client' for: Button onClick handlers, Icon (hydration-sensitive)
import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'
import Card from '../../card'

// Hero section for site layouts
export function HeroSection() {
    return (
        <View className="w-full py-16 px-4 bg-gradient-to-b from-primary/5 to-transparent">
            <View className="max-w-3xl mx-auto items-center text-center">
                <View className="mb-4 px-4 py-1.5 rounded-full bg-primary/10 self-center">
                    <Text className="text-sm font-medium text-primary">Welcome to NEO</Text>
                </View>
                <Text className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                    Connect, Share, and Grow Together
                </Text>
                <Text className="text-lg text-muted-foreground mb-8 max-w-xl">
                    Join a community of creators, thinkers, and innovators. Share your ideas and discover what matters to you.
                </Text>
                <Row className="gap-3 justify-center">
                    <Button variant="primary" size="lg" title="Get Started" />
                    <Button variant="outline" size="lg" title="Learn More" />
                </Row>
            </View>
        </View>
    )
}

// Feature grid for site layouts
export function FeatureGrid() {
    const features = [
        { icon: 'Users', title: 'Communities', description: 'Join groups that match your interests' },
        { icon: 'MessageCircle', title: 'Conversations', description: 'Engage in meaningful discussions' },
        { icon: 'Calendar', title: 'Events', description: 'Discover and create local events' },
        { icon: 'Shield', title: 'Privacy First', description: 'Your data stays yours' },
    ]

    return (
        <View className="w-full py-12 px-4">
            <View className="max-w-5xl mx-auto">
                <Text className="text-2xl font-bold text-foreground text-center mb-8">Why Choose NEO</Text>
                <View className="flex-row flex-wrap gap-4 justify-center">
                    {features.map((feature) => (
                        <Card key={feature.title} className="w-full sm:w-64 p-6">
                            <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center mb-4">
                                <Icon icon={feature.icon} size={24} className="text-primary" />
                            </View>
                            <Text className="text-lg font-semibold text-foreground mb-2">{feature.title}</Text>
                            <Text className="text-sm text-muted-foreground">{feature.description}</Text>
                        </Card>
                    ))}
                </View>
            </View>
        </View>
    )
}

// Dashboard content for authenticated layouts
export function DashboardContent() {
    const stats = [
        { label: 'Posts', value: '24', change: '+3 this week', icon: 'FileText' },
        { label: 'Followers', value: '1.2k', change: '+48 this month', icon: 'Users' },
        { label: 'Messages', value: '8', change: '3 unread', icon: 'MessageCircle' },
        { label: 'Notifications', value: '12', change: '5 new', icon: 'Bell' },
    ]

    return (
        <View className="p-4 gap-6">
            <View>
                <Text className="text-2xl font-bold text-foreground mb-1">Welcome back!</Text>
                <Text className="text-muted-foreground">Here's what's happening in your network</Text>
            </View>

            <View className="flex-row flex-wrap gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="flex-1 min-w-36 p-4">
                        <Row className="items-center justify-between mb-2">
                            <Text className="text-sm font-medium text-muted-foreground">{stat.label}</Text>
                            <Icon icon={stat.icon} size={18} className="text-muted-foreground" />
                        </Row>
                        <Text className="text-2xl font-bold text-foreground">{stat.value}</Text>
                        <Text className="text-xs text-muted-foreground mt-1">{stat.change}</Text>
                    </Card>
                ))}
            </View>

            <Card className="p-4">
                <Text className="text-lg font-semibold text-foreground mb-4">Recent Activity</Text>
                <View className="gap-3">
                    {[1, 2, 3].map((i) => (
                        <Row key={i} className="items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
                                <Icon icon="User" size={18} className="text-muted-foreground" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-medium text-foreground">User {i} liked your post</Text>
                                <Text className="text-xs text-muted-foreground">{i} hour{i > 1 ? 's' : ''} ago</Text>
                            </View>
                        </Row>
                    ))}
                </View>
            </Card>
        </View>
    )
}

// Feed content for app layouts
export function FeedContent() {
    const posts = [
        { id: 1, author: 'Alex Rivera', content: 'Just shipped a new feature! 🚀', likes: 42, comments: 8, time: '2h' },
        { id: 2, author: 'Sarah Chen', content: 'Great article on React Server Components...', likes: 89, comments: 23, time: '4h' },
        { id: 3, author: 'Mike Johnson', content: 'Who else is excited about the new updates?', likes: 156, comments: 34, time: '6h' },
    ]

    return (
        <View className="max-w-2xl mx-auto p-4 gap-4">
            {/* Create post */}
            <Card className="p-4">
                <Row className="items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                        <Icon icon="User" size={18} className="text-primary" />
                    </View>
                    <View className="flex-1 h-10 px-4 rounded-full bg-muted items-center justify-center">
                        <Text className="text-sm text-muted-foreground">What's on your mind?</Text>
                    </View>
                </Row>
            </Card>

            {/* Posts */}
            {posts.map((post) => (
                <Card key={post.id} className="p-4">
                    <Row className="items-center gap-3 mb-3">
                        <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
                            <Icon icon="User" size={18} className="text-muted-foreground" />
                        </View>
                        <View className="flex-1">
                            <Text className="font-medium text-foreground">{post.author}</Text>
                            <Text className="text-xs text-muted-foreground">{post.time} ago</Text>
                        </View>
                        <Button variant="text" size="xs" title="" startDecorator="MoreHorizontal" />
                    </Row>
                    <Text className="text-foreground mb-4">{post.content}</Text>
                    <Row className="gap-4 pt-3 border-t border-border">
                        <Button variant="text" size="sm" title={`${post.likes}`} startDecorator="Heart" />
                        <Button variant="text" size="sm" title={`${post.comments}`} startDecorator="MessageCircle" />
                        <Button variant="text" size="sm" title="Share" startDecorator="Share2" />
                    </Row>
                </Card>
            ))}
        </View>
    )
}


