import Link from "app/ui/atoms/link";
import { Text } from "app/design/typography";
import { View } from "app/design/view";
import { CardList } from 'app/ui/molecules/page/card'
import { components } from 'app/components/registry';
import { UnitText, UnitTitle } from 'app/components/units/helpers'
import { useTranslation } from 'react-i18next'

export default function Unit({ data }) {
    const { t } = useTranslation();
    const Stars = components['molecule']['stars'];
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
                        <UnitTitle
                            title={data.title}
                        />
                        <UnitText
                            text={data.description}
                            className="text-muted-foreground mb-4  text-xs sm:text-sm"
                        />
                    </Link>
                    <View className="mt-auto flex-row gap-x-1.5">
                        <Text className="font-medium text-secondary-foreground  text-sm border border-border/60 rounded-full px-2 py-1">{t('Author')}</Text>

                        {data.pay_hourly > 0 && <Text className="font-medium text-secondary-foreground  text-sm bg-green-200 dark:bg-green-800 rounded-full px-2 py-1">{t('Hourly:')} {data.pay_hourly}$</Text>}
                        {data.pay_total > 0 && <Text className="font-medium text-secondary-foreground  text-sm bg-blue-200 dark:bg-blue-800 rounded-full px-2 py-1">{t('Total:')} {data.pay_total}$</Text>}

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
