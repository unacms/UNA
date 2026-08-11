import { useMemo, useRef } from 'react'
import { useCardData } from 'app/context/card'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { tp } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { CardList } from 'app/ui/molecules/page/card'
import Redirect from 'app/ui/atoms/redirect'
import ProfilesList from 'app/ui/molecules/profile/profile_list'
import { useTranslation } from 'react-i18next';
import { getUnitMenuItems } from 'app/customization/functions';
import { View, Row } from 'app/design/view'

export default function Unit(props) {
    const { t } = useTranslation();
    const data = props.data;
    const redirectdRef = useRef();

    const { cardData, setCardData } = useCardData();

    const handleClick = (event, sUrl) => {
        event.preventDefault();

        redirectdRef.current.redirect(sUrl);
    };

    const { oMenuItemPrimary, oMenuItemSecondary } = useMemo(() => {
        return getUnitMenuItems(props.unitType, data, handleClick, t, props.module);
    }, [props.unitType, data, handleClick, t]);

    const friendsLabel = data.members_count > 0 ? tp("members", data?.members_count) : ''

    if (
        !!cardData?.hidden &&
        props.unitType == "person_friends_recommendations"
    )
        return;

    return (
        <>
            <Redirect ref={redirectdRef} />
            <CardList padding='p-2' >
                <Link className="web:group " href={data.url}>
                    <View className="flex-row sm:flex-col p-1">
                        <View className="aspect-square sm:aspect-video w-1/3 sm:w-full rounded-xl overflow-hidden items-center justify-center bg-muted-foreground/20">
                            <Image
                                {...data.cover}
                                alt={data.title}
                                view="cover"
                                className="absolute u-cover rounded-lg"
                                sizes='auto'
                            />
                        </View>
                        <View className="p-3  flex-auto items-between justify-between ">
                            <View>
                            <Text numberOfLines={2} className="text-card-foreground tracking-tight web:hover:text-foreground web:hover:underline leading-tight font-semibold">

                                    {data.title}
                                </Text>
                                <Row className="items-center h-6 my-3">
                                    <View className="mr-2  h-6">
                                        <ProfilesList
                                            data={
                                                data.members_list
                                            }
                                            showEmpty={false}
                                            maxCount={3}
                                            displaySize="xs"
                                        />

                                    </View>
                                    {
                                        <Text className="truncate text-xs leading-tight flex-auto text-muted-foreground ">
                                            {friendsLabel}
                                        </Text>
                                    }
                                </Row>
                            </View>
                            <View className="flex-row  sm:flex-col  w-full">
                                {oMenuItemPrimary}
                                {!!oMenuItemSecondary && <View className={`${!!oMenuItemPrimary && 'sm:mt-2  ml-2 sm:ml-0'}`}>{oMenuItemSecondary}</View>}
                            </View>
                        </View>
                    </View>
                </Link>
            </CardList>
        </>
    );
}
