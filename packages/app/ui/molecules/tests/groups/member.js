'use client'

// Group page mock for authenticated users who ARE members
// Requires 'use client' for: useState for notifications toggle, Button onClick handlers
import { useState } from 'react'
import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'
import { mockGroupData } from './mock-data'
import {
    GroupHeader,
    GroupAbout,
    GroupRules,
    GroupAdmins,
    GroupMembers,
    PostCard,
} from './group-layout'
import Tabs from '../../tabs'
import Card from '../../card'
import Profile from '../../profile'

function CreatePostBox() {
    return (
        <Card className="p-4">
            <Row className="items-center gap-3">
                <Profile
                    id={999}
                    display_name="You"
                    url_avatar={null}
                    displayType="avatar"
                    displaySize="sm"
                    showLinks={false}
                />
                <View className="flex-1 bg-muted rounded-lg px-4 py-3">
                    <Text className="text-muted-foreground">What's on your mind?</Text>
                </View>
            </Row>
            <Row className="mt-3 pt-3 border-t border-border/60 gap-2">
                <Button
                    variant="text"
                    size="sm"
                    title="Photo"
                    startDecorator="Image"
                    onPress={() => console.log('Add photo')}
                />
                <Button
                    variant="text"
                    size="sm"
                    title="Poll"
                    startDecorator="BarChart2"
                    onPress={() => console.log('Create poll')}
                />
                <Button
                    variant="text"
                    size="sm"
                    title="Event"
                    startDecorator="Calendar"
                    onPress={() => console.log('Create event')}
                />
            </Row>
        </Card>
    )
}

function MemberActions() {
    const [notificationsOn, setNotificationsOn] = useState(true)

    return (
        <Card className="p-4">
            <Text className="text-lg font-semibold mb-3">Your Membership</Text>
            <View className="gap-2">
                <Row className="items-center justify-between py-2">
                    <Row className="items-center gap-2">
                        <Icon icon="Bell" size={18} className="text-muted-foreground" />
                        <Text className="text-foreground">Notifications</Text>
                    </Row>
                    <Button
                        variant={notificationsOn ? 'secondary' : 'outline'}
                        size="xs"
                        title={notificationsOn ? 'On' : 'Off'}
                        onPress={() => setNotificationsOn(!notificationsOn)}
                    />
                </Row>
                <Row className="items-center justify-between py-2">
                    <Row className="items-center gap-2">
                        <Icon icon="Star" size={18} className="text-muted-foreground" />
                        <Text className="text-foreground">Add to Favorites</Text>
                    </Row>
                    <Button
                        variant="outline"
                        size="xs"
                        title="Add"
                        onPress={() => console.log('Add to favorites')}
                    />
                </Row>
                <Row className="items-center justify-between py-2">
                    <Row className="items-center gap-2">
                        <Icon icon="Share2" size={18} className="text-muted-foreground" />
                        <Text className="text-foreground">Invite Friends</Text>
                    </Row>
                    <Button
                        variant="outline"
                        size="xs"
                        title="Invite"
                        onPress={() => console.log('Invite friends')}
                    />
                </Row>
                <View className="pt-2 mt-2 border-t border-border">
                    <Button
                        variant="text"
                        size="sm"
                        title="Leave Group"
                        startDecorator="LogOut"
                        className="text-destructive"
                        onPress={() => console.log('Leave group')}
                    />
                </View>
            </View>
        </Card>
    )
}

function GroupEvents() {
    const events = [
        { id: 1, title: 'Weekly Q&A Session', date: 'Tomorrow, 3:00 PM', attendees: 24 },
        { id: 2, title: 'Code Review Workshop', date: 'Dec 5, 2:00 PM', attendees: 18 },
    ]

    return (
        <Card className="p-4">
            <Row className="items-center justify-between mb-3">
                <Text className="text-lg font-semibold">Upcoming Events</Text>
                <Button
                    variant="text"
                    size="xs"
                    title="See all"
                    onPress={() => console.log('See all events')}
                />
            </Row>
            <View className="gap-3">
                {events.map((event) => (
                    <View key={event.id} className="p-3 bg-muted/50 rounded-lg">
                        <Text className="font-medium text-foreground">{event.title}</Text>
                        <Row className="items-center gap-3 mt-1">
                            <Row className="items-center gap-1">
                                <Icon icon="Calendar" size={12} className="text-muted-foreground" />
                                <Text className="text-xs text-muted-foreground">{event.date}</Text>
                            </Row>
                            <Row className="items-center gap-1">
                                <Icon icon="Users" size={12} className="text-muted-foreground" />
                                <Text className="text-xs text-muted-foreground">{event.attendees} going</Text>
                            </Row>
                        </Row>
                    </View>
                ))}
            </View>
        </Card>
    )
}

export default function GroupMember() {
    const group = mockGroupData
    const isPrivate = group.visibility !== '3'

    const tabs = [
        {
            key: 'posts',
            title: 'Posts',
            content: (
                <View className="p-4 gap-4">
                    <CreatePostBox />
                    {group.recent_posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </View>
            ),
        },
        {
            key: 'about',
            title: 'About',
            content: (
                <View className="p-4 gap-4">
                    <GroupAbout group={group} />
                    <GroupRules rules={group.rules} />
                    <GroupAdmins admins={group.admins} />
                </View>
            ),
        },
        {
            key: 'members',
            title: 'Members',
            content: (
                <View className="p-4 gap-4">
                    <GroupMembers members={group.members_list} totalCount={group.members_count} />
                </View>
            ),
        },
        {
            key: 'events',
            title: 'Events',
            content: (
                <View className="p-4 gap-4">
                    <GroupEvents />
                </View>
            ),
        },
    ]

    return (
        <ScrollView className="flex-1 bg-background">
            {/* Member badge indicator */}
            <View className="p-4 bg-green-500/10 border-b border-green-500/20">
                <Row className="items-center gap-2">
                    <Icon icon="CheckCircle" size={16} className="text-green-600 dark:text-green-400" />
                    <Text className="text-sm font-medium text-green-700 dark:text-green-300">
                        You are a member of this group
                    </Text>
                </Row>
            </View>

            <GroupHeader
                group={group}
                isPrivate={isPrivate}
                actionButton={
                    <Row className="gap-2">
                        <Button
                            variant="primary"
                            title="New Post"
                            startDecorator="Plus"
                            onPress={() => console.log('Create post')}
                        />
                        <Button
                            variant="outline"
                            title=""
                            startDecorator="MoreHorizontal"
                            onPress={() => console.log('More options')}
                        />
                    </Row>
                }
            />

            {/* Tabs */}
            <Card className="mx-4 mt-4">
                <Tabs tabs={tabs} activeTab="posts" />
            </Card>

            {/* Member-only sidebar content */}
            <View className="p-4 gap-4">
                <MemberActions />
                <GroupEvents />
            </View>
        </ScrollView>
    )
}


