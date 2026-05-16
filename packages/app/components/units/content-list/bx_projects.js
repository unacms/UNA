import { useMemo } from 'react'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { Card } from 'app/ui/molecules/card'
import { getUnitMenuItems } from 'app/customization/functions';
import { Skeleton } from 'app/ui/atoms/skeleton';
import { Platform } from 'react-native'

const PROJECT_COVER_SIZES = '(max-width: 639px) calc(100vw - 32px), (max-width: 767px) calc(50vw - 32px), (max-width: 1023px) calc(33vw - 32px), 256px';

export default function Unit(props) {
    const data = props.data;
    const hasDomain = !!data?.domain;
    const domainLabel = hasDomain ? data.domain : 'no domain';
    const domainUrl = data?.domain && !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(data.domain)
        ? `https://${data.domain}`
        : data?.domain;
    const contentPointerEvents = Platform.OS === 'web' ? undefined : 'box-none';
    const visualPointerEvents = Platform.OS === 'web' ? undefined : 'none';
    const { oMenuItemPrimary, oMenuItemSecondary } = useMemo(() => {
        return getUnitMenuItems(props.unitType, data, {}, null, props.module);
    }, [props.unitType, data]);
    const isSkeleton = data?.skeleton;
    return (
        <Card padding="p-1" className="relative web:group active:opacity-80 active:scale-[0.98] active:shadow-btn-glass-pressed dark:active:shadow-btn-glass-pressed-deep transition-all duration-200">
            <Link
                href={data.url}
                className="absolute inset-0 z-0 rounded-xl web:hover:bg-accent/20"
                alt={data.title}
            >
                <View className="absolute inset-0" />
            </Link>

            
                <View pointerEvents={visualPointerEvents} className="relative z-10 web:pointer-events-none bg-muted/20 aspect-video overflow-hidden border inset-0 border-border/20 rounded-lg w-full">
                    <Skeleton className="" rounded='rounded-lg' visible={isSkeleton}>
                        <Image
                            {...data.cover}
                            alt={data.title}
                            view="cover"
                            className="absolute u-cover"
                            sizes={PROJECT_COVER_SIZES}
                        />
                    </Skeleton>
                </View>
           
            <View pointerEvents={contentPointerEvents} className="relative z-10 web:pointer-events-none flex-auto p-2 gap-3">
                <View pointerEvents={contentPointerEvents} className="h-16 web:pointer-events-none gap-1 justify-between">
                        <Skeleton className="h-5 w-3/4" visible={isSkeleton}>
                            <Text numberOfLines={2} className="p-0.5 text-card-foreground tracking-tight web:group-hover:text-foreground web:group-hover:underline text-base leading-5 font-semibold">
                                {data.title}
                            </Text>
                        </Skeleton>
                    
                    {hasDomain ? <Link href={domainUrl} target="_blank" className="relative z-30 web:pointer-events-auto mr-auto">
                        <Skeleton className="h-5 w-3/4" visible={isSkeleton}>
                            <Text numberOfLines={2} className="text-muted-foreground text-sm tracking-tight web:hover:underline bg-emerald-500/10 rounded-md px-1.5 py-0.5 leading-5 flex-none ">
                                {domainLabel}
                            </Text>
                        </Skeleton>
                    </Link> : <Skeleton className="h-5 w-3/4" visible={isSkeleton}>
                        <Text numberOfLines={2} className="text-muted-foreground/80 mr-auto text-sm tracking-tight bg-muted/40 rounded-md px-1.5 py-0.5 leading-5 flex-none ">
                            {domainLabel}
                        </Text>
                    </Skeleton>}
                </View>
                <View className="relative z-30 web:pointer-events-auto hidden flex-row sm:flex-col gap-2 w-full">
                    <Skeleton className='h-9 w-full' rounded='rounded-lg' visible={isSkeleton}>
                        {oMenuItemPrimary}
                        {!!oMenuItemSecondary && <View className={`${!!oMenuItemPrimary && 'sm:mt-2  ml-2 sm:ml-0'}`}>{oMenuItemSecondary}</View>}
                    </Skeleton>
                </View>

            </View>
        </Card>
    );

}