import Image from 'app/ui/atoms/image'
import { appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { CardList, Card } from 'app/ui/molecules/card'
import { AuthorData } from 'app/lib/common-helpers'
import LinkOrModal from 'app/ui/molecules/link-or-modal'
import { Skeleton } from 'app/ui/atoms/skeleton';
const Units = {};

Units.Base = function Base({ data, listIndex }) {
    const isSkeleton = data?.skeleton;
    const isLcpCandidate = listIndex === 0;
    return (
        <Card padding="p-1">
            <View className="  aspect-video flex-none rounded-xl overflow-hidden mb-auto w-full bg-accent">
                <Skeleton className="" rounded='rounded-lg' visible={isSkeleton}>
                    {data.image && (
                        <Image
                            {...data.image}
                            alt={data.title}
                            view="cover"
                            className="u-cover"
                            sizes='auto'
                            optimizedWidthCap={640}
                            priority={isLcpCandidate}
                        />
                    )}
                </Skeleton>
            </View>
            <View className="flex-auto sm:h-40 flex-col p-2">
                <Skeleton className="h-6 w-3/4 mt-2" visible={isSkeleton}>
                    <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                        <Text numberOfLines={2} className="text-card-foreground tracking-tight web:hover:text-foreground web:hover:underline leading-tight font-semibold">
                            {data.title}
                        </Text>
                    </LinkOrModal>
                </Skeleton>
                <Skeleton className="h-16 w-full mt-2" rounded="rounded-lg" visible={isSkeleton}>
                    <Text numberOfLines={3} className="text-secondary-foreground mt-2 mb-auto text-sm ">
                        {data.summary_plain}
                    </Text>
                </Skeleton>
                <View className="mt-2 ">
                    <Skeleton preset="author" visible={isSkeleton}>
                        <AuthorData authorData={data.author_data} />
                    </Skeleton>
                </View>
            </View>
        </Card>
    )
}

Units.Search = function Search({ data, listIndex }) {
    const isSkeleton = data?.skeleton;
    const isLcpCandidate = listIndex === 0;
    return (
        <CardList padding="p-1">
            <View className="  aspect-video flex-none rounded-xl overflow-hidden mb-auto w-full bg-muted   ">
                <Skeleton className="h-full w-full" rounded="rounded-lg" visible={isSkeleton}>
                    {data.image && (
                        <Image
                            {...data.image}
                            alt={data.title}
                            view="cover"
                            className="u-cover"
                            sizes='auto'
                            optimizedWidthCap={640}
                            priority={isLcpCandidate}
                        />
                    )}
                </Skeleton>
            </View>
            <View className="flex-auto sm:h-40 flex-col p-2">
                <Skeleton className="h-6 w-3/4 mt-2" visible={isSkeleton}>
                    <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                        <Text numberOfLines={2} className="text-foreground tracking-tight  web:hover:text-primary leading-tight text-base  font-semibold">
                            {data.title}
                        </Text>
                    </LinkOrModal>
                </Skeleton>
                <Skeleton className="h-16 w-full mt-2" rounded="rounded-lg" visible={isSkeleton}>
                    <Text numberOfLines={3} className="text-muted-foreground  mt-2 mb-auto text-xs ">
                        {data.summary_plain}
                    </Text>
                </Skeleton>
                <View className="mt-2 ">
                    <Skeleton preset="author" visible={isSkeleton}>
                        <AuthorData authorData={data.author_data} />
                    </Skeleton>
                </View>
            </View>
        </CardList>
    )
}

Units.Small = function Small({ data, listIndex }) {
    const isSkeleton = data?.skeleton;
    const isLcpCandidate = listIndex === 0;
    return (
        <CardList padding="p-1">
            {(data.image || isSkeleton) && (
                <View className="aspect-square md:aspect-video flex-none rounded-xl  overflow-hidden h-30 sm:h-36 mb-auto  ">
                    <Skeleton className="h-full w-full" rounded="rounded-xl" visible={isSkeleton}>
                        {data.image && (
                            <Image
                                {...data.image}
                                alt={data.title}
                                view="cover"
                                className="u-cover"
                                sizes='auto'
                                optimizedWidthCap={640}
                                priority={isLcpCandidate}
                            />
                        )}
                    </Skeleton>
                </View>
            )}
            <View className="flex-auto">
                <Skeleton className="h-6 w-3/4 mt-1" visible={isSkeleton}>
                    <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                        <Text numberOfLines={2} className="text-secondary-foreground  mb-1 tracking-tight leading-tight  web:hover:text-primary text-lg font-bold">
                            {data.title}
                        </Text>
                    </LinkOrModal>
                </Skeleton>
                <Skeleton className="h-12 w-full mb-2" rounded="rounded-lg" visible={isSkeleton}>
                    <Text numberOfLines={2} className="text-muted-foreground mb-2  text-sm">
                        {data.summary_plain}
                    </Text>
                </Skeleton>
                <View className="mt-auto">
                    <Skeleton preset="author" visible={isSkeleton}>
                        <AuthorData authorData={data.author_data} />
                    </Skeleton>
                </View>
            </View>
        </CardList>
    )
}

export default function BxPosts(props) {
    const unitTypes = appSetting('browse', 'unit_by_mode_' + props.module) || appSetting('browse', 'unit_by_mode_default');
    const Component = Units[unitTypes[props.unitType] || 'Base'];
    return <Component data={props.data} listIndex={props.listIndex} />;
}
