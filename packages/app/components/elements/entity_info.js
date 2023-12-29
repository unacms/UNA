import { View, Row } from 'app/design/view'
import { Text, H2 } from 'app/design/typography'
import Time from 'app/ui/atoms/time'
import Html from 'app/ui/atoms/html'
import { Icon } from 'app/ui/atoms/icon'

export default function ElementEntityInfo({ data }) {
    const inputs = Object.keys(data.inputs).map(function (key) {
        const a = data.inputs[key]
        const v = a.values ? a.values[a.value] : a.value
        if (v) {
            if (a.type) {
                let value = getValue(a);
                if (value){
                    return (
                        <View className="flex-row flex-wrap gap-y-2 gap-x-2" key={a.name}>
                            <Row className="items-center text-2xl">
                                <View className="text-neutral-800 dark:text-neutral-200">{getIcon(a)}</View>
                                <View className="ml-2">
                                    <Text className="font-bold text-base text-neutral-800 dark:text-neutral-200">
                                        {a.caption}:
                                    </Text>
                                </View>
                            </Row>
                            {getValue(a)}
                        </View>
                    )
                }
            } else {
                return <Text key={a.name}>Unsupporded field type: {a.type}</Text>
            }
        }
    })

    return (
            <View className='flex-col gap-y-4 '>{inputs}</View>
    )
    


    function getValue(a) {
        switch (a.type) {
            case 'datepicker':
            case 'datetime':
                if (isNaN(a.value)){
                    a.value = (new Date(a.value)/1000);
                }

                return <Time stylesName="text-base" ts={a.value}></Time>

            case 'select':
                return (
                    <Text className=" text-neutral-800 text-base dark:text-neutral-200">
                    {a.values ? (a.values[a.value].value ? a.values[a.value].value : a.values[a.value]) : a.value}
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

            case 'location':
                return false

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
