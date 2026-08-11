import { useMemo, useRef } from 'react'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { tp, appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Card } from 'app/ui/molecules/page/card'
import Redirect from 'app/ui/atoms/redirect'
import ProfilesList from 'app/ui/molecules/profile/profile_list'
import { useTranslation } from 'react-i18next';
import { getUnitMenuItems } from 'app/customization/functions';
import Profile from 'app/ui/molecules/profile/profile'
import Badge from 'app/ui/molecules/profile/badge'

export default function Unit(props) {
    const { t } = useTranslation();
    const data = props.data;
    const redirectdRef = useRef();

    const handleClick = (event, sUrl) => {
        event.preventDefault();

        redirectdRef.current.redirect(sUrl);
    };

    const friendsLabel = data.members_count > 0 ? tp("members", data?.members_count) : ''

    const { oMenuItemPrimary, oMenuItemSecondary, oMenuItemDelete } = useMemo(() => {
        return getUnitMenuItems(props.unitType, data, handleClick, t, props.module);
    }, [props.unitType, data, handleClick, t]);

    switch (props.unitType) {
        case 'list':
            return getList();
        default:
            return getBase();
    }

    function getBase() {
        const bShowProfilePic = appSetting('cover', 'show_pic_by_module', 'bx_spaces')

        return (
            <>
                <Redirect ref={redirectdRef} />
                <Card padding="p-1">
                    <Link className="web:group " href={data.url}>
                        <View className="flex-row sm:flex-col p-1">
                            <View className="aspect-square sm:aspect-video w-1/3 sm:w-full rounded-lg overflow-hidden items-center justify-center bg-muted-foreground/20">
                                <Image
                                    {...data.cover}
                                    alt={data.title}
                                    view="cover"
                                    className="absolute u-cover rounded-lg"
                                    sizes='auto'
                                />

                            </View>
                            {!!oMenuItemDelete && <View className="absolute right-2 top-2">{oMenuItemDelete}</View>}
                            <View className="p-2 flex-auto items-between justify-between ">
                                <View>
                                    <Row className="items-center gap-2">
                                        {bShowProfilePic && (
                                            <Profile
                                                url_avatar={data?.image?.src}
                                                displayType="unit_wo_info"
                                                displaySize="base"
                                                display_name={data.title}
                                                id={data.id || data.title}
                                            />
                                        )}
                                        <Text
                                            numberOfLines={1}
                                            className="flex-auto text-base leading-tight tracking-tight font-semibold text-secondary-foreground web:group-hover:text-foreground "
                                        >
                                            {data.title}
                                        </Text>
                                    </Row>
                                    <Row className="items-center h-5 my-3">


                                        <View className="mr-2  h-5">
                                            <ProfilesList
                                                data={
                                                    data.members_list
                                                }
                                                showEmpty={false}
                                                maxCount={3}
                                                displaySize="2xs"
                                            />

                                        </View>
                                        {
                                            <Text className="truncate text-xs leading-tight flex-auto text-muted-foreground">
                                                {friendsLabel}
                                            </Text>
                                        }

                                        <Badge
                                            data={{
                                                text: data.visibility != "3" ? "Private" : "Public",
                                                icon: data.visibility != "3" ? "Lock" : "Globe",
                                                color: data.visibility != "3" ? "gray" : "blue"
                                            }}
                                            size="xs"
                                            className="flex-none"
                                        />
                                    </Row>
                                </View>
                                <View className="flex-row  sm:flex-col  w-full">
                                    {oMenuItemPrimary}
                                    {!!oMenuItemSecondary && <View className={`${!!oMenuItemPrimary && 'sm:mt-2  ml-2 sm:ml-0'}`}>{oMenuItemSecondary}</View>}
                                </View>
                            </View>
                        </View>
                    </Link>
                </Card>
            </>
        );
    }

    function getList() {
        return (
            <Link href={data.url} emulate={true}>
                <View
                    className=" flex-row  web:duration-200 rounded-xl active:opacity-50 items-center "
                >
                    <View className="p-1.5">
                        <Profile
                            url_avatar={data?.image?.src}
                            displayType="unit_wo_info"
                            displaySize="sm"
                            display_name={data.title}
                        /></View>
                    <View className="flex-row justify-between flex-auto items-center">
                        <Text numberOfLines={2} className="text-sm  px-1.5 leading-tight font-semibold text-secondary-foreground ">
                            {data.title}
                        </Text>
                    </View>
                </View>
            </Link>

        );
    }
}
