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
            <View className="text-center flex-col  h-auto justify-end">
                <Recommendation {...{...data?.meta.items[0]?.data, primary: false} } params={{button_full_width:true, button_variant:'outline', size:'xs'}}/>
            </View>
        )
    return (
        <View className="">
            <Link href={data.url} emulate={true}>
                <View
                    className=" px-2 py-1.5 flex-row  
                group duration-200 rounded-lg  
                active:opacity-50 active:translate-y-1 
                hover:bg-bgrbutton dark:hover:bg-bgrbutton-d hover:shadow-sm
                max-w-5xl  hover:ring-1 hover:ring-inset hover:ring-neutral-500/10 self-center w-full  "
                >
                    <View className=" mr-2 rounded-full flex-none ">
                        <Profile
                            url_avatar={data?.image?.src}
                            displayType="unit_wo_info"
                            displaySize="base"
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
