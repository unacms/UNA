import Image from "app/ui/atoms/image";
import { Text } from "app/design/typography";
import { View } from "app/design/view";
import Menu from "app/components/menu";
import { Card, CardList } from 'app/ui/molecules/page/card'
import Time from "app/ui/atoms/time";
import { AuthorData } from 'app/lib/common-helpers'
import Profile from 'app/ui/molecules/profile/profile'
import { appSetting } from 'app/lib/util'
import LinkOrModal from 'app/ui/molecules/dialogs/link-or-modal'
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

Units.Base = function Base({ data }) {
    const isSkeleton = data?.skeleton
    const categoryName = data.category?.name
    const categoryIcon = data.category?.icon
    const showInModal = appSetting('browse', 'show_in_modal', data.module)

    return (
        <View className=" mx-auto w-full">
            <CardList className="flex-row gap-x-3 px-4">
                {/* Compact category glyph — name lives in the meta row. */}
                <View className="flex-none pt-0.5">
                    <Skeleton className="h-10 w-10" rounded="rounded-lg" visible={isSkeleton}>
                        <View className="h-10 w-10 border border-primary/10 bg-primary/10 rounded-lg items-center justify-center overflow-hidden">
                            <Text className="text-xl leading-none">
                                {categoryIcon}
                            </Text>
                        </View>
                    </Skeleton>
                </View>

                <View className="gap-y-2 flex-auto min-w-0">
                    <View className="flex-row gap-x-3">
                        <View className="gap-y-1.5 flex-auto min-w-0">
                            <LinkOrModal href={data.url} showInModal={showInModal}>
                                <Skeleton className="h-5 w-3/4" visible={isSkeleton}>
                                    <Text
                                        numberOfLines={2}
                                        className="text-foreground tracking-tight leading-snug web:hover:text-primary text-base font-bold"
                                    >
                                        {data.title}
                                    </Text>
                                </Skeleton>
                            </LinkOrModal>

                            {/* Meta row stays outside the discussion link: the author is its own
                                link, and an <a> cannot be nested inside another <a>. */}
                            <View className="flex-row items-center gap-x-1.5 min-w-0">
                                {/* unit_wo_info + name avoid Profile `unit` flex-1 so "in category" stays adjacent. */}
                                <Skeleton className="h-6 w-40" visible={isSkeleton}>
                                    <View className="flex-row items-center gap-x-1.5 min-w-0">
                                        {/* `showLink` (singular) turns off Profile's emulated-press mode
                                            so the avatar and name render as real links, not role="button". */}
                                        <Profile
                                            {...data.author_data}
                                            displayType="unit_wo_info"
                                            displaySize="xs"
                                            showLink
                                        />
                                        <View className="flex-row items-center gap-x-1 min-w-0">
                                            <Profile
                                                {...data.author_data}
                                                displayType="unit_text_link"
                                                displaySize="xs"
                                                showLink
                                            />
                                            {categoryName ? (
                                                <>
                                                    <Text className="text-xs text-muted-foreground">
                                                        in
                                                    </Text>
                                                    <Text
                                                        numberOfLines={1}
                                                        className="text-xs font-semibold text-foreground"
                                                    >
                                                        {categoryName}
                                                    </Text>
                                                </>
                                            ) : null}
                                        </View>
                                    </View>
                                </Skeleton>
                                <Text className="text-xs text-muted-foreground flex-none">
                                    ·
                                </Text>
                                <Skeleton className="h-5 w-10 flex-none" visible={isSkeleton}>
                                    <Time
                                        stylesName="text-xs text-muted-foreground"
                                        ts={data.added}
                                    />
                                </Skeleton>
                            </View>

                            {(data.summary_plain || isSkeleton) ? (
                                <LinkOrModal href={data.url} showInModal={showInModal}>
                                    <Skeleton className="h-9 w-full" rounded="rounded-lg" visible={isSkeleton}>
                                        <Text
                                            numberOfLines={2}
                                            className="text-muted-foreground text-sm leading-snug"
                                        >
                                            {data.summary_plain}
                                        </Text>
                                    </Skeleton>
                                </LinkOrModal>
                            ) : null}
                        </View>

                        {(data.image || isSkeleton) && (
                            <View
                                className={
                                    (!data.image ? 'hidden sm:block ' : '')
                                    + 'aspect-video flex-none rounded-xl overflow-hidden w-1/4 sm:w-auto sm:h-20'
                                }
                            >
                                <Skeleton className="h-full w-full" rounded="rounded-xl" visible={isSkeleton}>
                                    {data.image ? (
                                        <Image
                                            {...data.image}
                                            alt={data.title}
                                            view="cover"
                                            className="u-cover"
                                            sizes="auto"
                                        />
                                    ) : null}
                                </Skeleton>
                            </View>
                        )}
                    </View>

                    <View className="flex-row justify-between gap-x-2 mt-auto items-center">
                        
                        <Skeleton className="h-8 w-12 flex-none" rounded="rounded-lg" visible={isSkeleton}>
                            <Menu
                                {...data.meta}
                                displayType="button"
                                displaySize
                                params={{
                                    show_action: true,
                                    show_counter: true,
                                    show_combined: true,
                                    button_style: 'borderless',
                                    button_size: 'small',
                                }}
                            />
                        </Skeleton>
                    </View>
                </View>
            
            </CardList>
        </View>
    )
}

export default function BxForum(props) {
    const unitTypes = appSetting('browse', 'unit_by_mode_' + props.module) || appSetting('browse', 'unit_by_mode_default');
    const Component = props.mode == 'search' ? Units.Search : Units[unitTypes[props.unitType] || 'Base'];

    return <Component data={props.data} />;
}
