'use client'

// Group page mock for unauthenticated users
// Layout matches wireframe: navbar → cover → name+actions → tabs+menu → content+sidebar
import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'
import { mockGroupData } from './mock-data'
import Card from '../../card'

// =============================================================================
// NAVBAR - Global Navigation
// =============================================================================
function AppNavbar() {
    return (
        <View className="bg-primary px-4 py-3">
            <Row className="items-center justify-between max-w-6xl mx-auto w-full">
                <Row className="items-center gap-4">
                    {/* Logo */}
                    <Row className="items-center gap-2">
                        <View className="w-8 h-8 rounded-lg bg-white/20 items-center justify-center">
                            <Icon icon="Zap" size={18} className="text-white" />
                        </View>
                        <Text className="text-white font-bold text-lg">NEO</Text>
                    </Row>
                    {/* Nav Links */}
                    <Row className="gap-4 hidden md:flex">
                        <Text className="text-white/80 hover:text-white cursor-pointer">Home</Text>
                        <Text className="text-white/80 hover:text-white cursor-pointer">Groups</Text>
                        <Text className="text-white/80 hover:text-white cursor-pointer">People</Text>
                    </Row>
                </Row>
                <Row className="items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        title="Sign In"
                        className="text-white border-white/30"
                        onPress={() => console.log('Sign in')}
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        title="Sign Up"
                        onPress={() => console.log('Sign up')}
                    />
                </Row>
            </Row>
        </View>
    )
}

// =============================================================================
// COVER IMAGE - 16:9 aspect ratio, contained width
// =============================================================================
function GroupCover({ title }) {
    return (
        <View className="px-4 py-4 bg-muted/30">
            <View className="max-w-6xl mx-auto w-full">
                {/* 16:9 aspect ratio container */}
                <View className="aspect-video rounded-xl overflow-hidden relative">
                    {/* Vibrant gradient background */}
                    <View className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500" />
                    
                    {/* Decorative pattern overlay */}
                    <View className="absolute inset-0 opacity-20">
                        <View className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/30 blur-2xl" />
                        <View className="absolute top-20 right-20 w-48 h-48 rounded-full bg-pink-300/40 blur-3xl" />
                        <View className="absolute bottom-10 left-1/3 w-40 h-40 rounded-full bg-indigo-300/30 blur-2xl" />
                    </View>
                    
                    {/* Grid pattern */}
                    <View 
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}
                    />
                    
                    {/* Centered icon */}
                    <View className="absolute inset-0 items-center justify-center">
                        <View className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm items-center justify-center border border-white/20">
                            <Icon icon="Users" size={48} className="text-white/70" />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )
}

// =============================================================================
// GROUP NAME + MAIN ACTIONS
// =============================================================================
function GroupNameBar({ group, isPrivate }) {
    return (
        <View className="bg-primary/10 dark:bg-primary/5 px-4 py-4">
            <Row className="items-center justify-between max-w-6xl mx-auto w-full">
                <Row className="items-center gap-3">
                    <Text className="text-2xl font-bold text-foreground">
                        {group.title}
                    </Text>
                    {isPrivate && (
                        <View className="bg-amber-500/10 px-2 py-0.5 rounded">
                            <Text className="text-xs font-medium text-amber-600 dark:text-amber-400">Private</Text>
                        </View>
                    )}
                </Row>
                <Row className="items-center gap-2">
                    <Button
                        variant="primary"
                        title="Join"
                        startDecorator="UserPlus"
                        onPress={() => console.log('Join clicked - requires auth')}
                    />
                    <Button
                        variant="outline"
                        title="Share"
                        startDecorator="Share2"
                        onPress={() => console.log('Share clicked')}
                    />
                </Row>
            </Row>
        </View>
    )
}

// =============================================================================
// GROUP TABS + ALL ACTIONS MENU
// =============================================================================
function GroupTabsBar({ activeTab = 'feed', onTabChange }) {
    const tabs = [
        { id: 'feed', label: 'Feed', icon: 'Newspaper' },
        { id: 'about', label: 'About', icon: 'Info' },
        { id: 'members', label: 'Members', icon: 'Users' },
    ]

    return (
        <View className="bg-primary/5 dark:bg-primary/10 px-4 py-2 border-b border-border">
            <Row className="items-center justify-between max-w-6xl mx-auto w-full">
                {/* Tabs */}
                <Row className="gap-1">
                    {tabs.map((tab) => (
                        <Button
                            key={tab.id}
                            variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                            size="sm"
                            title={tab.label}
                            startDecorator={tab.icon}
                            onPress={() => onTabChange?.(tab.id)}
                        />
                    ))}
                </Row>
                {/* All Actions Menu */}
                <Row className="items-center gap-2">
                    <Text className="text-sm font-medium text-muted-foreground hidden sm:block">
                        All Actions:
                    </Text>
                    <Row className="gap-1">
                        <Button variant="ghost" size="sm" title="Join" startDecorator="UserPlus" onPress={() => {}} />
                        <Button variant="ghost" size="sm" title="Manage" startDecorator="Settings" onPress={() => {}} />
                        <Button variant="ghost" size="sm" title="Share" startDecorator="Share2" onPress={() => {}} />
                        <Button variant="ghost" size="sm" title="Report" startDecorator="Flag" onPress={() => {}} />
                    </Row>
                </Row>
            </Row>
        </View>
    )
}

// =============================================================================
// GROUP INTRO - Rich text content area
// =============================================================================
function GroupIntro({ group }) {
    return (
        <Card className="p-6">
            {/* 16:9 Image */}
            <View className="aspect-video rounded-xl overflow-hidden relative mb-4">
                {/* Vibrant gradient background */}
                <View className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500" />
                
                {/* Decorative pattern overlay */}
                <View className="absolute inset-0 opacity-20">
                    <View className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/30 blur-2xl" />
                    <View className="absolute top-20 right-20 w-48 h-48 rounded-full bg-pink-300/40 blur-3xl" />
                    <View className="absolute bottom-10 left-1/3 w-40 h-40 rounded-full bg-indigo-300/30 blur-2xl" />
                </View>
                
                {/* Grid pattern */}
                <View 
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />
                
                {/* Centered icon */}
                <View className="absolute inset-0 items-center justify-center">
                    <View className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm items-center justify-center border border-white/20">
                        <Icon icon="Users" size={48} className="text-white/70" />
                    </View>
                </View>
            </View>
            <Text className="text-lg font-semibold mb-4">Welcome to {group.title}</Text>
            <View className="gap-4">
                {/* Rich text intro - simulating formatted content */}
                <Text className="text-foreground leading-relaxed">
                    {group.description}
                </Text>
                <Text className="text-foreground leading-relaxed">
                    This community brings together <Text className="font-semibold text-primary">{group.members_count.toLocaleString()}</Text> passionate 
                    members who share knowledge, discuss best practices, and help each other succeed.
                </Text>
                
                {/* Simulated rich content elements */}
                <View className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                    <Text className="text-foreground italic">
                        "The best way to learn is to teach others. Join us and share your knowledge!"
                    </Text>
                    <Text className="text-sm text-muted-foreground mt-2">— Community Guidelines</Text>
                </View>

                {/* Links example */}
                <Row className="gap-4 flex-wrap">
                    <Row className="items-center gap-1">
                        <Icon icon="ExternalLink" size={14} className="text-primary" />
                        <Text className="text-primary underline cursor-pointer">Getting Started Guide</Text>
                    </Row>
                    <Row className="items-center gap-1">
                        <Icon icon="ExternalLink" size={14} className="text-primary" />
                        <Text className="text-primary underline cursor-pointer">Code of Conduct</Text>
                    </Row>
                </Row>
            </View>
        </Card>
    )
}

// =============================================================================
// APP INTRO - Call to Action Section
// =============================================================================
function AppIntro({ onSignIn, onSignUp }) {
    return (
        <Card className="p-6 bg-primary/5 dark:bg-primary/10 border-primary/20">
            <View className="items-center text-center">
                <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-4">
                    <Icon icon="Sparkles" size={32} className="text-primary" />
                </View>
                <Text className="text-xl font-bold text-foreground mb-2">Join the Community</Text>
                <Text className="text-muted-foreground mb-6 max-w-md">
                    Sign in or create an account to participate in discussions, share your knowledge, and connect with other members.
                </Text>
                <Row className="gap-3">
                    <Button
                        variant="primary"
                        title="Sign In"
                        startDecorator="LogIn"
                        onPress={onSignIn}
                    />
                    <Button
                        variant="outline"
                        title="Create Account"
                        startDecorator="UserPlus"
                        onPress={onSignUp}
                    />
                </Row>
            </View>
        </Card>
    )
}

// =============================================================================
// ABOUT SIDEBAR
// =============================================================================
function AboutSidebar({ group, isPrivate }) {
    const isHidden = false // Could be from group data

    return (
        <Card className="p-5">
            <Text className="text-lg font-semibold mb-4">About</Text>
            <View className="gap-4">
                {/* Overview */}
                <View>
                    <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Overview</Text>
                    <Text className="text-sm text-foreground">{group.category} community</Text>
                </View>

                {/* Privacy Status */}
                <View>
                    <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Privacy</Text>
                    <Row className="items-center gap-2">
                        <Icon 
                            icon={isPrivate ? 'Lock' : 'Globe'} 
                            size={16} 
                            className={isPrivate ? 'text-amber-500' : 'text-green-500'} 
                        />
                        <Text className="text-sm text-foreground">
                            {isPrivate ? 'Private' : 'Public'}
                        </Text>
                    </Row>
                    <Text className="text-xs text-muted-foreground mt-1">
                        {isPrivate 
                            ? 'Only members can see posts' 
                            : 'Anyone can see posts'
                        }
                    </Text>
                </View>

                {/* Visibility */}
                <View>
                    <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Visibility</Text>
                    <Row className="items-center gap-2">
                        <Icon 
                            icon={isHidden ? 'EyeOff' : 'Eye'} 
                            size={16} 
                            className={isHidden ? 'text-muted-foreground' : 'text-blue-500'} 
                        />
                        <Text className="text-sm text-foreground">
                            {isHidden ? 'Hidden' : 'Visible'}
                        </Text>
                    </Row>
                    <Text className="text-xs text-muted-foreground mt-1">
                        {isHidden 
                            ? 'Only members can find this group' 
                            : 'Anyone can find this group'
                        }
                    </Text>
                </View>

                {/* Location */}
                <View>
                    <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Location</Text>
                    <Row className="items-center gap-2">
                        <Icon icon="MapPin" size={16} className="text-muted-foreground" />
                        <Text className="text-sm text-foreground">Worldwide</Text>
                    </Row>
                </View>

                {/* Member Count */}
                <View>
                    <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Members</Text>
                    <Row className="items-center gap-2">
                        <Icon icon="Users" size={16} className="text-primary" />
                        <Text className="text-sm font-semibold text-foreground">
                            {group.members_count.toLocaleString()}
                        </Text>
                    </Row>
                </View>

                {/* Created */}
                <View>
                    <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Created</Text>
                    <Row className="items-center gap-2">
                        <Icon icon="Calendar" size={16} className="text-muted-foreground" />
                        <Text className="text-sm text-foreground">{group.created_at}</Text>
                    </Row>
                </View>
            </View>
        </Card>
    )
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================
export default function GroupUnauthenticated() {
    const group = mockGroupData
    const isPrivate = group.visibility !== '3'

    return (
        <View className="flex-1 bg-background min-h-screen">
            {/* App Navbar - Global Navigation */}
            <AppNavbar />

            <ScrollView className="flex-1">
                {/* Group Cover Image - 16:9 (hidden) */}
                <View className="hidden">
                    <GroupCover title={group.title} />
                </View>

                {/* Group Name + Main Actions */}
                <GroupNameBar group={group} isPrivate={isPrivate} />

                {/* Group Tabs + All Actions Menu */}
                <GroupTabsBar activeTab="feed" />

                {/* Main Content - Two Column Layout */}
                <View className="max-w-6xl mx-auto w-full px-4 py-6">
                    <View className="flex flex-col lg:flex-row gap-6">
                        {/* Left Column - Main Content */}
                        <View className="flex-1 gap-6 min-w-0">
                            {/* Group Intro - Rich text content */}
                            <GroupIntro group={group} />

                            {/* App Intro - Call to Action */}
                            <AppIntro
                                onSignIn={() => console.log('Sign in')}
                                onSignUp={() => console.log('Sign up')}
                            />
                        </View>

                        {/* Right Column - Sidebar */}
                        <View className="w-full lg:w-80 shrink-0">
                            <AboutSidebar group={group} isPrivate={isPrivate} />
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View className="border-t border-border/60 py-6 px-4 mt-8">
                    <Text className="text-center text-sm text-muted-foreground">
                        © 2025 NEO Platform • This is a mock page for testing group layouts
                    </Text>
                </View>
            </ScrollView>
        </View>
    )
}
