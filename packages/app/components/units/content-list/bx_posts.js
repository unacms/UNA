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
           <View className=" px-3 pb-3  w-full h-full max-w-4xl">
                    <Card addClassName=" p-2 flex-auto mx-auto w-full flex-col gap-y-4  ">
                        
                            <View className=" aspect-video flex-none rounded-lg overflow-hidden mb-auto w-full bg-bgritem dark:bg-bgritem-d  ">
                            {data.image && (
                                <Image
                                    {...data.image}
                                    alt={data.title}
                                    view="cover"
                                    className="u-cover"
                                    sizes={imageSizes}
                                />
                                )}
                            </View>
                        

                        <View className="flex-auto flex-col px-2 pb-2 gap-y-2">
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
                <View className="px-3 sm:px-5 pt-3 sm:pt-4 mx-auto w-full max-w-4xl">
                    <Card addClassName=" p-2 flex-auto  mx-auto w-full flex-col md:flex-row-reverse duration-300 ">
                        {data.image && (
                            <View className=" aspect-video flex-none mb-2 rounded-lg overflow-hidden  w-full md:w-1/3 mb-auto  ">
                                <Image
                                    {...data.image}
                                    alt={data.title}
                                    view="cover"
                                    className="u-cover"
                                    sizes={imageSizes}
                                />
                            </View>
                        )}

                        <View className="flex-auto px-2 md:mr-2">
                            <Link href={data.url}>
                                <Text
                                    numberOfLines={2}
                                    className="text-neutral-950  my-2 tracking-tight leading-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d text-lg sm:text-xl font-bold"
                                >
                                    {data.title}</Text>
                                    <Text
                                numberOfLines={2}
                                className="text-neutral-700 mb-2 dark:text-neutral-300  text-sm sm:text-base"
                            >
                                {data.summary_plain}
                                </Text>
                                
                            </Link>

                            
                            <View className="mb-2 sm:mt-auto">{sMeta}</View>
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
