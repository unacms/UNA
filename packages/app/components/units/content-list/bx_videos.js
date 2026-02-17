import Image from 'app/ui/atoms/image'
import Profile from 'app/ui/molecules/profile'
import { appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { Card } from 'app/ui/molecules/card'
import LinkOrModal from 'app/ui/molecules/link-or-modal'
import { Skeleton } from 'app/ui/atoms/skeleton'

export default function defaultUnit(props) {
    const data = props.data
    const isSkeleton = data?.skeleton

    return (
        <Card padding="p-1">
            <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                <View className="aspect-video rounded-xl overflow-hidden w-full bg-accent">
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
            <View className="flex-auto p-2 gap-2">
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
                <View className="flex-row gap-2 w-full items-center">
                    <Skeleton
                        visible={isSkeleton}
                        fallback={
                            <View className="flex-row items-center gap-2 w-full">
                                <View className="h-6 w-6 rounded-full bg-muted" />
                                <View className="h-3 w-24 rounded-full bg-muted" />
                            </View>
                        }
                    >
                        <>
                            <Profile
                                {...data.author_data}
                                displayType="unit_wo_info"
                                displaySize="2xs"
                                showInfo={false}
                            />
                            <Profile
                                {...data.author_data}
                                displayType="unit_wo_image"
                                displaySize="xs"
                                showInfo="false"
                            />
                        </>
                    </Skeleton>
                </View>
            </View>
        </Card>
    )
}
