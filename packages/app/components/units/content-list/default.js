import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import Profile from 'app/ui/molecules/profile'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Card from 'app/ui/molecules/card'

export default function defaultUnit(props) {
    const data = props.data;
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
            <Card
                addClassName="  "
                margin=" m-1 sm:m-2 sm:mt-0"
                rounded="rounded-2xl"
            >
                <View className="flex-col h-full">
                    <View className="flex-col  h-full w-full">
                        <Link href={data.url}>
                            <View
                                className={
                                    data.image
                                        ? 'flex-row-reverse sm:flex-col w-full p-3 sm:p-1 gap-x-2'
                                        : 'flex-col w-full p-3  sm:p-1 '
                                }
                            >
                                <View
                                    className={
                                        (!data.image ? 'hidden sm:block ' : '') +
                                        ' aspect-square h-full sm:aspect-video rounded-lg sm:rounded-xl overflow-hidden w-1/4  sm:w-full'
                                    }
                                >
                                    <Image
                                        {...data.image}
                                        alt={data.title}
                                        view="cover"
                                        className="u-cover"
                                        sizes='auto'
                                    />
                                </View>
                                <View className="flex-auto flex-col sm:h-24 mb-auto">
                                    <View
                                        className={`flex-auto flex-col ${data.image ? '  ' : ' '
                                            } gap-y-2 sm:p-2`}
                                    >
                                        {true && (
                                         <Text numberOfLines={2} className="text-card-foreground tracking-tight web:hover:text-foreground web:hover:underline leading-tight font-semibold">
                                                {data.title}
                                         </Text>
                                        )}
                                        <Text
                                            numberOfLines={true ? 2 : 6}
                                            className="text-neutral-700 dark:text-neutral-300 mb-auto text-xs"
                                        >
                                            {data.summary_plain}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Link>
                        <View className="border-t border-bdr/50 mx-2.5 dark:border-bdr-d/50 mt-auto  pt-2 pb-2.5 ">
                            {sMeta}
                        </View>
                    </View>
                </View>
            </Card>
        </>
    )
}