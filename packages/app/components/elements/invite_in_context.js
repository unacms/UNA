import { View, Row } from 'app/design/view';
import { ButtonLink, Input } from 'app/design/controls';
import { fetcher } from 'app/lib/fetcher';
import { useState, useEffect } from 'react'
import Profile from 'app/ui/molecules/profile'
import { Text } from 'app/design/typography'
import Card, { CardTitle } from 'app/ui/molecules/card'

import { BlockWrapper } from 'app/components/block-wrapper'

export default function InviteInContext({ blockWrapperProps }) {
    const [inputValue, setInputValue] = useState("");
    const [res, setRes] = useState("");
    //aY9sC

    useEffect(() => {
        (async () => {
            if (inputValue.length > 3) {
                const sResponse = await fetcher(`/api.php?r=bx_invites/get_context_by_code/&params[]=${inputValue}&params[]={"initiate": 1}`);
                setRes(sResponse.data)
            }

        })();

    }, [inputValue]);

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Text className=" text-foreground  text-base mb-3">Enter your group code to join a community and start connecting.</Text>
            <Input placeholder='Enter 5-digit code' value={inputValue} onChangeText={(value) => { setInputValue(value) }} />
            {res.message && <Text>{res.message}</Text>}
            {res?.result && (
                <View className='mt-1'><Card>
                    <View>
                        <CardTitle>You're joining:</CardTitle>
                        <View className='w-full mt-4 justify-between sm:flex-row gap-y-3'><Profile {...res.data} displayType="unit" size="lg" />
                            <ButtonLink href={res.data.url} variant="primary" size="base" title='Continue' />
                        </View>
                    </View>
                </Card>
                </View>
            )
            }
        </BlockWrapper>
    )

}
