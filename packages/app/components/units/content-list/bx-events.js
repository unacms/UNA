import { formatDateInterval } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { useTranslation } from 'react-i18next';
import { Skeleton } from 'app/ui/atoms/skeleton';
import {
    UnitActions,
    UnitImage,
    UnitProfileList,
    UnitTitle,
    UnitVisibility,
    UnitWrapper,
    useUnitActions,
} from 'app/components/units/helpers';

export default function Unit({ data, unitType, module }) {
    const { t } = useTranslation();
    const { primaryMenuItem, secondaryMenuItem } = useUnitActions({
        unitType,
        data,
        module,
        t,
    });

    const isSkeleton = data?.skeleton;

    return (
        <UnitWrapper data={data} module={module} as="list" padding="p-1">
            <View className="flex-row sm:flex-col p-1">
                <View className="aspect-square sm:aspect-video w-1/3 sm:w-full rounded-lg sm:rounded-xl overflow-hidden items-center justify-center bg-muted-foreground/20">
                    <UnitImage
                        image={data.cover}
                        alt={data.title}
                        skeleton={isSkeleton}
                        view="cover"
                        className="absolute u-cover rounded-lg"
                    />
                </View>
                <View className="p-3 flex-auto flex-col justify-between gap-3">
                    <View className="h-22 flex-col">
                        <Skeleton visible={isSkeleton} className="h-4 w-1/2">
                            {data.date_start ? (
                                <Text
                                    numberOfLines={1}
                                    className="text-muted-foreground text-xs uppercase font-semibold tracking-tight"
                                >
                                    {formatDateInterval(data.date_start, data.date_end, t)}
                                </Text>
                            ) : null}
                        </Skeleton>
                        <UnitTitle
                            title={data.title}
                            skeleton={isSkeleton}
                            numberOfLines={2}
                            skeletonClassName="h-10 w-3/4 mt-1"
                        />
                        <Row className="items-center h-6 mt-auto justify-between">
                            <UnitProfileList
                                data={data}
                                skeleton={isSkeleton}
                                listKey="followers_list"
                                countKey="intrested"
                                fallbackCountKey="going"
                                displaySize="xs"
                                labelClassName="truncate text-xs leading-tight flex-auto text-muted-foreground"
                            />
                            <UnitVisibility visibility={data.visibility} skeleton={isSkeleton} />
                        </Row>
                    </View>
                    <UnitActions
                        primaryMenuItem={primaryMenuItem}
                        secondaryMenuItem={secondaryMenuItem}
                        skeleton={isSkeleton}
                        className="flex-row sm:flex-col gap-2 w-full"
                        inlineSecondary
                    />
                </View>
            </View>
        </UnitWrapper>
    );
}
