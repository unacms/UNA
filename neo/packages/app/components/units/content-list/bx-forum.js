import { Text } from "app/design/typography";
import { View, Row } from "app/design/view";
import Menu from "app/components/menu";
import Time from "app/ui/atoms/time";
import { Skeleton } from 'app/ui/atoms/skeleton'
import {
    UnitAuthor,
    UnitImage,
    UnitText,
    UnitTitle,
    UnitWrapper,
    getPostedTs,
    resolveUnitVariant,
} from 'app/components/units/helpers'
import { useTranslation } from 'react-i18next'

const Units = {};

Units.Search = function Search({ data }) {
    const isSkeleton = data?.skeleton
    return (
        <UnitWrapper data={data} padding="p-1">
            <View className="  aspect-video flex-none rounded-xl overflow-hidden mb-auto w-full bg-muted   ">
                <UnitImage
                    image={data.image}
                    alt={data.title}
                    skeleton={isSkeleton}
                    view="cover"
                    skeletonClassName="h-full w-full"
                    rounded="rounded-xl"
                />
            </View>
            <View className="flex-auto sm:h-40 flex-col p-2">
                <UnitTitle
                    title={data.title}
                    skeleton={isSkeleton}
                    skeletonClassName="h-6 w-3/4 mt-2"
                />
                <UnitText
                    text={data.summary_plain}
                    skeleton={isSkeleton}
                    numberOfLines={3}
                    skeletonClassName="h-16 w-full mt-2"
                    className="text-muted-foreground  mt-2 mb-auto text-xs "
                />
                <UnitAuthor authorData={data.author_data} skeleton={isSkeleton} className="mt-2" />
            </View>
        </UnitWrapper>
    )
}

Units.Small = function Small({ data }) {
    const isSkeleton = data?.skeleton
    return (
        <UnitWrapper data={data} as="list" padding="p-2">
            <View className="  aspect-video flex-none rounded-xl overflow-hidden mb-auto w-full bg-muted   ">
                <UnitImage
                    image={data.image}
                    alt={data.title}
                    skeleton={isSkeleton}
                    view="cover"
                    skeletonClassName="h-full w-full"
                    rounded="rounded-xl"
                />
            </View>
            <View className="flex-auto sm:h-40 flex-col p-2">
                <UnitTitle
                    title={data.title}
                    skeleton={isSkeleton}
                    skeletonClassName="h-6 w-3/4 mt-2"
                />
                <UnitText
                    text={data.summary_plain}
                    skeleton={isSkeleton}
                    numberOfLines={3}
                    skeletonClassName="h-16 w-full mt-2"
                    className="text-muted-foreground  mt-2 mb-auto text-xs "
                />
                <UnitAuthor authorData={data.author_data} skeleton={isSkeleton} className="mt-2" />
            </View>
        </UnitWrapper>
    )
}

Units.Base = function Base({ data }) {
    const { t } = useTranslation()
    const isSkeleton = data?.skeleton
    const categoryName = data.category?.name
    const categoryIcon = data.category?.icon
    const postedTs = getPostedTs(data)

    return (
        <UnitWrapper data={data} as="list" className="flex-row gap-x-3 px-4">
            <View className="flex-none pt-0.5">
                <Skeleton className="h-10 w-10" rounded="rounded-lg" visible={isSkeleton}>
                    <View className="h-10 w-10 border border-primary/10 bg-primary/10 rounded-lg items-center justify-center overflow-hidden">
                        <Text className="text-xl leading-none">
                            {categoryIcon}
                        </Text>
                    </View>
                </Skeleton>
            </View>

            <View className="gap-y-2 flex-auto min-w-0">
                <View className="flex-row gap-x-3">
                    <View className="gap-y-1.5 flex-auto min-w-0">
                        <UnitTitle
                            title={data.title}
                            skeleton={isSkeleton}
                        />

                        <UnitAuthor authorData={data.author_data} skeleton={isSkeleton} displaySize="sm">
                            <Row className="items-center gap-1">
                                {postedTs ? (
                                    <Time
                                        stylesName="text-xs text-muted-foreground"
                                        ts={postedTs}
                                    />
                                ) : null}
                                {categoryName ? (
                                    <>
                                        {postedTs ? <Text className="text-xs text-muted-foreground">·</Text> : null}
                                        <Text className="text-xs text-muted-foreground">{t('in')}</Text>
                                        <Text numberOfLines={1} className="text-xs font-semibold text-foreground">
                                            {categoryName}
                                        </Text>
                                    </>
                                ) : null}
                            </Row>
                        </UnitAuthor>

                        {(data.summary_plain || isSkeleton) ? (
                            <UnitText
                                text={data.summary_plain}
                                skeleton={isSkeleton}
                                skeletonClassName="h-9 w-full"
                                className="text-muted-foreground text-sm leading-snug"
                            />
                        ) : null}
                    </View>

                    {(data.image || isSkeleton) && (
                        <View
                            className={
                                (!data.image ? 'hidden sm:block ' : '')
                                + 'aspect-video flex-none rounded-xl overflow-hidden w-1/4 sm:w-auto sm:h-20'
                            }
                        >
                            <UnitImage
                                image={data.image}
                                alt={data.title}
                                skeleton={isSkeleton}
                                view="cover"
                                skeletonClassName="h-full w-full"
                                rounded="rounded-xl"
                            />
                        </View>
                    )}
                </View>

                <View className="flex-row justify-between gap-x-2 mt-auto items-center">
                    <Skeleton className="h-8 w-12 flex-none" rounded="rounded-lg" visible={isSkeleton}>
                        <Menu
                            {...data.meta}
                            displayType="button"
                            displaySize
                            params={{
                                show_action: true,
                                show_counter: true,
                                show_combined: true,
                                button_style: 'borderless',
                                button_size: 'small',
                            }}
                        />
                    </Skeleton>
                </View>
            </View>
        </UnitWrapper>
    )
}

export default function BxForum({ data, module, unitType, mode }) {
    const Component = resolveUnitVariant(Units, { module, unitType, mode });

    return <Component data={data} />;
}
