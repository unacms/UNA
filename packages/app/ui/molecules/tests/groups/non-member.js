'use client'

// Group page mock for authenticated users who are NOT members
// Requires 'use client' for: useState toggle, Button onClick handlers
import { useState } from 'react'
import { View, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { mockGroupData, mockPrivateGroupData } from './mock-data'
import {
    GroupHeader,
    GroupAbout,
    GroupRules,
    GroupAdmins,
    GroupMembers,
    PostCard,
    LockedContent,
} from './group-layout'
import Tabs from '../../tabs'
import Card from '../../card'

export default function GroupNonMember() {
    const [isPublicGroup, setIsPublicGroup] = useState(true)
    const [joinRequested, setJoinRequested] = useState(false)

    const group = isPublicGroup ? mockGroupData : mockPrivateGroupData
    const isPrivate = group.visibility !== '3'

    const handleJoin = () => {
        if (isPrivate) {
            setJoinRequested(true)
        } else {
            console.log('Joined public group')
        }
    }

    const tabs = [
        {
            key: 'posts',
            title: 'Posts',
            content: (
                <View className="p-4 gap-4">
                    {isPrivate ? (
                        <LockedContent
                            message="Join this group to see posts and participate in discussions."
                            icon="Lock"
                        />
                    ) : (
                        <>
                            {group.recent_posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </>
                    )}
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
                    {isPrivate ? (
                        <LockedContent
                            message="Member list is only visible to group members."
                            icon="Users"
                        />
                    ) : (
                        <GroupMembers members={group.members_list} totalCount={group.members_count} />
                    )}
                </View>
            ),
        },
    ]

    return (
        <ScrollView className="flex-1 bg-background">
            {/* Toggle for demo purposes */}
            <View className="p-4 bg-amber-500/10 border-b border-amber-500/20">
                <Text className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">Demo Controls</Text>
                <Button
                    variant={isPublicGroup ? 'primary' : 'outline'}
                    size="sm"
                    title={isPublicGroup ? 'Viewing: Public Group' : 'Viewing: Private Group'}
                    onPress={() => {
                        setIsPublicGroup(!isPublicGroup)
                        setJoinRequested(false)
                    }}
                />
            </View>

            <GroupHeader
                group={group}
                isPrivate={isPrivate}
                actionButton={
                    isPrivate ? (
                        joinRequested ? (
                            <Button
                                variant="secondary"
                                title="Request Pending"
                                startDecorator="Clock"
                                disabled
                            />
                        ) : (
                            <Button
                                variant="primary"
                                title="Request to Join"
                                startDecorator="UserPlus"
                                onPress={handleJoin}
                            />
                        )
                    ) : (
                        <Button
                            variant="primary"
                            title="Join Group"
                            startDecorator="UserPlus"
                            onPress={handleJoin}
                        />
                    )
                }
            />

            {/* Tabs */}
            <Card className="mx-4 mt-4">
                <Tabs tabs={tabs} activeTab="posts" />
            </Card>

            {/* Invitation prompt for non-members */}
            <View className="p-4">
                <Card className="p-4 bg-primary/5 border-primary/20">
                    <Text className="font-semibold text-foreground mb-1">
                        {isPrivate ? 'This is a private group' : 'Join to participate'}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                        {isPrivate
                            ? 'Your request will be reviewed by the group admins. You\'ll be notified once approved.'
                            : 'Join this group to post, comment, and interact with other members.'}
                    </Text>
                </Card>
            </View>
        </ScrollView>
    )
}


