import Image from "app/ui/atoms/image";
import Link from "app/ui/atoms/link";
import { Text } from "app/design/typography";
import { View, Row } from "app/design/view";
import { CardList } from 'app/ui/molecules/page/card'
import { getComponent } from 'app/components/registry';

export default function Unit(props) {
    const Stars = getComponent('molecule', 'stars');
    const data = props.data;



    let sRate = undefined;
    if (data.meta?.items)
        data.meta.items.forEach((aItem) => {
            if (aItem.name != 'votes' || aItem.data.type != 'stars')
                return;

            aItem.data.params = { ...aItem.data.params, show_counter: false };

            sRate = (
                <Stars {...aItem.data} />
            );
        });
    //  console.log("datadata", data)
    return (
        <View className=" p-4 mx-auto w-full ">
            <CardList padding='p-2' className='mb-2 md:mb-0'>
                <View className="flex-auto">
                    <Link href={data.url}>
                        <Text numberOfLines={2} className="text-secondary-foreground mb-1  web:hover:text-primary text:lg sm:text-xl font-semibold ">
                            {data.title}
                        </Text>
                        <Text numberOfLines={2} className="text-muted-foreground mb-4  text-xs sm:text-sm">
                            {data.description}
                        </Text>
                    </Link>
                    <View className="mt-auto flex-row gap-x-1.5">
                        <Text className="font-medium text-secondary-foreground  text-sm border border-border/60 rounded-full px-2 py-1">Author</Text>

                        {data.pay_hourly > 0 && <Text className="font-medium text-secondary-foreground  text-sm bg-green-200 dark:bg-green-800 rounded-full px-2 py-1">Hourly: {data.pay_hourly}$</Text>}
                        {data.pay_total > 0 && <Text className="font-medium text-secondary-foreground  text-sm bg-blue-200 dark:bg-blue-800 rounded-full px-2 py-1">Total: {data.pay_total}$</Text>}

                    </View>
                    <View className="mt-4 flex-row flex-wrap gap-x-2 gap-y-1">
                        <Text className="font-medium text-secondary-foreground  text-sm bg-secondary rounded px-2 py-1">tag</Text>
                        <Text className="font-medium text-secondary-foreground  text-sm bg-secondary rounded px-2 py-1">tag</Text>
                        <Text className="font-medium text-secondary-foreground  text-sm bg-secondary rounded px-2 py-1">tag</Text>
                        <Text className="font-medium text-secondary-foreground  text-sm bg-secondary rounded px-2 py-1">tag</Text>
                        <Text className="font-medium text-secondary-foreground  text-sm bg-secondary rounded px-2 py-1">React</Text>
                        <Text className="font-medium text-secondary-foreground  text-sm bg-secondary rounded px-2 py-1">Node.js</Text>
                        <Text className="font-medium text-secondary-foreground  text-sm bg-secondary rounded px-2 py-1">TypeScript</Text>
                        <Text className="font-medium text-secondary-foreground  text-sm bg-secondary rounded px-2 py-1">Remote</Text>
                        <Text className="font-medium text-secondary-foreground  text-sm bg-secondary rounded px-2 py-1">Full-time</Text>
                        <Text className="font-medium text-secondary-foreground  text-sm bg-secondary rounded px-2 py-1">Senior</Text>
                        <Text className="font-medium text-secondary-foreground  text-sm bg-secondary rounded px-2 py-1">AWS</Text>
                        <Text className="font-medium text-secondary-foreground  text-sm bg-secondary rounded px-2 py-1">Docker</Text>
                        <Text className="font-medium text-secondary-foreground  text-sm bg-secondary rounded px-2 py-1">CI/CD</Text>
                        <Text className="font-medium text-secondary-foreground  text-sm bg-secondary rounded px-2 py-1">Agile</Text>

                    </View>

                </View>

            </CardList>
        </View>
    );
}
