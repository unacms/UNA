import { formatDateInterval } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import ProfilesList from 'app/ui/molecules/profile/profile-list'
import { useTranslation } from 'react-i18next';
import { Skeleton } from 'app/ui/atoms/skeleton';
import {
    getCountLabel,
    UnitActions,
    UnitImage,
    UnitTitle,
    UnitVisibility,
    UnitWrapper,
    useUnitActions,
} from 'app/lib/unit-helpers';

export default function Unit({ data, unitType, module }) {
    const { t } = useTranslation();
    const friendsLabel = getCountLabel(data.followers_count, 'intrested');
    const friendsLabel1 = getCountLabel(data.members_count, 'going', { value: data?.followers_count });
    const { primaryMenuItem, secondaryMenuItem } = useUnitActions({
        unitType,
        data,
        module,
        t,
    });

    const isSkeleton = data?.skeleton;

    return (
        <UnitWrapper data={data} module={module} as="list" padding="p-1">
            <View className="flex-row sm:flex-col">
                <View className="aspect-square sm:aspect-video w-1/3 sm:w-full rounded-lg overflow-hidden items-center justify-center bg-muted-foreground/20">
                    <UnitImage
                        image={data.cover}
                        alt={data.title}
                        skeleton={isSkeleton}
                        view="cover"
                        className="absolute u-cover rounded-lg"
                    />
                </View>
                <View className="p-3 flex-auto flex-col justify-between gap-3">
                    <View className="h-28 flex-col">
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
                            <Skeleton preset='profile-list' visible={isSkeleton}>
                                <View className="mr-2  h-6">
                                    <ProfilesList
                                        data={
                                            data.followers_list
                                        }
                                        showEmpty={false}
                                        maxCount={3}
                                        displaySize="xs"
                                    />

                                </View>
                                {
                                    <><Text className="truncate text-xs leading-tight flex-auto text-muted-foreground ">
                                        {friendsLabel}
                                    </Text>
                                        {friendsLabel == '' && <Text className="truncate text-xs leading-tight flex-auto text-muted-foreground ">
                                            {friendsLabel1}
                                        </Text>
                                        }
                                    </>
                                }
                            </Skeleton>
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
