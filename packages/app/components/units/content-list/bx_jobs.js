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
      //  console.log("datadata", data)
    return (
        <View className=" p-1.5 sm:p-2 mx-auto w-full ">
        <Card addClassName=" p-2 flex-auto  mx-auto w-full flex-row-reverse ">
            {data?.cover?.src && (
                <View className="aspect-square md:aspect-video flex-none rounded-lg overflow-hidden h-24 sm:h-36 mb-auto  ">
                    <Image
                        {...data.cover}
                        alt={data.title}
                        view="cover"
                        className="u-cover"
                        sizes={imageSizes}
                    />
                </View>
            )}

            <View className="flex-auto px-2 py-2 h-36">
                <Link href={data.url}>
                    <Text numberOfLines={2} className="text-neutral-800  mb-2 tracking-tight leading-tight dark:text-neutral-200 sm:hover:text-primary sm:dark:hover:text-primary-d text-base font-bold">
                        {data.title}
                    </Text>
                    <Text numberOfLines={2} className="text-neutral-600 mb-2 dark:text-neutral-400 text-xs sm:text-sm">
                        {data.description}
                    </Text>
                </Link>
                <View className="mt-auto">
                {data.pay_hourly > 0 && <Text className="font-semibold text-lg">Hourly: {data.pay_hourly}$</Text>}
                {data.pay_total > 0 && <Text className="font-semibold text-lg">Total: {data.pay_total}$</Text>}

                </View>

            </View>
        </Card>
    </View>
    );
}
