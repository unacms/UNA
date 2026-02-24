import { useState, useCallback } from 'react'
import Image from 'app/ui/atoms/image'
import Profile from 'app/ui/molecules/profile'
import { appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Card } from 'app/ui/molecules/card'
import Link from 'app/ui/atoms/link'
import { Skeleton } from 'app/ui/atoms/skeleton'
import Time from 'app/ui/atoms/time'

export default function defaultUnit(props) {
    const data = props.data
    const isSkeleton = data?.skeleton
    const postedTs = data?.date || data?.added || data?.created

    // Default 2 = row meta (compact). 2-line titles are the common case and
    // never trigger a state update, so they never cause a re-render.
    // Default 1 (stacked) would always cause a state update for 2-line titles,
    // producing a visible blink on every card load.
    //
    // onLayout fires on View on both native and web (React Native Web).
    // Guard against height=0: web fires onLayout twice on mount — once before
    // the browser has laid out (h=0), once after. Skipping h=0 prevents a
    // spurious 1→2→1 state cycle that produces two render waves.
    const [titleLines, setTitleLines] = useState(2)
    const handleTitleLayout = useCallback((e) => {
        const height = e.nativeEvent.layout.height
        if (height === 0) return
        const lines = height > 28 ? 2 : 1
        setTitleLines(prev => prev === lines ? prev : lines)
    }, [])

    // stacked: title is 1 line → username and date get their own lines
    // row: title is 2 lines → username · date share a single line
    const stackedMeta = titleLines < 2

    return (
        <Link href={data.url} emulate className="web:group">
            <Card padding="p-2" className="gap-2">
                <View className="aspect-video rounded-lg overflow-hidden w-full bg-accent">
                    <Skeleton className="h-full w-full" rounded="rounded-xl" visible={isSkeleton}>
                        <Image
                            {...data.image}
                            alt={data.title}
                            view="cover"
                            className="u-cover"
                            sizes='auto'
                        />
                    </Skeleton>
                </View>
                
                    <View className="flex-row items-start gap-2">
                        <Skeleton
                            visible={isSkeleton}
                            fallback={<View className="h-10 w-10 rounded-full bg-muted" />}
                        >
                            <Profile
                                {...data.author_data}
                                displayType="unit_wo_info"
                                displaySize="base"
                                showInfo={false}
                            />
                        </Skeleton>
                        <View className="flex-1 gap-1">
                            <Skeleton
                                visible={isSkeleton}
                                fallback={
                                    <View className="gap-1">
                                        <View className="h-5 w-3/4 rounded-full bg-muted" />
                                        <View className="h-5 w-1/2 rounded-full bg-muted" />
                                    </View>
                                }
                            >
                                <View onLayout={handleTitleLayout}>
                                    <Text
                                        numberOfLines={2}
                                        className="text-card-foreground web:group-hover:text-accent-foreground leading-tight text-base font-semibold"
                                    >
                                        {data.title}
                                    </Text>
                                </View>
                            </Skeleton>
                            <Skeleton
                                visible={isSkeleton}
                                fallback={<View className="h-4 w-28 rounded-full bg-muted" />}
                            >
                                {stackedMeta ? (
                                    <View className="">
                                        <Profile
                                            {...data.author_data}
                                            displayType="unit_text_link"
                                            displaySize="sm"
                                        />
                                        {postedTs && (
                                            <Time
                                                stylesName="text-sm text-muted-foreground"
                                                ts={postedTs}
                                            />
                                        )}
                                    </View>
                                ) : (
                                    <Row className="items-center gap-1">
                                        <Profile
                                            {...data.author_data}
                                            displayType="unit_text_link"
                                            displaySize="sm"
                                        />
                                        {postedTs && (
                                            <>
                                                <Text className="text-sm text-muted-foreground">·</Text>
                                                <Time
                                                    stylesName="text-sm text-muted-foreground"
                                                    ts={postedTs}
                                                />
                                            </>
                                        )}
                                    </Row>
                                )}
                            </Skeleton>
                        </View>
                    </View>
                
            </Card>
        </Link>
    )
}
