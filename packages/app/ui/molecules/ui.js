import { Button, Modal } from 'app/design/controls'
import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'

export default function UI(props) {
    const sizes = ['xs', 'sm', 'base', 'lg'];
    const variants = ['default', 'primary', 'secondary', 'danger', 'text', 'link', 'outline', 'tab'];

    // Конфигурации отображения кнопок
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
        <ScrollView>
            {sizes.map(size => (
                <View key={`size-${size}`} className="mb-4">
                    <Text className="text-2xl">Size: {size}</Text>
                        <View>
                        {buttonGroups.map(({ label, props: extraProps }) => (
                            <ScrollView horizontal>
                            <View key={`group-${size}-${label}`} className="mr-6">
                                <Text className=" text-base">{label}</Text>
                                <Row className="gap-x-2 mb-4">
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
                            </View>
                            </ScrollView>
                        ))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}
