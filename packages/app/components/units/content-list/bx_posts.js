import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { getImageSizes, appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { CardList } from 'app/ui/molecules/card'
import { useMemo } from 'react';
import { AuthorData } from 'app/lib/common-helpers'
import { cd } from 'app/lib/util'

const Units = {};

Units.Base = function Base({ data, imageSizes }) {
    return (
        <CardList padding={cd('p-sm')}>
            <View className="  aspect-video flex-none rounded-lg overflow-hidden mb-auto w-full bg-bgritem dark:bg-bgritem-d  ">
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
            <View className="flex-auto sm:h-40 mt-2 flex-col p-2">
                <Link href={data.url}>
                    <Text numberOfLines={2} className="text-neutral-950 tracking-tight dark:text-neutral-50 web:sm:hover:text-primary leading-tight text-base  font-semibold">
                        {data.title}
                    </Text>
                </Link>
                <Text numberOfLines={3} className="text-neutral-600 dark:text-neutral-400 mt-2 mb-auto text-xs ">
                    {data.summary_plain}
                </Text>
                <View className="mt-2 ">
                    <AuthorData authorData={data.author_data} />
                </View>
            </View>
        </CardList>
    )
}
Units.Search = function Search({ data, imageSizes }) {
    return (
        <CardList padding={cd('p-sm')} >
            <View className="  aspect-video flex-none rounded-lg overflow-hidden mb-auto w-full bg-bgritem dark:bg-bgritem-d  ">
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
            <View className="flex-auto sm:h-40 mt-2 flex-col p-2">
                <Link href={data.url}>
                    <Text numberOfLines={2} className="text-neutral-950 tracking-tight dark:text-neutral-50 web:sm:hover:text-primary leading-tight text-base  font-semibold">
                        {data.title}
                    </Text>
                </Link>
                <Text numberOfLines={3} className="text-neutral-600 dark:text-neutral-400 mt-2 mb-auto text-xs ">
                    {data.summary_plain}
                </Text>
                <View className="mt-2 ">
                    <AuthorData authorData={data.author_data} />
                </View>
            </View>
        </CardList>
    )
}

Units.Small = function Small({ data, imageSizes }) {
    return (
        <CardList padding={cd('p-sm')} c>
            {data.image && (
                <View className="aspect-square md:aspect-video flex-none rounded-xl  overflow-hidden h-30 sm:h-36 mb-auto  ">
                    <Image
                        {...data.image}
                        alt={data.title}
                        view="cover"
                        className="u-cover"
                        sizes={imageSizes}
                    />
                </View>
            )}

            <View className="flex-auto">
                <Link href={data.url}>
                    <Text numberOfLines={2} className="text-neutral-800  mb-1 tracking-tight leading-tight dark:text-neutral-200 web:sm:hover:text-primary text-lg font-bold">
                        {data.title}
                    </Text>
                 </Link>
                    <Text numberOfLines={2} className="text-neutral-600 mb-2 dark:text-neutral-400 text-sm">
                        {data.summary_plain}
                    </Text>
               
                <View className="mt-auto">
                    <AuthorData authorData={data.author_data} />
                </View>

            </View>
        </CardList>
    )
}

export default function BxPosts(props) {
    const imageSizes = useMemo(() => getImageSizes(), []);
    const unitTypes = appSetting('browse', 'unit_by_mode_' + props.module) || appSetting('browse', 'unit_by_mode_default');
    const Component = Units[unitTypes[props.unitType] || 'Base'];
    return <Component data={props.data} imageSizes={imageSizes} />;
}
