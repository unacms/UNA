import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { Card } from 'app/ui/molecules/page/card'
import { Skeleton } from 'app/ui/atoms/skeleton';
import { Platform } from 'react-native'
import { UnitActions, UnitImage, UnitTitle, useUnitActions } from 'app/components/units/helpers'

const PROJECT_COVER_SIZES = '(max-width: 639px) calc(100vw - 32px), (max-width: 767px) calc(50vw - 32px), (max-width: 1023px) calc(33vw - 32px), 256px';

export default function Unit({ data, unitType, module }) {
    const hasDomain = !!data?.domain;
    const domainLabel = hasDomain ? data.domain : 'no domain';
    const domainUrl = data?.domain && !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(data.domain)
        ? `https://${data.domain}`
        : data?.domain;
    const contentPointerEvents = Platform.OS === 'web' ? undefined : 'box-none';
    const visualPointerEvents = Platform.OS === 'web' ? undefined : 'none';
    const { primaryMenuItem, secondaryMenuItem } = useUnitActions({
        unitType,
        data,
        module,
    });
    const isSkeleton = data?.skeleton;
    return (
        <Card padding="p-1" className="relative group web:cursor-pointer active:opacity-80 active:scale-[0.98] active:shadow-btn-glass-pressed dark:active:shadow-btn-glass-pressed-deep transition-transform duration-200">
            <Link
                href={data.url}
                hitarea={false}
                className="absolute inset-0 z-0 rounded-xl web:cursor-pointer web:group-hover:bg-accent/20"
                alt={data.title}
            >
                <View className="absolute inset-0 web:pointer-events-none" />
            </Link>


            <View pointerEvents={visualPointerEvents} className="relative z-10 web:pointer-events-none bg-muted/20 aspect-video overflow-hidden border inset-0 border-border/20 rounded-lg w-full">
                <UnitImage
                    image={data.cover}
                    alt={data.title}
                    skeleton={isSkeleton}
                    view="cover"
                    className="absolute u-cover"
                    sizes={PROJECT_COVER_SIZES}
                />
            </View>

            <View pointerEvents={contentPointerEvents} className="relative z-10 web:pointer-events-none flex-auto p-2 gap-3">
                <View pointerEvents={contentPointerEvents} className="h-16 web:pointer-events-none gap-1 justify-between">
                    <UnitTitle
                        title={data.title}
                        skeleton={isSkeleton}
                    />

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
                <UnitActions
                    primaryMenuItem={primaryMenuItem}
                    secondaryMenuItem={secondaryMenuItem}
                    skeleton={isSkeleton}
                    className="relative z-30 web:pointer-events-auto hidden flex-row sm:flex-col gap-2 w-full"
                    inlineSecondary
                />

            </View>
        </Card>
    );

}