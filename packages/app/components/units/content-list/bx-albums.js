import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Time from 'app/ui/atoms/time'
import { getMetaItem, getPostedTs, UnitAuthor, UnitImage, UnitTitle, UnitWrapper } from 'app/components/units/helpers'

export default function defaultUnit({ data }) {

    const isSkeleton = data?.skeleton
    const postedTs = getPostedTs(data)
    const viewsCount = getMetaItem(data, 'views')?.title

    return (
        <UnitWrapper data={data} padding="p-2" className="gap-2 web:hover:shadow-sm web:hover:bg-card web:duration-300 web:active:bg-accent">
            <View className="aspect-video rounded-lg overflow-hidden w-full">
                <UnitImage
                    image={data.image}
                    alt={data.title}
                    skeleton={isSkeleton}
                    view="cover"
                    skeletonClassName="h-full w-full"
                />
            </View>
            <View className="flex-row items-start gap-3 px-1">
                <View className="flex-1 gap-2">
                    <View className=" h-10 justify-center">
                        <UnitTitle
                            title={data.title}
                            skeleton={isSkeleton}
                            skeletonClassName="h-4 w-full"
                        />
                    </View>
                    <UnitAuthor authorData={data.author_data} skeleton={isSkeleton} displaySize="sm">
                        <Row className="items-center gap-1">
                            {postedTs ? (
                                <Time
                                    stylesName="text-xs text-muted-foreground"
                                    ts={postedTs}
                                />
                            ) : null}
                            {viewsCount ? (
                                <>
                                    {postedTs ? <Text className="text-xs text-muted-foreground">·</Text> : null}
                                    <Text className="text-xs text-muted-foreground">{viewsCount}</Text>
                                </>
                            ) : null}
                        </Row>
                    </UnitAuthor>
                </View>
            </View>
        </UnitWrapper>
    )
}
