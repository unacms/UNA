import { useCardData } from 'app/context/card'
import Link from 'app/ui/atoms/link'
import Profile from 'app/ui/molecules/profile'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import { useState } from 'react';
import { Button, Modal } from 'app/design/controls'
import Recommendation from 'app/ui/molecules/recommendations'

export default function Unit(props) {
    let data = props.data

    const { cardData } = useCardData()

    if (!!cardData?.hidden) return

    let sMeta = <></>

    const [state, setState] = useState(false);

    const processInvitation = async (request_url) => {
        await fetcher(request_url);
        setState(true);
    }

    if (state) return


    if (data?.meta?.items?.[0] == 'invitation')
        sMeta = (
            <Row className='gap-x-2'>
                <Button title="Accept" size="sm" variant="secondary" rounded onPress={() => { processInvitation(data.callback_accept) }} />
                <Button title="Decline" size="sm" variant="secondary" rounded onPress={() => { processInvitation(data.callback_decline) }} />
            </Row>
        )

    if (data?.meta?.items?.[0]?.data)
        sMeta = (
            <Recommendation
                {...{ ...data?.meta?.items?.[0]?.data, primary: false }}
                params={{
                    button_full_width: true,
                    button_variant: 'secondary',
                    button_size: 'sm',
                }}
            />
        )
    return (
        <Link href={data.url} emulate={true}>
            <View
                className=" flex-row p-2 rounded-xl web:active:opacity-90 web:hover:bg-secondary items-center "
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

                    <View className="flex-none">{sMeta}</View>
                </View>

            </View>
        </Link>
    )
}
