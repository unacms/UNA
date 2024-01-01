import Image from "app/ui/atoms/image";
import Link from "app/ui/atoms/link";
import { getImageSizes } from "app/lib/util";
import { Text } from "app/design/typography";
import { View, Row } from "app/design/view";
import Menu from "app/components/menu";
import Card from "app/ui/molecules/card";
import Time from "app/ui/atoms/time";
import Profile from "app/ui/molecules/profile";

export default function Unit(props) {
    function forumUnitPreview() {
        let sMeta = (
            <Profile
                {...data.author_data}
                displayType="unit"
                displaySize="xs"
                showInfo="false"
            />
        );

        return (
            <>
                <Card margin="mb-2 mx-4" rounded="rounded-2xl">
                    <View className="flex-row p-1  gap-x-1.5 ">
                        <View className="flex-auto flex-col px-2 pt-1.5 pb-1 gap-y-2">
                            <Link
                                className=" my-auto  flex-auto"
                                href={data.url}
                            >
                                <Text
                                    numberOfLines={2}
                                    className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary leading-tight sm:dark:hover:text-primary-d  text-sm font-bold"
                                >
                                    {data.title}
                                </Text>
                            </Link>
                            <View className="flex-row flex-auto justify-between gap-x-4">
                                {sMeta}

                                <Text className="bg-primary/10 border border-primary/10 px-2 py-0.5 my-auto text-xs rounded-full text-primary">
                                    {data.category.name}
                                </Text>
                            </View>
                        </View>

                        {data.image && (
                            <View
                                className={
                                    (!data.image ? " hidden  " : "") +
                                    " relative flex-none h-20 w-20 bg-bgritem dark:bg-bgritem-d rounded-xl overflow-hidden "
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
                </Card>
            </>
        );
    }

    function forumUnit() {
        let sMeta = (
            <Profile
                {...data.author_data}
                displayType="unit"
                displaySize="sm"
                showInfo="false"
            />
        );

        return (
            <>
                <View className="px-4 mb-4  max-w-4xl ">
                    <View className="flex-row pb-4  gap-x-4 border-b border-bdr dark:border-bdr-d mx-auto w-full">
                        <View className="flex-col gap-y-2 hidden sm:flex w-24 flex-none">
                            <View className="border p-1 border-primary/10 relative flex-none  h-24 w-24 flex-col gap-y-1 bg-primary/10 rounded-xl overflow-hidden items-center justify-center">
                                <Text className="text-4xl">
                                    {data.category.icon}
                                </Text>
                                <Text className="text-primary-600 dark:text-primary-400 tracking-tighter text-xs">
                                    {data.category.name}
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
                                        {sMeta}
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
                                                className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-5 sm:leading-6 text-base sm:text-lg font-bold"
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
                                            " aspect-video flex-none rounded-lg sm:rounded-xl overflow-hidden w-1/4 sm:w-auto sm:h-24 "
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
                                    <Text className=" text-base rounded-full text-primary-600 dark:text-primary-400 tracking-tighter  my-auto">
                                        {data.category.icon}{" "}
                                    </Text>
                                    <Text className="text-sm rounded-full text-primary-600 dark:text-primary-400 tracking-tighter my-auto">
                                        {data.category.name}
                                    </Text>
                                </View>
                                <View className="flex-row hidden flex-auto items-center sm:flex gap-x-4 justify-end">
                                    {sMeta}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </>
        );
    }

    const data = props.data;
    const imageSizes = getImageSizes();
    return props.sidebar ? forumUnitPreview() : forumUnit();
}
