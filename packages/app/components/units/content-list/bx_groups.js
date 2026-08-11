import { useMemo, useRef } from 'react'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { tp } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Card, CardList } from 'app/ui/molecules/page/card'
import Redirect from 'app/ui/atoms/redirect'
import ProfilesList from 'app/ui/molecules/profile/profile_list'
import { useTranslation } from 'react-i18next';
import { getUnitMenuItems } from 'app/customization/functions';
import { Skeleton } from 'app/ui/atoms/skeleton';

export default function Unit(props) {
    const { t } = useTranslation();
    const data = props.data;
    const redirectdRef = useRef();


    const handleClick = (event, sUrl) => {
        event.preventDefault();
        redirectdRef.current.redirect(sUrl);
    };

    const friendsLabel = data.members_count > 0 ? tp("members", data?.members_count) : ''

    const { oMenuItemPrimary, oMenuItemSecondary } = useMemo(() => {
        return getUnitMenuItems(props.unitType, data, handleClick, t, props.module);
    }, [props.unitType, data, handleClick, t]);

    switch (props.unitType) {
        case 'search':
            return getBase();
        case 'list':
            return getBase();
        default:
            return getBase();
    }

    function getBase() {
        const isSkeleton = data?.skeleton;
        return (
            <Card padding="p-1">
                <Redirect ref={redirectdRef} />
                <Link className="web:group" href={data.url}>
                    <View className="relative bg-secondary aspect-video overflow-hidden rounded-lg w-full">
                        <Skeleton className="" rounded='rounded-lg' visible={isSkeleton}>
                            <Image
                                {...data.cover}
                                alt={data.title}
                                view="cover"
                                className="absolute u-cover"
                                sizes='auto'
                            />
                        </Skeleton>

                    </View>
                    <View className="flex-auto p-2 gap-3">
                        <View className="h-16 gap-1 justify-between">
                            <Skeleton className="h-5 w-3/4" visible={isSkeleton}>
                                <Text numberOfLines={2} className="text-card-foreground tracking-tight web:hover:text-foreground web:hover:underline leading-5 font-semibold">
                                    {data.title}
                                </Text>
                            </Skeleton>
                            <Row className="items-center gap-1 h-5">
                                <Skeleton preset='profile-list' visible={isSkeleton}>

                                    <>
                                        <ProfilesList
                                            data={data.members_list}
                                            showEmpty={false}
                                            maxCount={3}
                                            displaySize="2xs"
                                        />
                                        <Text className="truncate text-xs leading-tight flex-auto text-secondary-foreground">
                                            {friendsLabel}
                                        </Text>
                                    </>
                                </Skeleton>
                                <Skeleton visible={isSkeleton} className="h-5 w-1/3 border border-card">
                                    <Text className=" bg-accent/60 rounded-md px-1.5 py-1 text-xs flex-none items-center font-semibold text-accent-foreground ">
                                        {data.visibility == "3" ? t('Public') : t('Private')}
                                    </Text>
                                </Skeleton>
                            </Row>
                        </View>

                        <View className="flex-row sm:flex-col gap-2 w-full">
                            <Skeleton className='h-9 w-full' rounded='rounded-lg' visible={isSkeleton}>
                                {oMenuItemPrimary}
                                {!!oMenuItemSecondary && <View className={`${!!oMenuItemPrimary && 'sm:mt-2  ml-2 sm:ml-0'}`}>{oMenuItemSecondary}</View>}
                            </Skeleton>
                        </View>
                    </View>
                </Link>
            </Card>
        );
    }
}