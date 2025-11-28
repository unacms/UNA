'use client'

// Group page mock for unauthenticated users
// Requires 'use client' for: Button onClick handlers, interactive cards
import { View, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { mockGroupData } from './mock-data'
import {
    GroupHeader,
    GroupAbout,
    GroupRules,
    AuthPrompt,
} from './group-layout'

export default function GroupUnauthenticated() {
    const group = mockGroupData
    const isPrivate = group.visibility !== '3'

    return (
        <ScrollView className="flex-1 bg-background">
            <GroupHeader
                group={group}
                isPrivate={isPrivate}
                actionButton={
                    <Button
                        variant="primary"
                        title="Sign in to Join"
                        startDecorator="LogIn"
                        onPress={() => console.log('Sign in clicked')}
                    />
                }
            />

            <View className="p-4 gap-4">
                {/* About Section - Always visible */}
                <GroupAbout group={group} />

                {/* Rules - Always visible */}
                <GroupRules rules={group.rules} />

                {/* Auth Prompt - Main CTA */}
                <AuthPrompt
                    title="Join the conversation"
                    description="Sign in or create an account to join this group, see posts, and connect with other members."
                    onSignIn={() => console.log('Sign in')}
                    onSignUp={() => console.log('Sign up')}
                />

                {/* Teaser - Limited info for unauthenticated */}
                <View className="bg-muted/30 rounded-lg p-6 items-center">
                    <Text className="text-4xl font-bold text-primary mb-1">{group.members_count.toLocaleString()}</Text>
                    <Text className="text-muted-foreground">members already joined</Text>
                </View>

                {/* Footer note */}
                <Text className="text-center text-sm text-muted-foreground">
                    This is a {isPrivate ? 'private' : 'public'} group. {isPrivate ? 'Membership requires approval.' : 'Anyone can join and see posts.'}
                </Text>
            </View>
        </ScrollView>
    )
}


