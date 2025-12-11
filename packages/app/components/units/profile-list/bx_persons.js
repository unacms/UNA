import { useCardData } from 'app/context/card'
import Link from 'app/ui/atoms/link'
import Profile from 'app/ui/molecules/profile'
import { getImageSizes } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Menu from 'app/components/menu'
import Recommendation from 'app/ui/molecules/recommendations'

export default function Unit(props) {
    const imageSizes = getImageSizes()
    let data = props.data

    const { cardData } = useCardData()

    if (!!cardData?.hidden) return

    let sMeta = <></>
    if (data?.meta?.items?.[0]?.data)
        sMeta = (
            <Recommendation
                {...{ ...data?.meta?.items?.[0]?.data, primary: false }}
                params={{
                    button_full_width: true,
                    button_variant: 'secondary',
                    button_size: 'sm',
                }}
            />
        )
    return (
        <Link href={data.url} emulate={true}>
            <View
                className=" flex-row p-2 -mx-2 rounded-xl web:active:opacity-90 web:hover:bg-muted/60 items-center "
            >
               
                <Profile
                    url_avatar={data?.image?.src}
                    displayType="unit_wo_info"
                    displaySize="sm"
                    display_name={data.title}
                />

                
                    <View className="flex-row justify-between flex-auto items-center">
                            <Text numberOfLines={2} className="text-sm  px-1.5 leading-tight font-semibold text-neutral-800 dark:text-neutral-200">
                                {data.title}
                            </Text>
                        
                            <View className="flex-none">{sMeta}</View>
                    </View>
                
            </View>
        </Link>
    )
}
