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
        <View className=" p-4 mx-auto w-full ">
        <Card addClassName=" p-4 flex-auto mx-auto w-full flex-row">
            

            <View className="flex-auto">
                <Link href={data.url}>
                    <Text numberOfLines={2} className="text-neutral-800 mb-1 dark:text-neutral-200 sm:hover:text-primary text:lg sm:text-xl font-semibold ">
                        {data.title}
                    </Text>
                    <Text numberOfLines={2} className="text-neutral-600 mb-4 dark:text-neutral-400 text-xs sm:text-sm">
                        {data.description}
                    </Text>
                </Link>
                <View className="mt-auto flex-row gap-x-1.5">
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm border border-neutral-200 dark:border-neutral-800 rounded-full px-2 py-1">Author</Text>

                {data.pay_hourly > 0 && <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-green-200 dark:bg-green-800 rounded-full px-2 py-1">Hourly: {data.pay_hourly}$</Text>}
                {data.pay_total > 0 && <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-blue-200 dark:bg-blue-800 rounded-full px-2 py-1">Total: {data.pay_total}$</Text>}

                </View>
                <View className="mt-4 flex-row flex-wrap gap-x-2 gap-y-1">
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-neutral-200 dark:bg-neutral-800 rounded px-2 py-1">tag</Text>
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-neutral-200 dark:bg-neutral-800 rounded px-2 py-1">tag</Text>
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-neutral-200 dark:bg-neutral-800 rounded px-2 py-1">tag</Text>
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-neutral-200 dark:bg-neutral-800 rounded px-2 py-1">tag</Text>
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-neutral-200 dark:bg-neutral-800 rounded px-2 py-1">React</Text>
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-neutral-200 dark:bg-neutral-800 rounded px-2 py-1">Node.js</Text>
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-neutral-200 dark:bg-neutral-800 rounded px-2 py-1">TypeScript</Text>
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-neutral-200 dark:bg-neutral-800 rounded px-2 py-1">Remote</Text>
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-neutral-200 dark:bg-neutral-800 rounded px-2 py-1">Full-time</Text>
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-neutral-200 dark:bg-neutral-800 rounded px-2 py-1">Senior</Text>
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-neutral-200 dark:bg-neutral-800 rounded px-2 py-1">AWS</Text>
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-neutral-200 dark:bg-neutral-800 rounded px-2 py-1">Docker</Text>
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-neutral-200 dark:bg-neutral-800 rounded px-2 py-1">CI/CD</Text>
                <Text className="font-medium text-neutral-800 dark:text-neutral-200 text-sm bg-neutral-200 dark:bg-neutral-800 rounded px-2 py-1">Agile</Text>

                </View>

            </View>
            
        </Card>
    </View>
    );
}
