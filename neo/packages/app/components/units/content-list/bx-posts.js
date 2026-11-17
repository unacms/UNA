import { View } from 'app/design/view'
import {
    UnitAuthor,
    UnitImage,
    UnitText,
    UnitTitle,
    UnitWrapper,
    resolveUnitVariant,
    UnitContentCard,
} from 'app/components/units/helpers';
const Units = {};

// A post's card in a list and in search results: UnitContentCard, as UNA's site draws it.
Units.Base = function Base({ data, listIndex }) {
    return <UnitContentCard data={data} module="bx_posts" listIndex={listIndex} />;
};
Units.Search = Units.Base;

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

export default function BxPosts({ data, module, unitType, mode, listIndex }) {
    const Component = resolveUnitVariant(Units, { module, unitType, mode });
    return <Component data={data} listIndex={listIndex} />;
}
