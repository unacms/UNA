import { useCardData } from 'app/context/card'
import Link from 'app/ui/atoms/link'
import Profile from 'app/ui/molecules/profile'
import { getImageSizes } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Menu from 'app/components/menu'
import Recommendation from 'app/ui/molecules/recommendations';


export default function Unit(props) {
    const imageSizes = getImageSizes()
    let data = props.data

    const { cardData } = useCardData()

    if (!!cardData?.hidden) return

    let sMeta = <></>
    if (data?.meta.items[0]?.data)
        sMeta = (
           
                <Recommendation {...{...data?.meta.items[0]?.data, primary: false} } params={{button_full_width:true, button_variant:'secondary', button_size:'xs'}}/>
           
        )
    return (
        <View className="px-2">
            <Link href={data.url} emulate={true}>
                <View className=" px-2 h-12 flex-row group duration-200 rounded-xl active:opacity-50 hover:bg-bgrbutton dark:hover:bg-bgrbutton-d 
                max-w-5xl self-center w-full items-center gap-x-2 "
                >
                    <View className=" rounded-full flex-none ">
                        <Profile
                            url_avatar={data?.image?.src}
                            displayType="unit_wo_info"
                            displaySize="sm"
                            display_name={data.title}
                        />
                    </View>
                    <View className="flex-auto my-auto ">
                        <View className="flex-row justify-between">
                            <View className="justify-center flex-auto ">
                                <Text
                                    numberOfLines={2}
                                    className="text-sm mr-2 font-semibold text-neutral-900 dark:text-neutral-100"
                                >
                                    {data.title}
                                </Text>
                            </View>
                            <View className="flex-none">{sMeta}</View>
                        </View>
                    </View>
                </View>
            </Link>
        </View>
    )
}
