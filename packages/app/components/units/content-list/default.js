import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import Profile from 'app/ui/molecules/profile'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Card from 'app/ui/molecules/card'
import { Skeleton } from 'app/ui/atoms/skeleton'

export default function defaultUnit(props) {
    const data = props.data
    const isSkeleton = data?.skeleton
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
            <Card padding="p-1">
                <View className="flex-col h-full">    
                        <Link className="web:group"  href={data.url}>
                            <View
                                className={
                                    data.image
                                        ? 'flex-row-reverse sm:flex-col w-full p-3 sm:p-1 gap-x-2'
                                        : 'flex-col w-full p-3 sm:p-1 '
                                }
                            >
                                <View
                                    className={
                                        (!data.image && !isSkeleton ? 'hidden sm:block ' : '') +
                                        ' aspect-square h-full sm:aspect-video rounded-lg sm:rounded-xl overflow-hidden w-1/4  sm:w-full'
                                    }
                                >
                                    <Skeleton className="h-full w-full" rounded="rounded-lg" visible={isSkeleton}>
                                        {data.image && (
                                            <Image
                                                {...data.image}
                                                alt={data.title}
                                                view="cover"
                                                className="u-cover"
                                                sizes='auto'
                                            />
                                        )}
                                    </Skeleton>
                                </View>
                                <View className="flex-auto flex-col sm:h-24 mb-auto">
                                    <View
                                        className={`flex-auto flex-col ${data.image ? '  ' : ' '
                                            } gap-y-2 sm:p-2`}
                                    >
                                        {true && (
                                            <Skeleton className="h-6 w-3/4" visible={isSkeleton}>
                                                <Text numberOfLines={2} className="text-card-foreground tracking-tight web:hover:text-foreground web:hover:underline leading-tight font-semibold">
                                                    {data.title}
                                                </Text>
                                            </Skeleton>
                                        )}
                                        <Skeleton className="h-8 w-full" rounded="rounded-md" visible={isSkeleton}>
                                            <Text
                                                numberOfLines={true ? 2 : 6}
                                                className="text-muted  mb-auto text-xs"
                                            >
                                                {data.summary_plain}
                                            </Text>
                                        </Skeleton>
                                    </View>
                                </View>
                            </View>
                        
                        <View className="border-t border-border/60 mx-2.5 /50 mt-auto  pt-2 pb-2.5 ">
                            <Skeleton preset="author" visible={isSkeleton}>
                                {sMeta}
                            </Skeleton>
                        </View>
                        </Link>
                    </View>
              
            </Card>
        </>
    )
}