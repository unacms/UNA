import Image from 'app/ui/atoms/image'
import Profile from 'app/ui/molecules/profile'
import { appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { Card } from 'app/ui/molecules/card'
import LinkOrModal from 'app/ui/molecules/link-or-modal'
import { Skeleton } from 'app/ui/atoms/skeleton'
import Time from 'app/ui/atoms/time'

export default function defaultUnit(props) {
    const data = props.data
    const isSkeleton = data?.skeleton
    const postedTs = data?.date || data?.added || data?.created

    return (
        <Card padding="p-1">
            <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                <View className="aspect-video rounded-lg overflow-hidden w-full bg-accent">
                    <Skeleton className="h-full w-full" rounded="rounded-xl" visible={isSkeleton}>
                        <Image
                            {...data.image}
                            alt={data.title}
                            view="cover"
                            className="u-cover"
                            sizes='auto'
                        />
                    </Skeleton>
                </View>
            </LinkOrModal>
            <View className="flex-auto p-2">
                <View className="flex-row items-start gap-3">
                    <Skeleton
                        visible={isSkeleton}
                        fallback={<View className="h-12 w-12 rounded-full bg-muted" />}
                    >
                        <Profile
                            {...data.author_data}
                            displayType="unit_wo_info"
                            displaySize="base"
                            showInfo={false}
                        />
                    </Skeleton>
                    <View className="flex-1 gap-1 h-16">
                        <Skeleton className="h-6 w-3/4" visible={isSkeleton}>
                            <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                                <Text
                                    numberOfLines={2}
                                    className="text-card-foreground web:hover:text-accent-foreground leading-tight text-base font-semibold"
                                >
                                    {data.title}
                                </Text>
                            </LinkOrModal>
                        </Skeleton>
                        <Skeleton className="h-4 w-28" visible={isSkeleton}>
                            <Profile
                                {...data.author_data}
                                displayType="unit_text_link"
                                displaySize="sm"
                            />
                        </Skeleton>
                        {postedTs && (
                            <Skeleton className="h-3 w-20" visible={isSkeleton}>
                                <Time
                                    stylesName="text-xs text-muted-foreground"
                                    ts={postedTs}
                                />
                            </Skeleton>
                        )}
                    </View>
                </View>
            </View>
        </Card>
    )
}
