import Image from "app/ui/atoms/image";
import Link from "app/ui/atoms/link";
import { Text } from "app/design/typography";
import { View, Row } from "app/design/view";
import Menu from "app/components/menu";
import { CardList } from 'app/ui/molecules/card'
import Time from "app/ui/atoms/time";
import { useMemo } from 'react';
import { AuthorData } from 'app/lib/common-helpers'
import { getImageSizes, appSetting } from 'app/lib/util'
import { cd } from 'app/lib/util'

const Units = {};

Units.Small = function Small({ data, imageSizes }) {
    return (
        <CardList padding={cd('p-sm')} >
            <View className="  aspect-video flex-none rounded-xl overflow-hidden mb-auto w-full bg-bgritem dark:bg-bgritem-d  ">
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
                    <Text numberOfLines={2} className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary leading-tight text-base  font-semibold">
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

Units.Base = function Base({ data, imageSizes }) {
    return (
        <>
            <View className="p-2 lg:p-4 mx-auto w-full max-w-4xl border-b border-bdr dark:border-bdr-d">
                <View className="flex-row  gap-x-4  mx-auto w-full">
                    <View className="flex-col gap-y-2 hidden sm:flex w-24 flex-none">
                        <View className="border p-1 border-primary/10 relative flex-none  h-24 w-24 flex-col gap-y-1 bg-primary/10 rounded-xl overflow-hidden items-center justify-center">
                            <Text className="text-4xl">
                                {data.category?.icon}
                            </Text>
                            <Text className="text-primary dark:text-primary tracking-tighter text-xs">
                                {data.category?.name}
                            </Text>
                        </View>
                        <Time
                            stylesName="  text-center bg-bgritem dark:bg-bgritem-d  px-2.5 py-2 mt-auto text-xs rounded-full dark:text-neutral-300 text-neutral-700"
                            ts={data.added}
                        ></Time>
                    </View>
                    <View className="flex-col gap-y-3 flex-auto ">
                        <View className="flex-row gap-x-4">
                            <View className="flex-col gap-y-2 flex-auto">
                                <View className="sm:hidden flex-row items-center justify-between w-full">
                                    <AuthorData authorData={{ ...data.author_data, displaySize: 'sm' }} />
                                    <Time
                                        stylesName=" my-auto  ml-auto bg-bgritem dark:bg-bgritem-d  px-2.5 py-1 my-auto text-sm rounded-full dark:text-neutral-300 text-neutral-700"
                                        ts={data.added}
                                    ></Time>
                                </View>
                                <Link href={data.url}>
                                    <View
                                        className={`flex-auto flex-col gap-y-2`}
                                    >
                                        <Text
                                            numberOfLines={3}
                                            className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary text-base sm:text-lg font-bold"
                                        >
                                            {data.title}
                                        </Text>
                                        <Text
                                            numberOfLines={3}
                                            className="text-neutral-700 dark:text-neutral-300 mb-auto text-sm"
                                        >
                                            {data.summary_plain}
                                        </Text>
                                    </View>
                                </Link>
                            </View>

                            {data.image && (
                                <View
                                    className={
                                        (!data.image
                                            ? " hidden sm:block "
                                            : "") +
                                        " aspect-video flex-none rounded-xl sm:rounded-xl overflow-hidden w-1/4 sm:w-auto sm:h-24 "
                                    }
                                >
                                    <Image
                                        {...data.image}
                                        alt={data.title}
                                        view="cover"
                                        className="u-cover"
                                        sizes={imageSizes}
                                    />
                                </View>
                            )}
                        </View>

                        <View className="flex-row gap-x-2 mt-auto items-center">
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
                            <View className="sm:hidden flex-row gap-x-1 my-auto  ml-auto bg-primary/10 border border-primary/10 px-2.5 py-1 my-auto  rounded-full ">
                                <Text className=" text-base rounded-full text-primary tracking-tighter  my-auto">
                                    {data.category?.icon}
                                </Text>
                                <Text className="text-sm rounded-full text-primary tracking-tighter my-auto">
                                    {data.category?.name}
                                </Text>
                            </View>
                            <View className="flex-row hidden flex-auto items-center sm:flex gap-x-4 justify-end">
                                <AuthorData authorData={{ ...data.author_data, displaySize: 'sm' }} />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </>
    );
}


export default function BxForum(props) {
    const imageSizes = useMemo(() => getImageSizes(), []);
    const unitTypes = appSetting('browse', 'unit_by_mode_' + props.module) || appSetting('browse', 'unit_by_mode_default');
    const Component = Units[unitTypes[props.unitType] || 'Base'];

    return <Component data={props.data} imageSizes={imageSizes} />;
}
