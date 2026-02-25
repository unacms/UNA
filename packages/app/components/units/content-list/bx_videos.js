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
import LinkOrModal from 'app/ui/molecules/link-or-modal'

export default function defaultUnit({ data }) {

    const isSkeleton = data?.skeleton
    const postedTs = data?.date || data?.added || data?.created

    const viewsCount = data?.meta?.items?.find(item => item.name == "views")?.title

    return (
        <LinkOrModal href={data.url} className="web:group" showInModal={appSetting('browse', 'show_in_modal', data.module)}>
            <Card padding="p-2" className="gap-2 web:hover:shadow-custom-hover web:hover:bg-card web:duration-300 web:active:bg-accent">
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

                <View className="flex-row items-start gap-3 px-1">

                    <View className="flex-1 gap-2">
                        <Skeleton
                            visible={isSkeleton}
                            fallback={
                                <View className="gap-1">
                                    <View className="h-4 w-full rounded-full bg-muted" />
                                    <View className="h-4 w-2/3 rounded-full bg-muted" />
                                </View>
                            }
                        >
                            <View className=" h-10 justify-center">
                                <Text
                                    numberOfLines={2}
                                    className="text-card-foreground web:hover:text-foreground leading-tight text-base font-semibold"
                                >
                                    {data.title}
                                </Text>
                            </View>
                        </Skeleton>
                        <Skeleton
                            visible={isSkeleton}
                            fallback={
                                <Row className="gap-2 mt-0.5">
                                    <View className="h-9 w-9 rounded-full bg-muted" />
                                    <View className="gap-1 my-auto flex-auto">
                                        <View className="h-3.5 w-1/3 rounded-full bg-muted" />
                                        <View className="h-3.5 w-1/4 rounded-full bg-muted" />
                                    </View>
                                </Row>
                            }
                        >
                            <Row className="items-center gap-2">
                                <Skeleton
                                    visible={isSkeleton}
                                    fallback={<View className="h-10 w-10 rounded-full bg-muted" />}
                                >
                                    <Profile
                                        {...data.author_data}
                                        displayType="unit_wo_info"
                                        displaySize="sm"
                                        showInfo={false}
                                    />
                                </Skeleton>
                                <View className="flex-col">
                                    <Profile
                                        {...data.author_data}
                                        displayType="unit_text_link"
                                        displaySize="sm"
                                    />
                                    <Row className="items-center gap-1">
                                        {postedTs && (
                                                <Time
                                                    stylesName="text-xs text-muted-foreground"
                                                    ts={postedTs}
                                                />
                                        )}
                                        {viewsCount && (
                                            <>
                                                <Text className="text-xs text-muted-foreground">·</Text>
                                                <Text className="text-xs text-muted-foreground">{viewsCount}</Text>
                                            </>
                                        )}
                                    </Row>
                                </View>
                            </Row>
                        </Skeleton>
                    </View>
                </View>
            </Card>
        </LinkOrModal>
    )
}
