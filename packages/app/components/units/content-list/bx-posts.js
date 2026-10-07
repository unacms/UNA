import { View } from 'app/design/view'
import {
    UnitAuthor,
    UnitImage,
    UnitText,
    UnitTitle,
    UnitWrapper,
    resolveUnitVariant,
} from 'app/components/units/helpers';
const Units = {};

Units.Base = function Base({ data, listIndex }) {
    const isSkeleton = data?.skeleton;
    const isLcpCandidate = listIndex === 0;
    return (
        <UnitWrapper data={data} padding="p-2 gap-3">
            <View className="  aspect-video flex-none rounded-lg overflow-hidden mb-auto w-full bg-accent">
                <UnitImage
                    view="cover"
                    image={data.image}
                    alt={data.title}
                    skeleton={isSkeleton}
                    className="u-cover  absolute"
                    optimizedWidthCap={640}
                    priority={isLcpCandidate}
                />
               
            </View>
            <View className="flex-auto h-38 flex-col px-2 gap-y-3">
                <UnitTitle
                    title={data.title}
                    skeleton={isSkeleton}
                    skeletonClassName="h-6 w-3/4"
                />
                <UnitText
                    text={data.summary_plain}
                    skeleton={isSkeleton}
                    numberOfLines={3}
                    skeletonClassName="h-16"
                    className="min-h-0 text-secondary-foreground mt-2 mb-auto text-sm "
                />
                <UnitAuthor authorData={data.author_data} skeleton={isSkeleton} />
            </View>
        </UnitWrapper>
    )
}

Units.Search = function Search({ data, listIndex }) {
    const isSkeleton = data?.skeleton;
    const isLcpCandidate = listIndex === 0;
    return (
        <UnitWrapper data={data} as="list" padding="p-1">
            <View className="  aspect-video flex-none rounded-lg overflow-hidden mb-auto w-full bg-muted   ">
                <UnitImage
                    image={data.image}
                    alt={data.title}
                    skeleton={isSkeleton}
                    view="cover"
                    skeletonClassName="h-full w-full"
                    optimizedWidthCap={640}
                    priority={isLcpCandidate}
                />
            </View>
            <View className="flex-auto h-40 flex-col p-2 lg:p-3">
                <UnitTitle
                    title={data.title}
                    skeleton={isSkeleton}
                    numberOfLines={false}
                    skeletonClassName="h-6 w-3/4 mt-2"
                />
                <UnitText
                    text={data.summary_plain}
                    skeleton={isSkeleton}
                    numberOfLines={3}
                    skeletonClassName="h-16 w-full mt-2"
                    className="min-h-0 text-muted-foreground  mt-2 mb-auto text-xs "
                />
                <UnitAuthor authorData={data.author_data} skeleton={isSkeleton} className="mt-2" />
            </View>

        </UnitWrapper>
    )
}

Units.Small = function Small({ data, listIndex }) {
    const isSkeleton = data?.skeleton;
    const isLcpCandidate = listIndex === 0;
    return (
        <UnitWrapper data={data} as="list" padding="p-1">
            {(data.image || isSkeleton) && (
                <View className="aspect-square md:aspect-video flex-none rounded-xl  overflow-hidden h-30 sm:h-36 mb-auto  ">
                    <UnitImage
                        image={data.image}
                        alt={data.title}
                        skeleton={isSkeleton}
                        view="cover"
                        skeletonClassName="h-full w-full"
                        rounded="rounded-xl"
                        optimizedWidthCap={640}
                        priority={isLcpCandidate}
                    />
                </View>
            )}
            <View className="flex-auto">
                <UnitTitle
                    title={data.title}
                    skeleton={isSkeleton}
                    skeletonClassName="h-6 w-3/4 mt-1"
                />
                <UnitText
                    text={data.summary_plain}
                    skeleton={isSkeleton}
                    skeletonClassName="h-12 w-full mb-2"
                    className="text-muted-foreground mb-2  text-sm"
                />
                <UnitAuthor authorData={data.author_data} skeleton={isSkeleton} className="mt-auto" />
            </View>
        </UnitWrapper>
    )
}

export default function BxPosts({ data, module, unitType, listIndex }) {
    const Component = resolveUnitVariant(Units, { module, unitType });
    return <Component data={data} listIndex={listIndex} />;
}
