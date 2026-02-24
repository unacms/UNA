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

export default function defaultUnit({data}) {

    const isSkeleton = data?.skeleton
    const postedTs = data?.date || data?.added || data?.created

    const viewsCount = data?.meta?.items?.find(item => item.name== "views")?.title

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
                                <View className="h-10 justify-center">
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
                                        {viewsCount && (
                                            <>
                                                <Text className="text-sm text-muted-foreground">·</Text>
                                                <Text className="text-sm text-muted-foreground">{viewsCount}</Text>
                                            </>
                                        )}
                                    </Row>
                            </Skeleton>
                        </View>
                    </View>
                
            </Card>
        </Link>
    )
}
