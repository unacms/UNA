import { View, Row } from 'app/design/view'
import { Text, H2 } from 'app/design/typography'
import Time from '../../ui/atoms/time'
import Html from 'app/ui/atoms/html'
import { Icon } from 'app/ui/atoms/icon'
import Card from 'app/ui/molecules/card'

export default function ElementEntityInfo({ data }) {
    const inputs = Object.keys(data.inputs).map(function (key) {
        const a = data.inputs[key]
        const v = a.values ? a.values[a.value] : a.value
        if (v) {
            if (a.type) {
                return (
                    <View className="flex-row flex-wrap gap-y-2 gap-x-2" key={a.name}>
                        <Row className="items-center text-2xl">
                            {getIcon(a)}
                            <View className="ml-2">
                                <Text className="font-bold text-base text-neutral-800 dark:text-neutral-200">
                                    {a.caption}:
                                </Text>
                            </View>
                        </Row>
                        {getValue(a)}
                    </View>
                )
            } else {
                return <Text key={a.name}>Unsupporded field type: {a.type}</Text>
            }
        }
    })

    return (
        <Card addClassName="px-4 py-3" margn="none">
            <H2 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">Info</H2>
            <View className='flex-col gap-y-4 '>{inputs}</View>
        </Card>
    )

    function getValue(a) {
        switch (a.type) {
            case 'datetime':
                return <Time ts={a.value}></Time>

            case 'select':
                return (
                    <Text className=" text-neutral-800 text-base dark:text-neutral-200">
                    {a.values ? a.values[a.value] : a.value}
                    </Text>
                )

            case 'textarea':
                return <Html data={a.values ? a.values[a.value] : a.value} />

            case 'datepicker':
                var birthDate = new Date(a.value)
                var ageDifMs = Date.now() - birthDate.getTime()
                var ageDate = new Date(ageDifMs)
                return (
                    <Text className=" text-neutral-800 text-base dark:text-neutral-200">
                        {(Math.abs(ageDate.getUTCFullYear() - 1970)).toString()}
                    </Text>
                )

            default:
                return (
                    <Text className=" text-neutral-800 text-base dark:text-neutral-200">
                    {a.value}
                    </Text>
                )
        }
    }

    function getIcon(a) {
        switch (a.name) {
            case 'gender':
                return <Icon icon="IntersectThree" />

            case 'birthday':
                return <Icon icon="Cake" />

            case 'fullname':
                return <Icon icon="IdentificationBadge" />

            default:
                return <Icon icon="Info" />
        }
    }
}
