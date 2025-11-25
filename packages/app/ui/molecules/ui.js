import { Button, Modal } from 'app/design/controls'
import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from 'app/ui/atoms/accordion'
import { HoverCard, HoverCardTrigger, HoverCardContent } from 'app/ui/atoms/hover-card'
import ProfileHoverCard from 'app/ui/molecules/profile-hover-card'
import Profile from 'app/ui/molecules/profile'
import Tabs from 'app/ui/molecules/tabs'
import Card from './card'
import { Icon } from 'app/ui/atoms/icon'

export default function UI(props) {
    const sizes = ['xs', 'sm', 'base', 'lg'];
    const variants = ['default', 'primary', 'secondary', 'danger', 'text', 'link', 'outline', 'tab'];

    const buttonGroups = [
        { label: 'Normal', props: {} },
        { label: 'Rounded', props: { rounded: true } },
        { label: 'Pressed', props: { pressed: true } },
        { label: 'Disabled', props: { disabled: true } },
        { label: 'Solid', props: { solid: true } },
        
        { label: 'With Icon', props: { pressed: true, startDecorator: 'House' } },
        { label: 'With Icon 2', props: { pressed: true, endDecorator: 'House' } },
        { label: 'With 2 Icons', props: { pressed: true, startDecorator: 'House', endDecorator: 'House' } },
    ];

    // Sample tabs data for demonstration
    const sampleTabs = [
        {
            key: 'overview',
            title: 'Overview',
            content: (
                <View className="p-4">
                    <Text className="text-lg font-semibold mb-2">Overview Tab</Text>
                    <Text className="text-muted-foreground">This is the overview content. Tabs support animated indicators and flexible sizing.</Text>
                </View>
            )
        },
        {
            key: 'features',
            title: 'Features',
            content: (
                <View className="p-4">
                    <Text className="text-lg font-semibold mb-2">Features Tab</Text>
                    <Text className="text-muted-foreground">• Animated sliding indicator</Text>
                    <Text className="text-muted-foreground">• Multiple size variants (sm, md, lg)</Text>
                    <Text className="text-muted-foreground">• Full-width option</Text>
                    <Text className="text-muted-foreground">• Horizontal scrolling for many tabs</Text>
                </View>
            )
        },
        {
            key: 'settings',
            title: 'Settings',
            content: (
                <View className="p-4">
                    <Text className="text-lg font-semibold mb-2">Settings Tab</Text>
                    <Text className="text-muted-foreground">Configure your preferences here.</Text>
                </View>
            )
        },
    ];

    return (
        <ScrollView className="p-4">
            <Text className="text-3xl font-bold mb-4">UI Components</Text>
            
            {/* HoverCard Section */}
            <View className="mb-8">
                <Text className="text-2xl font-bold mb-4">HoverCard Component</Text>
                <Text className="text-muted-foreground mb-4">Hover (web) or tap (native) to reveal additional content.</Text>
                
                <View className="flex-row flex-wrap gap-6">
                    {/* Basic HoverCard */}
                    <View className="mb-6">
                        <Text className="text-lg font-medium mb-2 text-muted-foreground">Basic HoverCard</Text>
                        <HoverCard>
                            <HoverCardTrigger>
                                <View className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary cursor-pointer">
                                    <Icon icon="User" size={16} className="text-secondary-foreground" />
                                    <Text className="text-secondary-foreground font-medium">@username</Text>
                                </View>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                                <View className="flex-row gap-4">
                                    <View className="w-12 h-12 rounded-full bg-muted items-center justify-center">
                                        <Icon icon="User" size={24} className="text-muted-foreground" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-semibold">John Doe</Text>
                                        <Text className="text-sm text-muted-foreground">@username</Text>
                                        <Text className="text-sm mt-2">Software developer passionate about building great user experiences.</Text>
                                        <View className="flex-row gap-4 mt-2">
                                            <View className="flex-row items-center gap-1">
                                                <Icon icon="Calendar" size={12} className="text-muted-foreground" />
                                                <Text className="text-xs text-muted-foreground">Joined Dec 2021</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </HoverCardContent>
                        </HoverCard>
                    </View>

                    {/* HoverCard with Link */}
                    <View className="mb-6">
                        <Text className="text-lg font-medium mb-2 text-muted-foreground">Link Preview</Text>
                        <HoverCard>
                            <HoverCardTrigger>
                                <Text className="text-primary underline cursor-pointer">React Native Reusables</Text>
                            </HoverCardTrigger>
                            <HoverCardContent>
                                <View className="gap-2">
                                    <View className="flex-row items-center gap-2">
                                        <Icon icon="ExternalLink" size={16} className="text-muted-foreground" />
                                        <Text className="text-sm font-semibold">reactnativereusables.com</Text>
                                    </View>
                                    <Text className="text-sm text-muted-foreground">
                                        A collection of reusable components for React Native with NativeWind styling.
                                    </Text>
                                </View>
                            </HoverCardContent>
                        </HoverCard>
                    </View>

                    {/* HoverCard with Stats */}
                    <View className="mb-6">
                        <Text className="text-lg font-medium mb-2 text-muted-foreground">Stats Preview</Text>
                        <HoverCard>
                            <HoverCardTrigger>
                                <View className="px-4 py-2 rounded-md border border-border cursor-pointer">
                                    <Text className="font-medium">Project Stats</Text>
                                </View>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-72">
                                <View className="gap-3">
                                    <Text className="font-semibold">Project Overview</Text>
                                    <View className="flex-row justify-between">
                                        <View className="items-center">
                                            <Text className="text-2xl font-bold text-primary">128</Text>
                                            <Text className="text-xs text-muted-foreground">Components</Text>
                                        </View>
                                        <View className="items-center">
                                            <Text className="text-2xl font-bold text-primary">45</Text>
                                            <Text className="text-xs text-muted-foreground">Contributors</Text>
                                        </View>
                                        <View className="items-center">
                                            <Text className="text-2xl font-bold text-primary">2.5k</Text>
                                            <Text className="text-xs text-muted-foreground">Stars</Text>
                                        </View>
                                    </View>
                                </View>
                            </HoverCardContent>
                        </HoverCard>
                    </View>

                    {/* ProfileHoverCard */}
                    <View className="mb-6">
                        <Text className="text-lg font-medium mb-2 text-muted-foreground">Profile HoverCard</Text>
                        <Text className="text-sm text-muted-foreground mb-3">Used in feed items to show author details on hover. Fetches extended profile data dynamically.</Text>
                        <ProfileHoverCard 
                            profileData={{
                                id: 1,
                                display_name: 'Demo User',
                                url_avatar: null,
                                url: '/profile/1',
                                module: 'bx_persons'
                            }}
                        >
                            <View className="inline-flex">
                                <Profile
                                    id={1}
                                    display_name="Demo User"
                                    url_avatar={null}
                                    url="/profile/1"
                                    displayType="unit"
                                    displaySize="base"
                                    showLinks={false}
                                />
                            </View>
                        </ProfileHoverCard>
                    </View>
                </View>
            </View>

            {/* Tabs Section */}
            <View className="mb-8">
                <Text className="text-2xl font-bold mb-4">Tabs Component</Text>
                
                <View className="mb-6">
                    <Text className="text-lg font-medium mb-2 text-muted-foreground">Default Size (md)</Text>
                    <Card className='max-w-3xl'>
                        <Tabs tabs={sampleTabs} activeTab="overview" />
                    </Card>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-medium mb-2 text-muted-foreground">Small Size (sm)</Text>
                    <Card className='max-w-3xl'>
                        <Tabs tabs={sampleTabs} activeTab="features" size="sm" />
                    </Card>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-medium mb-2 text-muted-foreground">Large Size (lg)</Text>
                    <Card className='max-w-3xl'>
                            <Tabs tabs={sampleTabs} activeTab="settings" size="lg" />
                    </Card>
                </View>            </View>

            {/* Buttons Section */}
            <Text className="text-2xl font-bold mb-4">Button Component</Text>
            <Accordion type="multiple" collapsible defaultValue={['size-base']} className="w-full max-w-3xl">
                {sizes.map(size => (
                    <AccordionItem key={`size-${size}`} value={`size-${size}`}>
                        <AccordionTrigger>
                            <Text className="text-xl font-semibold">Size: {size}</Text>
                        </AccordionTrigger>
                        <AccordionContent>
                            <View className="pt-4">
                                {buttonGroups.map(({ label, props: extraProps }) => (
                                    <View key={`group-${size}-${label}`} className="mb-6">
                                        <Text className="text-base font-medium mb-2 text-muted-foreground">{label}</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <Row className="gap-x-3">
                                                {variants.map(variant => (
                                                    <Button
                                                        key={`btn-${size}-${label}-${variant}`}
                                                        onPress={() => console.log('1')}
                                                        size={size}
                                                        variant={variant}
                                                        title="Click me"
                                                        {...extraProps}
                                                    />
                                                ))}
                                            </Row>
                                        </ScrollView>
                                    </View>
                                ))}
                            </View>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </ScrollView>
    );
}

