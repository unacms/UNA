import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { getImageSizes, appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Card from 'app/ui/molecules/card'
import { memo, useMemo } from 'react';
import { AuthorData } from 'app/lib/common-helpers'

const Units = {};

Units.Base = function Base({ data, imageSizes }) {
    return (
        <Card margin="  m-1 sm:m-2 " rounded=" rounded-2xl " addClassName=" p-2  ">
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
                    <Text numberOfLines={2} className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-tight text-base  font-semibold">
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
        </Card>
    )
}

Units.Search = function Search({ data, imageSizes }) {
    return (
        <Card margin="  m-1 sm:m-2 " rounded=" rounded-2xl " addClassName=" p-2  ">
            <View className="flex-auto mt-2 flex-col p-2">
                <Link href={data.url}>
                    <Text numberOfLines={2} className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-tight text-base  font-semibold">
                       Search!! {data.title}
                    </Text>
                </Link>
                <Text numberOfLines={3} className="text-neutral-600 dark:text-neutral-400 mt-2 mb-auto text-xs ">
                    {data.summary_plain}
                </Text>
                <View className="mt-2 ">
                    <AuthorData authorData={data.author_data} />
                </View>
            </View>
        </Card>

    )
}

Units.Small = function Small({ data, imageSizes }) {
    return (
        <View className=" mx-auto pt-1 sm:p-2 w-full max-w-2xl">
            <Card addClassName=" rounded-none sm:rounded-2xl p-1 sm:p-2 flex-auto  mx-auto w-full flex-row-reverse duration-300 ">
                {data.image && (
                    <View className="aspect-square md:aspect-video flex-none rounded sm:rounded-lg overflow-hidden h-24 sm:h-36 mb-auto  ">
                        <Image
                            {...data.image}
                            alt={data.title}
                            view="cover"
                            className="u-cover"
                            sizes={imageSizes}
                        />
                    </View>
                )}

                <View className="flex-auto px-2 py-2">
                    <Link href={data.url}>
                        <Text numberOfLines={2} className="text-neutral-800  mb-1 tracking-tight leading-tight dark:text-neutral-200 sm:hover:text-primary sm:dark:hover:text-primary-d text-lg font-bold">
                            {data.title}
                        </Text>
                        <Text numberOfLines={2} className="text-neutral-600 mb-2 dark:text-neutral-400 text-xs sm:text-sm">
                            {data.summary_plain}
                        </Text>
                    </Link>
                    <View className="mt-auto">
                        <AuthorData authorData={data.author_data} />
                    </View>

                </View>
            </Card>
        </View>
    )
}

export default function BxPosts (props) {
    const imageSizes = useMemo(() => getImageSizes(), []);
    const unitTypes = appSetting('browse', 'unit_by_mode_' + props.module) || appSetting('browse', 'unit_by_mode_default');
    const Component = Units[unitTypes[props.unitType] || 'Base'];
    return <Component data={props.data} imageSizes={imageSizes} />;
}
