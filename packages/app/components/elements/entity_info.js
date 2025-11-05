import { View, Row } from 'app/design/view'
import { Text, H2 } from 'app/design/typography'
import Time from 'app/ui/atoms/time'
import Html from 'app/ui/atoms/html'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting } from 'app/lib/util'

export default function ElementEntityInfo({ data }) {
    const defaultIcon = appSetting('entry', 'default_info_icon');
    const inputs = Object.keys(data.inputs).map(function (key) {
        const a = data.inputs[key]
        const v = a.values ? a.values[a.value] : a.value
        if (v) {
            if (a.type) {
                let value = getValue(a);
                if (value){
                    return (
                        <View className={ (a.type!='textarea'? 'flex-row items-center ': '') +" gap-x-2"} key={a.name}>
                            <Row className="items-center ">
                                <View className="text-neutral-800 dark:text-neutral-200 h-8 w-8 p-1 overflow-hidden items-center justify-center">{getIcon(a)}</View>
                                <View className={`${defaultIcon ? "ml-2" : ''} `}>
                                    <Text className="font-bold text-base text-neutral-800 dark:text-neutral-200 ">
                                        {a.caption}
                                    </Text>
                                </View>
                            </Row>
                            <View className="flex-1">
                                {getValue(a)}
                            </View>
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

                return <Time stylesName=" text-base text-neutral-800 dark:text-neutral-200" ts={a.value}></Time>

            case 'select':
                if (a.value !=0 && a.value != ''){
                    const sel = a?.values?.find(item => item.key.toString() === a.value.toString())
                    return (
                        <Text className=" text-neutral-800 text-base dark:text-neutral-200">
                            {a.values ? (sel ? sel.value : a.values[a.value]) : a.value} {/* {a.values ? (a.values[a.value].value ? a.values[a.value].value : a.values[a.value]) : a.value}*/}
                        </Text>
                    )
                }
                return false

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
                return <Text className=" text-neutral-800 text-base dark:text-neutral-200">
                {a.value.location_string}
                </Text>

            case 'switcher':
                return <Text className=" text-neutral-800 text-base dark:text-neutral-200">
                {a.value == 1 ? 'Yes' : 'No'}
                </Text>

            default:
                if (a.name == "profile_last_active"){
                    if (isNaN(a.value)){
                        a.value = (new Date(a.value)/1000);
                    }

                    return <Time stylesName=" text-base text-neutral-800 dark:text-neutral-200" ts={a.value}></Time>
                }
                return (
                    <Text className=" text-neutral-800 text-base dark:text-neutral-200  whitespace-normal break-words">
                    {a.value}
                    </Text>
                )
        }
    }

    function getIcon(a) {
        if (a.icon){
             return <Icon icon={ a.icon.charAt(0).toUpperCase() + a.icon.slice(1)} />
        }
        switch (a.name) {
            case 'gender':
                return <Icon icon="VenusAndMars" />

            case 'birthday':
                return <Icon icon="Cake" />

            case 'fullname':
                return <Icon icon="FileBadge2" />

            default:
                return defaultIcon ? <Icon icon={defaultIcon} /> : <></>
        }
    }
}
