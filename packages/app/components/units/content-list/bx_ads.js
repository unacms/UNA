import Image from "app/ui/atoms/image";
import Link from "app/ui/atoms/link";
import { getImageSizes } from "app/lib/util";
import { Text } from "app/design/typography";
import { View } from "app/design/view";
import Profile from "app/ui/molecules/profile";
import Card from "app/ui/molecules/card";

export default function Unit(props) {
    const data = props.data;
    const imageSizes = getImageSizes();
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
            <Card
                addClassName="  "
                margin="mb-[1px] sm:mx-2 sm:mb-4"
                rounded="rounded-2xl"
            >
                <View className="flex-col h-full">
                    <View className="flex-col  h-full w-full">
                        <Link href={data.url}>
                            <View
                                className={
                                    data.image
                                        ? "flex-row-reverse sm:flex-col w-full p-3 sm:p-1 gap-x-2"
                                        : "flex-col w-full p-3  sm:p-1 "
                                }
                            >
                                <View
                                    className={
                                        (!data.image
                                            ? "hidden sm:block "
                                            : "") +
                                        " aspect-square h-full sm:aspect-video rounded-lg sm:rounded-xl overflow-hidden w-1/4  sm:w-full"
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
                                <View className="flex-auto flex-col sm:h-24 mb-auto">
                                    <View
                                        className={`flex-auto flex-col ${
                                            data.image ? "  " : " "
                                        } gap-y-2 sm:p-2`}
                                    >
                                        <Text className="mr-auto bg-primary-100 dark:bg-primary-900 rounded-lg font-semibold px-2 py-1 flex-none flex-auto text-neutral-800 dark:text-neutral-200">
                                            {data.price > 0
                                                ? data.price + "$"
                                                : "Free"}
                                        </Text>
                                        {true && (
                                            <Text
                                                numberOfLines={2}
                                                className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-tight text-base font-bold"
                                            >
                                                {data.title}
                                            </Text>
                                        )}
                                        <Text
                                            numberOfLines={true ? 2 : 6}
                                            className="text-neutral-700 dark:text-neutral-300 mb-auto text-xs"
                                        >
                                            {data.summary_plain}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Link>
                        <View className="border-t border-bdr/50 mx-2.5 dark:border-bdr-d/50 mt-auto  pt-2 pb-2.5 ">
                            {sMeta}
                        </View>
                    </View>
                </View>
            </Card>
        </>
    );
}
