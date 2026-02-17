import Link from 'app/ui/atoms/link'
import Profile from 'app/ui/molecules/profile'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import { useState } from 'react';
import { Button } from 'app/design/controls'
import Image from 'app/ui/atoms/image'
import ProfilesList from 'app/ui/molecules/profile_list'
import { useTranslation } from 'react-i18next';
import { CardList } from 'app/ui/molecules/card'
import { tp } from 'app/lib/util'

export default function Unit(props) {
    const { t } = useTranslation();
    const [state, setState] = useState(false);

    const data = props.data
    const friendsLabel = data.members_count > 0 ? tp("members", data?.members_count) : ''

    const processInvitation = async (request_url) => {
        await fetcher(request_url);
        setState(true);
    }

    if (state) return

    // for separate page
    if (props.unitType == 'invitations_in_context') {
        return (
            <CardList padding='p-2' className='mb-2 md:mb-0'>
                <Link className="context " href={data.url}>
                    <View className="flex-row sm:flex-col p-1">
                        <View className="aspect-square sm:aspect-video w-1/3 sm:w-full rounded-xl overflow-hidden items-center justify-center bg-neutral-500/20">
                            <Image
                                {...data.cover}
                                alt={data.title}
                                view="cover"
                                className="absolute u-cover rounded-xl"
                                sizes='auto'
                            />

                        </View>
                        <View className="flex-col p-3  flex-auto items-between justify-between ">
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
                                        <Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                                            {friendsLabel}
                                        </Text>
                                    }
                                    <Text className=" bg-primary/10  rounded-md  px-1.5 py-1 text-xs flex-none items-center font-semibold text-neutral-600 dark:text-neutral-400">
                                        {data.visibility != "3" ? t('Private') : t('Public')}
                                    </Text>
                                </Row>
                            </View>
                            <View className="flex-row w-full gap-x-2">

                                {!!data.callback_accept && <Button title="Accept" size="sm" fullWidth variant="primary" onPress={() => { processInvitation(data.callback_accept) }} />}
                                {!!data.callback_decline && <Button title="Decline" size="sm" fullWidth variant="secondary" onPress={() => { processInvitation(data.callback_decline) }} />}
                                {!!data.redirect_url && <Link href={data.redirect_url}><Button title={data.redirect_title} size="sm" fullWidth variant="secondary" /></Link>}
                            </View>
                        </View>
                    </View>
                </Link>
            </CardList>
        )
    }

    return (
        <Link href={data.url} emulate={true}>
            <View
                className=" flex-row p-2 rounded-xl web:active:opacity-90 web:hover:bg-muted/60 items-center max-w-4xl mx-auto w-full"
            >
                <Profile
                    url_avatar={data?.image?.src}
                    displayType="unit_wo_info"
                    displaySize="sm"
                    display_name={data.title}
                />
                <View className="flex-row justify-between flex-auto items-center">
                    <Text numberOfLines={2} className="text-sm  px-1.5 leading-tight font-semibold text-neutral-800 dark:text-neutral-200">
                        {data.title}
                    </Text>
                    <View className="flex-none">
                        <Row className='gap-x-2'>
                            {!!data.callback_accept && <Button title="Accept" size="sm" variant="secondary" rounded onPress={() => { processInvitation(data.callback_accept) }} />}
                            {!!data.callback_decline && <Button title="Decline" size="sm" variant="secondary" rounded onPress={() => { processInvitation(data.callback_decline) }} />}
                            {!!data.redirect_url && <Link href={data.redirect_url}><Button title={data.redirect_title} size="sm" fullWidth variant="secondary" /></Link>}
                        </Row>
                    </View>
                </View>
            </View>
        </Link>
    )
}

