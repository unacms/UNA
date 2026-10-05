import { Platform } from "react-native";
import Image from "app/ui/atoms/image";
import { Text } from "app/design/typography";
import { View, Row } from "app/design/view";
import { components } from 'app/components/registry';
import { Skeleton } from 'app/ui/atoms/skeleton';
import {
    UnitAuthor,
    UnitText,
    UnitTitle,
    UnitWrapper,
    getStarsRatingData,
} from 'app/components/units/helpers';

export default function Unit({ data }) {
    const Stars = components['molecule']['stars'];

    let cover_raw = data.cover_raw?.replace(
        /\\u([\d\w]{4})/gi,
        function (match, grp) {
            return String.fromCharCode(parseInt(grp, 16));
        },
    );

    const starsData = getStarsRatingData(data);
    const sRate = starsData ? <Stars {...starsData} /> : undefined;

    const isSkeleton = data?.skeleton;
    // raw HTML covers can only render on web; native falls back to the image
    const hasHtmlCover = Platform.OS === 'web' && !!cover_raw?.trim();

    return (
        <UnitWrapper data={data} as="list" padding="p-1" className="mb-2 md:mb-0">
            <View className="flex-col w-full">
                <View className="w-full p-1">
                    <View className="w-full mb-auto bg-muted  aspect-video overflow-hidden rounded-xl">
                        <Skeleton className="" rounded='rounded-lg' visible={isSkeleton}>
                            {hasHtmlCover && (
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: cover_raw,
                                    }}
                                ></div>
                            )}
                            {!hasHtmlCover && (
                                <Image
                                    src={data.cover?.medium}
                                    alt={data.title}
                                    view="cover"
                                    className="u-cover"
                                    sizes='auto'
                                />
                            )}
                        </Skeleton>
                    </View>
                    <View className="flex-auto px-2 py-3 gap-y-2 h-34 ">
                        <Row className="justify-between">
                            <View className=" gap-y-3 flex-auto">
                                <Skeleton className="h-6 w-1/4" visible={isSkeleton}>
                                    <Text className="mr-auto bg-primary/20 rounded-lg font-semibold px-2 py-1 flex-none flex-auto text-secondary-foreground ">
                                        {data.price_recurring > 0
                                            ? data.price_recurring +
                                            "$/" +
                                            data.duration_recurring
                                            : data.price_single > 0
                                                ? data.price_single + "$"
                                                : "Free"}
                                    </Text>
                                </Skeleton>
                                <View className="overflow-hidden">
                                    <UnitTitle
                                        title={data.title}
                                        skeleton={isSkeleton}
                                        numberOfLines={1}
                                        skeletonClassName="h-6 w-full mt-2"
                                    />
                                </View>
                            </View>

                        </Row>
                        {sRate}
                        <UnitText
                            text={data.summary_plain}
                            skeleton={isSkeleton}
                            skeletonClassName="h-12 w-full"
                            className="text-muted-foreground  mb-auto text-sm"
                        />
                    </View>
                </View>
                <View className="p-2">
                    <Row>
                        <UnitAuthor authorData={data.author_data} skeleton={isSkeleton} displaySize="sm" />
                        {data.image && (
                            <View className="h-8 w-8 aspect-square overflow-hidden  rounded-lg">
                                <Image
                                    {...data.image}
                                    alt={data.title}
                                    view="cover"
                                    nobg={true}
                                    sizes='auto'
                                />
                            </View>
                        )}
                    </Row>
                </View>
            </View>
        </UnitWrapper>
    );
}
