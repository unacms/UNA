import { useCardData } from 'app/context/card'
import Link from 'app/ui/atoms/link'
import Profile from 'app/ui/molecules/profile'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Recommendation from 'app/ui/molecules/recommendations'

export default function Unit(props) {
    let data = props.data

    const { cardData } = useCardData()

    if (!!cardData?.hidden) return

    let sMeta = <></>
    if (data?.meta?.items?.[0]?.data){
        sMeta = (
            <Recommendation
                {...{ ...data?.meta?.items?.[0]?.data, primary: false }}
                params={{
                    button_full_width: true,
                    button_variant: 'default',
                    button_size: 'xs',
                }}
            />
        )
    }
    return (
        <Link variant='ghost' size='lg' href={data.url} emulate={true}>
            <View
                className=" flex-row gap-2 items-center web:group "
            >
                <Profile
                    url_avatar={data?.image?.src}
                    displayType="unit_wo_info"
                    displaySize="md"
                    display_name={data.title}
                />
                <View className="flex-row justify-between flex-auto items-center">
                    <Text numberOfLines={2} className="text-sm leading-tight font-semibold text-card-foreground web:group-hover:text-foreground ">
                        {data.title}
                    </Text>
                    <View className="flex-none">{sMeta}</View>
                </View>
            </View>
        </Link>
    )
}
