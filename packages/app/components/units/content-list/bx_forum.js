import Image from "app/ui/atoms/image";
import { Text } from "app/design/typography";
import { View } from "app/design/view";
import Menu from "app/components/menu";
import { Card, CardList } from 'app/ui/molecules/card'
import Time from "app/ui/atoms/time";
import { AuthorData } from 'app/lib/common-helpers'
import { appSetting } from 'app/lib/util'
import LinkOrModal from 'app/ui/molecules/link-or-modal'
import { Skeleton } from 'app/ui/atoms/skeleton'

const Units = {};

Units.Search = function Search({ data }) {
    const isSkeleton = data?.skeleton
    return (
        <Card padding="p-1">
            <View className="  aspect-video flex-none rounded-xl overflow-hidden mb-auto w-full bg-muted   ">
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
            <View className="flex-auto sm:h-40 flex-col p-2">
                <Skeleton className="h-6 w-3/4 mt-2" visible={isSkeleton}>
                    <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                        <Text numberOfLines={2} className="text-label-primary tracking-tight  web:hover:text-primary leading-tight text-base  font-semibold">
                            {data.title}
                        </Text>
                    </LinkOrModal>
                </Skeleton>
                <Skeleton className="h-16 w-full mt-2" rounded="rounded-lg" visible={isSkeleton}>
                    <Text numberOfLines={3} className="text-label-tertiary  mt-2 mb-auto text-xs ">
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

Units.Small = function Small({ data }) {
    const isSkeleton = data?.skeleton
    return (
        <CardList padding='p-2' >
            <View className="  aspect-video flex-none rounded-xl overflow-hidden mb-auto w-full bg-muted   ">
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
            <View className="flex-auto sm:h-40 flex-col p-2">
                <Skeleton className="h-6 w-3/4 mt-2" visible={isSkeleton}>
                    <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                        <Text numberOfLines={2} className="text-label-primary tracking-tight  web:hover:text-primary leading-tight text-base  font-semibold">
                            {data.title}
                        </Text>
                    </LinkOrModal>
                </Skeleton>
                <Skeleton className="h-16 w-full mt-2" rounded="rounded-lg" visible={isSkeleton}>
                    <Text numberOfLines={3} className="text-label-tertiary  mt-2 mb-auto text-xs ">
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

Units.Base = function Base({ data }) {
    const isSkeleton = data?.skeleton
    return (
        <>
            <View className="p-2 lg:p-4 mx-auto w-full max-w-4xl border-b border-border ">
                <View className="flex-row  gap-x-4  mx-auto w-full">
                    <View className="flex-col gap-y-2 hidden sm:flex w-24 flex-none">
                        <Skeleton className="h-24 w-24" rounded="rounded-xl" visible={isSkeleton}>
                            <View className="border p-1 border-primary/10 relative flex-none  h-24 w-24 flex-col gap-y-1 bg-primary/10 rounded-xl overflow-hidden items-center justify-center">
                                <Text className="text-4xl">
                                    {data.category?.icon}
                                </Text>
                                <Text className="text-primary tracking-tighter text-xs">
                                    {data.category?.name}
                                </Text>
                            </View>
                        </Skeleton>
                        <Skeleton className="h-8 w-16 mt-auto" visible={isSkeleton}>
                            <Time
                                stylesName="  text-center bg-muted   px-2.5 py-2 mt-auto text-xs rounded-full  text-muted"
                                ts={data.added}
                            ></Time>
                        </Skeleton>
                    </View>
                    <View className="flex-col gap-y-3 flex-auto ">
                        <View className="flex-row gap-x-4">
                            <View className="flex-col gap-y-2 flex-auto">
                                <View className="sm:hidden flex-row items-center justify-between w-full">
                                    <Skeleton className="h-6 w-32" visible={isSkeleton}>
                                        <AuthorData authorData={{ ...data.author_data, displaySize: 'sm' }} />
                                    </Skeleton>
                                    <Skeleton className="h-8 w-16 ml-auto" visible={isSkeleton}>
                                        <Time
                                            stylesName=" my-auto  ml-auto bg-muted   px-2.5 py-1 my-auto text-sm rounded-full  text-muted"
                                            ts={data.added}
                                        ></Time>
                                    </Skeleton>
                                </View>
                                <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                                    <View
                                        className={`flex-auto flex-col gap-y-2`}
                                    >
                                        <Skeleton className="h-6 w-3/4 mt-2" visible={isSkeleton}>
                                            <Text
                                                numberOfLines={3}
                                                className="text-label-primary tracking-tight  web:hover:text-primary text-base sm:text-lg font-bold"
                                            >
                                                {data.title}
                                            </Text>
                                        </Skeleton>
                                        <Skeleton className="h-16 w-full" rounded="rounded-lg" visible={isSkeleton}>
                                            <Text
                                                numberOfLines={3}
                                                className="text-muted  mb-auto text-sm"
                                            >
                                                {data.summary_plain}
                                            </Text>
                                        </Skeleton>
                                    </View>
                                </LinkOrModal>
                            </View>

                            {(data.image || isSkeleton) && (
                                <View
                                    className={
                                        (!data.image
                                            ? " hidden sm:block "
                                            : "") +
                                        " aspect-video flex-none rounded-xl sm:rounded-xl overflow-hidden w-1/4 sm:w-auto sm:h-24 "
                                    }
                                >
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
                        </View>

                        <View className="flex-row gap-x-2 mt-auto items-center">
                            <Skeleton className="h-9 w-40" rounded="rounded-lg" visible={isSkeleton}>
                                <Menu
                                    {...data.meta}
                                    displayType="button"
                                    displaySize
                                    params={{
                                        show_action: true,
                                        show_counter: true,
                                        show_combined: true,
                                    }}
                                />
                            </Skeleton>
                            <Skeleton className="h-8 w-20 ml-auto sm:hidden" rounded="rounded-full" visible={isSkeleton}>
                                <View className="sm:hidden flex-row gap-x-1 my-auto  ml-auto bg-primary/10 border border-primary/10 px-2.5 py-1 my-auto  rounded-full ">
                                    <Text className=" text-base rounded-full text-primary tracking-tighter  my-auto">
                                        {data.category?.icon}
                                    </Text>
                                    <Text className="text-sm rounded-full text-primary tracking-tighter my-auto">
                                        {data.category?.name}
                                    </Text>
                                </View>
                            </Skeleton>
                            <View className="flex-row hidden flex-auto items-center sm:flex gap-x-4 justify-end">
                                <Skeleton className="h-6 w-24" visible={isSkeleton}>
                                    <AuthorData authorData={{ ...data.author_data, displaySize: 'sm' }} />
                                </Skeleton>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </>
    );
}

export default function BxForum(props) {
    const unitTypes = appSetting('browse', 'unit_by_mode_' + props.module) || appSetting('browse', 'unit_by_mode_default');
    const Component = props.mode == 'search' ? Units.Search : Units[unitTypes[props.unitType] || 'Base'];

    return <Component data={props.data} />;
}
