'use client'

// Shared group page layout component for mocks
// Requires 'use client' for: Button onClick handlers, Icon (hydration-sensitive)
import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'
import Image from 'app/ui/atoms/image'
import Profile from 'app/ui/molecules/profile'
import Card from '../../card'
import Tabs from '../../tabs'

export function GroupHeader({ group, actionButton, isPrivate }) {
    return (
        <View className="relative">
            {/* Cover Image */}
            <View className="h-48 bg-muted overflow-hidden">
                {group.cover_url ? (
                    <Image
                        src={group.cover_url}
                        alt={group.title}
                        width={1200}
                        height={400}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <View className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center">
                        <Icon icon="Users" size={48} className="text-primary/40" />
                    </View>
                )}
            </View>

            {/* Group Info */}
            <View className="px-4 pb-4 -mt-8">
                <View className="flex-row items-end gap-4">
                    {/* Group Avatar */}
                    <View className="w-24 h-24 rounded-xl bg-card border-4 border-background overflow-hidden shadow-lg">
                        {group.thumb_url ? (
                            <Image
                                src={group.thumb_url}
                                alt={group.title}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <View className="w-full h-full bg-primary/10 items-center justify-center">
                                <Icon icon="Users" size={32} className="text-primary" />
                            </View>
                        )}
                    </View>

                    {/* Title & Stats */}
                    <View className="flex-1 pb-1">
                        <Row className="items-center gap-2 mb-1">
                            <Text className="text-2xl font-bold text-foreground">{group.title}</Text>
                            {isPrivate && (
                                <View className="bg-amber-500/10 px-2 py-0.5 rounded">
                                    <Text className="text-xs font-medium text-amber-600 dark:text-amber-400">Private</Text>
                                </View>
                            )}
                        </Row>
                        <Row className="gap-4">
                            <Row className="items-center gap-1">
                                <Icon icon="Users" size={14} className="text-muted-foreground" />
                                <Text className="text-sm text-muted-foreground">{group.members_count.toLocaleString()} members</Text>
                            </Row>
                            <Row className="items-center gap-1">
                                <Icon icon="FileText" size={14} className="text-muted-foreground" />
                                <Text className="text-sm text-muted-foreground">{group.posts_count} posts</Text>
                            </Row>
                        </Row>
                    </View>
                </View>

                {/* Action Button */}
                <View className="mt-4">
                    {actionButton}
                </View>
            </View>
        </View>
    )
}

export function GroupAbout({ group }) {
    return (
        <Card className="p-4">
            <Text className="text-lg font-semibold mb-2">About</Text>
            <Text className="text-muted-foreground mb-4">{group.description}</Text>

            <View className="gap-3">
                <Row className="items-center gap-2">
                    <Icon icon="Tag" size={16} className="text-muted-foreground" />
                    <Text className="text-sm text-muted-foreground">Category: {group.category}</Text>
                </Row>
                <Row className="items-center gap-2">
                    <Icon icon="Calendar" size={16} className="text-muted-foreground" />
                    <Text className="text-sm text-muted-foreground">Created: {group.created_at}</Text>
                </Row>
                <Row className="items-center gap-2">
                    <Icon icon={group.visibility === '3' ? 'Globe' : 'Lock'} size={16} className="text-muted-foreground" />
                    <Text className="text-sm text-muted-foreground">
                        {group.visibility === '3' ? 'Public group' : 'Private group'}
                    </Text>
                </Row>
            </View>
        </Card>
    )
}

export function GroupRules({ rules }) {
    return (
        <Card className="p-4">
            <Text className="text-lg font-semibold mb-3">Group Rules</Text>
            <View className="gap-2">
                {rules.map((rule, index) => (
                    <Row key={index} className="items-start gap-2">
                        <View className="w-5 h-5 rounded-full bg-primary/10 items-center justify-center mt-0.5">
                            <Text className="text-xs font-semibold text-primary">{index + 1}</Text>
                        </View>
                        <Text className="flex-1 text-sm text-foreground">{rule}</Text>
                    </Row>
                ))}
            </View>
        </Card>
    )
}

export function GroupAdmins({ admins }) {
    return (
        <Card className="p-4">
            <Text className="text-lg font-semibold mb-3">Admins & Moderators</Text>
            <View className="gap-3">
                {admins.map((admin) => (
                    <Row key={admin.id} className="items-center justify-between">
                        <Profile
                            id={admin.id}
                            display_name={admin.display_name}
                            url_avatar={admin.url_avatar}
                            displayType="unit"
                            displaySize="sm"
                            showLinks={false}
                        />
                        <View className="bg-secondary px-2 py-1 rounded">
                            <Text className="text-xs font-medium text-secondary-foreground">{admin.role}</Text>
                        </View>
                    </Row>
                ))}
            </View>
        </Card>
    )
}

export function GroupMembers({ members, totalCount }) {
    return (
        <Card className="p-4">
            <Row className="items-center justify-between mb-3">
                <Text className="text-lg font-semibold">Members</Text>
                <Text className="text-sm text-muted-foreground">{totalCount.toLocaleString()} total</Text>
            </Row>
            <View className="gap-2">
                {members.slice(0, 5).map((member) => (
                    <Profile
                        key={member.id}
                        id={member.id}
                        display_name={member.display_name}
                        url_avatar={member.url_avatar}
                        displayType="unit"
                        displaySize="sm"
                        showLinks={false}
                    />
                ))}
            </View>
            <Button
                variant="text"
                size="sm"
                title="View all members"
                className="mt-3"
                onPress={() => console.log('View all members')}
            />
        </Card>
    )
}

export function PostCard({ post }) {
    return (
        <Card className="p-4">
            <Row className="items-center gap-3 mb-3">
                <Profile
                    id={post.author.id || 1}
                    display_name={post.author.display_name}
                    url_avatar={post.author.url_avatar}
                    displayType="avatar"
                    displaySize="sm"
                    showLinks={false}
                />
                <View className="flex-1">
                    <Text className="font-medium text-foreground">{post.author.display_name}</Text>
                    <Text className="text-xs text-muted-foreground">{post.created_at}</Text>
                </View>
            </Row>
            <Text className="text-foreground mb-3">{post.content}</Text>
            <Row className="gap-4">
                <Row className="items-center gap-1">
                    <Icon icon="Heart" size={16} className="text-muted-foreground" />
                    <Text className="text-sm text-muted-foreground">{post.likes}</Text>
                </Row>
                <Row className="items-center gap-1">
                    <Icon icon="MessageCircle" size={16} className="text-muted-foreground" />
                    <Text className="text-sm text-muted-foreground">{post.comments}</Text>
                </Row>
            </Row>
        </Card>
    )
}

export function LockedContent({ message, icon = 'Lock' }) {
    return (
        <Card className="p-8 items-center">
            <View className="w-16 h-16 rounded-full bg-muted items-center justify-center mb-4">
                <Icon icon={icon} size={32} className="text-muted-foreground" />
            </View>
            <Text className="text-lg font-semibold text-foreground mb-2 text-center">Content Locked</Text>
            <Text className="text-muted-foreground text-center">{message}</Text>
        </Card>
    )
}

export function AuthPrompt({ title, description, onSignIn, onSignUp }) {
    return (
        <Card className="p-6 items-center">
            <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
                <Icon icon="UserPlus" size={32} className="text-primary" />
            </View>
            <Text className="text-xl font-bold text-foreground mb-2 text-center">{title}</Text>
            <Text className="text-muted-foreground text-center mb-6">{description}</Text>
            <View className="gap-3 w-full max-w-xs">
                <Button
                    variant="primary"
                    title="Sign In"
                    onPress={onSignIn}
                />
                <Button
                    variant="outline"
                    title="Create Account"
                    onPress={onSignUp}
                />
            </View>
        </Card>
    )
}

