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

    const showInModal = appSetting('browse', 'show_in_modal', data.module)

    return (
        <Card padding="p-2" className="gap-2 web:group web:hover:shadow-sm web:hover:bg-card web:duration-300 web:active:bg-accent">
            <LinkOrModal href={data.url} showInModal={showInModal}>
                <View className="aspect-video rounded-lg overflow-hidden w-full">
                    <Skeleton className="h-full w-full" rounded="rounded-lg" visible={isSkeleton}>
                        <Image
                            {...data.image}
                            alt={data.title}
                            view="cover"
                            className="u-cover"
                            sizes='auto'
                        />
                    </Skeleton>
                </View>
            </LinkOrModal>

            <View className="flex-row items-start gap-3 px-1">

                <View className="flex-1 gap-2">
                    <LinkOrModal href={data.url} showInModal={showInModal}>
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
                    </LinkOrModal>

                    {/* Author row stays outside the card link: the author is its own
                        link, and an <a> cannot be nested inside another <a>. */}
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
                                {/* `showLink` (singular) turns off Profile's emulated-press mode
                                    so the avatar and name render as real links, not role="button". */}
                                <Profile
                                    {...data.author_data}
                                    displayType="unit_wo_info"
                                    displaySize="sm"
                                    showInfo={false}
                                    showLink
                                />
                            </Skeleton>
                            <View className="flex-col">
                                <Profile
                                    {...data.author_data}
                                    displayType="unit_text_link"
                                    displaySize="sm"
                                    showLink
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
    )
}
