import Image from 'app/ui/atoms/image'
import { appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { Card, CardList } from 'app/ui/molecules/card'
import { AuthorData } from 'app/lib/common-helpers'
import LinkOrModal from 'app/ui/molecules/link-or-modal'

const Units = {};

function UnitWrapper({ children }) {
    return (
         <CardList padding="p-1">
            {children ? children : (
                <>
                    <View className="relative  bg-muted aspect-video rounded-xl w-full"></View>
                    <View className=" p-1.5 flex-auto justify-between gap-1.5">
                        <View className=" h-5 w-3/4 bg-muted rounded-full"></View>
                        <View className=" h-5 w-1/2 bg-muted rounded-full"></View>
                    </View>
                </>
            )}
        </CardList>
    )
}

Units.Base = function Base({ data }) {
    return (
        <UnitWrapper padding="p-1">
            <View className="  aspect-video flex-none rounded-lg overflow-hidden mb-auto w-full bg-bgritem dark:bg-bgritem-d  ">
                {data.image && (
                    <Image
                        {...data.image}
                        alt={data.title}
                        view="cover"
                        className="u-cover"
                        sizes='auto'
                    />
                )}
            </View>
            <View className="flex-auto sm:h-40 mt-2 flex-col p-2">
                <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                    <Text numberOfLines={2} className="text-card-foreground tracking-tight web:hover:text-foreground web:hover:underline leading-tight font-semibold">
                        {data.title}
                    </Text>
                </LinkOrModal>
                <Text numberOfLines={3} className="text-neutral-600 dark:text-neutral-400 mt-2 mb-auto text-xs ">
                    {data.summary_plain}
                </Text>
                <View className="mt-2 ">
                    <AuthorData authorData={data.author_data} />
                </View>
            </View>
        </UnitWrapper>
    )
}
Units.Search = function Search({ data }) {
    return (
        <UnitWrapper padding="p-1" >
            <View className="  aspect-video flex-none rounded-lg overflow-hidden mb-auto w-full bg-bgritem dark:bg-bgritem-d  ">
                {data.image && (
                    <Image
                        {...data.image}
                        alt={data.title}
                        view="cover"
                        className="u-cover"
                        sizes='auto'
                    />
                )}
            </View>
            <View className="flex-auto sm:h-40 mt-2 flex-col p-2">
                <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                    <Text numberOfLines={2} className="text-neutral-950 tracking-tight dark:text-neutral-50 web:hover:text-primary leading-tight text-base  font-semibold">
                        {data.title}
                    </Text>
                </LinkOrModal>
                <Text numberOfLines={3} className="text-neutral-600 dark:text-neutral-400 mt-2 mb-auto text-xs ">
                    {data.summary_plain}
                </Text>
                <View className="mt-2 ">
                    <AuthorData authorData={data.author_data} />
                </View>
            </View>
        </UnitWrapper>
    )
}

Units.Small = function Small({ data }) {
    return (
        <UnitWrapper className="mb-0.5 sm:mb-3">
            {data.image && (
                <View className="aspect-square md:aspect-video flex-none rounded-xl  overflow-hidden h-30 sm:h-36 mb-auto  ">
                    <Image
                        {...data.image}
                        alt={data.title}
                        view="cover"
                        className="u-cover"
                        sizes='auto'
                    />
                </View>
            )}

            <View className="flex-auto">
                <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                    <Text numberOfLines={2} className="text-neutral-800  mb-1 tracking-tight leading-tight dark:text-neutral-200 web:hover:text-primary text-lg font-bold">
                        {data.title}
                    </Text>
                </LinkOrModal>
                <Text numberOfLines={2} className="text-neutral-600 mb-2 dark:text-neutral-400 text-sm">
                    {data.summary_plain}
                </Text>
                <View className="mt-auto">
                    <AuthorData authorData={data.author_data} />
                </View>
            </View>
        </UnitWrapper>
    )
}

export default function BxPosts(props) {
    const unitTypes = appSetting('browse', 'unit_by_mode_' + props.module) || appSetting('browse', 'unit_by_mode_default');

    if (props.data?.skeleton){
        return <UnitWrapper/>
    }

    const Component = Units[unitTypes[props.unitType] || 'Base'];
    return <Component data={props.data} />;
}
