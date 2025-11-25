import { Button, Modal } from 'app/design/controls'
import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from 'app/ui/atoms/accordion'
import Tabs from 'app/ui/molecules/tabs'
import Card from './card'

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

