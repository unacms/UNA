import { Button, Modal } from 'app/design/controls'
import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from 'app/ui/atoms/accordion'

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

    return (
        <ScrollView className="p-4">
            <Text className="text-3xl font-bold mb-4">UI Components</Text>
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

