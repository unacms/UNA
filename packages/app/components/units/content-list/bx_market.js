import Image from "app/ui/atoms/image";
import Link from "app/ui/atoms/link";
import { getImageSizes } from "app/lib/util";
import { Text } from "app/design/typography";
import { View, Row } from "app/design/view";
import Card from "app/ui/molecules/card";
import Profile from 'app/ui/molecules/profile';
import Stars from 'app/ui/molecules/stars';
import { useState } from 'react';

export default function Unit(props) {
    const data = props.data;
    const [rating, setRating] = useState(0);
    const imageSizes = getImageSizes();
    let sMeta = (
        <Profile
            {...data.author_data}
            displayType="unit"
            displaySize="sm"
            showInfo="false"
        />
    );
    
    let cover_raw = data.cover_raw.replace(
        /\\u([\d\w]{4})/gi,
        function (match, grp) {
            return String.fromCharCode(parseInt(grp, 16));
        },
    );

    let sRate = undefined;
    if(data.meta?.items)
        data.meta.items.forEach((aItem) => {
            if(aItem.name != 'votes' || aItem.data.type != 'stars')
                return;

            aItem.data.params = {...aItem.data.params, show_counter: false};

            sRate = (
                <Stars {...aItem.data} />
            );
        });

    return (
        <>
            <Card margin="mb-px sm:mx-2 sm:mb-4" rounded="rounded-2xl">
                <View className="flex-col gap-y-4">
                    <View className="flex-col w-full">
                        <Link href={data.url}>
                            <View className="w-full p-1">
                                <View className="w-full mb-auto bg-bgritem dark:bg-bgritem-d aspect-video overflow-hidden rounded-xl">
                                    {cover_raw.trim() != "" && (
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: cover_raw,
                                            }}
                                        ></div>
                                    )}
                                    {cover_raw.trim() == "" && (
                                        <Image
                                            {...data.cover}
                                            alt={data.title}
                                            view="cover"
                                            className="u-cover"
                                            sizes={imageSizes}
                                        />
                                    )}
                                </View>
                                <View className="flex-auto flex-col px-2 py-3 gap-y-2 h-32 ">
                                    <Row className="justify-between">
                                        <View className="flex-col gap-y-3">
                                            <Text className="mr-auto bg-primary-100 dark:bg-primary-900 rounded-lg font-semibold px-2 py-1 flex-none flex-auto text-neutral-800 dark:text-neutral-200">
                                                {data.price_recurring > 0
                                                    ? data.price_recurring +
                                                      "$/" +
                                                      data.duration_recurring
                                                    : data.price_single > 0
                                                      ? data.price_single + "$"
                                                      : "Free"}
                                            </Text>
                                            <Text
                                                numberOfLines={2}
                                                className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-5 text-base font-bold"
                                            >
                                                {data.title}
                                            </Text>
                                        </View>
                                        {data.image && (
                                            <View className="h-14 w-14 aspect-square overflow-hidden border border-bdr dark:border-bdr-d rounded-lg">
                                                <Image
                                                    {...data.image}
                                                    alt={data.title}
                                                    view="cover"
                                                    nobg={true}
                                                    sizes={imageSizes}
                                                />
                                            </View>
                                        )}
                                    </Row>
                                    {sRate}
                                    <Text
                                        numberOfLines={1}
                                        className="text-neutral-700 dark:text-neutral-300 mb-auto text-sm"
                                    >
                                        {data.summary_plain}
                                    </Text>
                                </View>
                            </View>
                        </Link>
                        
                        <View className=" mb-auto px-4 pb-3 sm:pt-0">
                            {sMeta}
                        </View>
                       
                    </View>
                </View>
            </Card>
        </>
    );
}
