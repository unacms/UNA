import Image from 'app/ui/atoms/image'
import { appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { CardList } from 'app/ui/molecules/card'
import { AuthorData } from 'app/lib/common-helpers'
import LinkOrModal from 'app/ui/molecules/link-or-modal'
import { Skeleton } from 'app/ui/atoms/skeleton';
const Units = {};

Units.Base = function Base({ data }) {
    const isSkeleton = data?.skeleton;
    return (
        <CardList className="border border-border" padding="p-1">
            <View className="  aspect-video flex-none rounded-lg overflow-hidden mb-auto w-full bg-accent dark:bg-background-d  ">
                <Skeleton className="" rounded='rounded-lg' visible={isSkeleton}>
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
        </CardList>
    )
}

Units.Search = function Search({ data }) {
    const isSkeleton = data?.skeleton;
    return (
        <CardList padding="p-1">
            <View className="  aspect-video flex-none rounded-lg overflow-hidden mb-auto w-full bg-muted   ">
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
            <View className="flex-auto sm:h-40 flex-col p-2">
                <Skeleton className="h-6 w-3/4 mt-2" visible={isSkeleton}>
                    <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                        <Text numberOfLines={2} className="text-neutral-950 tracking-tight dark:text-neutral-50 web:hover:text-primary leading-tight text-base  font-semibold">
                            {data.title}
                        </Text>
                    </LinkOrModal>
                </Skeleton>
                <Skeleton className="h-16 w-full mt-2" rounded="rounded-lg" visible={isSkeleton}>
                    <Text numberOfLines={3} className="text-neutral-600 dark:text-neutral-400 mt-2 mb-auto text-xs ">
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

Units.Small = function Small({ data }) {
    const isSkeleton = data?.skeleton;
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
                            />
                        )}
                    </Skeleton>
                </View>
            )}
            <View className="flex-auto">
                <Skeleton className="h-6 w-3/4 mt-1" visible={isSkeleton}>
                    <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                        <Text numberOfLines={2} className="text-neutral-800  mb-1 tracking-tight leading-tight dark:text-neutral-200 web:hover:text-primary text-lg font-bold">
                            {data.title}
                        </Text>
                    </LinkOrModal>
                </Skeleton>
                <Skeleton className="h-12 w-full mb-2" rounded="rounded-lg" visible={isSkeleton}>
                    <Text numberOfLines={2} className="text-neutral-600 mb-2 dark:text-neutral-400 text-sm">
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
    return <Component data={props.data} />;
}
