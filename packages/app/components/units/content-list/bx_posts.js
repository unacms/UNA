import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import Profile from 'app/ui/molecules/profile'
import { getImageSizes } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Card from 'app/ui/molecules/card'

export default function Unit(props) {
    function smallUnit() {
        let sMeta = (
            <Profile
                {...data.author_data}
                displayType="unit"
                displaySize="xs"
                showInfo="false"
            />
        )

        return (
            <>
           <View className=" pr-4 pb-2 w-full max-w-4xl">
                    <Card addClassName=" p-4 flex-auto  mx-auto w-full flex-col gap-y-4  ">
                        {data.image && (
                            <View className=" aspect-video flex-none rounded-lg overflow-hidden mb-auto w-full  ">
                                <Image
                                    {...data.image}
                                    alt={data.title}
                                    view="cover"
                                    className="u-cover"
                                    sizes={imageSizes}
                                />
                            </View>
                        )}

                        <View className="flex-auto flex-col gap-y-2">
                            <Link href={data.url}>
                                <Text
                                    numberOfLines={3}
                                    className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-tight text-lg  font-bold"
                                >
                                    {data.title}
                                </Text>{' '}
                            </Link>

                            <Text
                                numberOfLines={3}
                                className="text-neutral-700 dark:text-neutral-300 mb-auto text-sm "
                            >
                                {data.summary_plain}
                            </Text>
                            <View className="">{sMeta}</View>
                        </View>
                    </Card>
                </View></>  
        )
    }

    function unit() {
        let sMeta = (
            <Profile
                {...data.author_data}
                displayType="unit"
                displaySize="sm"
                showInfo="false"
            />
        )

        return (
            <>
                <View className=" px-4 mb-4 mx-auto w-full max-w-4xl">
                    <Card addClassName=" p-4 flex-auto  mx-auto w-full flex-col md:flex-row-reverse lg:gap-y-4 lg:gap-x-4 duration-300 ">
                        {data.image && (
                            <View className=" aspect-video flex-none rounded-lg overflow-hidden mb-auto w-full md:w-1/3 ">
                                <Image
                                    {...data.image}
                                    alt={data.title}
                                    view="cover"
                                    className="u-cover"
                                    sizes={imageSizes}
                                />
                            </View>
                        )}

                        <View className="flex-auto flex-col gap-y-2">
                            <Link href={data.url}>
                                <Text
                                    numberOfLines={3}
                                    className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-tight text-lg sm:text-xl font-bold"
                                >
                                    {data.title}
                                </Text>
                            </Link>

                            <Text
                                numberOfLines={3}
                                className="text-neutral-700 dark:text-neutral-300 mb-auto text-sm sm:text-base"
                            >
                                {data.summary_plain}
                            </Text>
                            <View className="">{sMeta}</View>
                        </View>
                    </Card>
                </View>
            </>
        )
    }
    const data = props.data
    const imageSizes = getImageSizes()
    const isSideBar = props.sidebar
    return props.unitType == 'small' ? smallUnit() : unit()
}
