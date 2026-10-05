import { View } from 'app/design/view';
import { ButtonLink, Input } from 'app/design/controls';
import { useFetch } from 'app/lib/hooks/use-fetch';
import { useState } from 'react'
import Profile from 'app/ui/molecules/profile/profile'
import { Text } from 'app/design/typography'
import Card, { CardTitle } from 'app/ui/molecules/page/card'

import { BlockWrapper } from 'app/components/block-wrapper'
import { useTranslation } from 'react-i18next'

export default function InviteInContext({ blockWrapperProps }) {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState("");
    // Look up from the 4th character; a shorter code shows nothing (not the last match).
    const requestUrl = inputValue.length > 3
        ? `/api.php?r=bx_invites/get_context_by_code/&params[]=${encodeURIComponent(inputValue)}&params[]={"initiate": 1}`
        : null;
    const { data: sResponse } = useFetch(requestUrl);
    const res = (requestUrl && sResponse?.data) || {};

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Text className=" text-foreground  text-base mb-3">{t('Enter your group code to join a community and start connecting.')}</Text>
            <Input placeholder={t('Enter 5-digit code')} value={inputValue} onChangeText={(value) => { setInputValue(value) }} />
            {res.message && <Text>{res.message}</Text>}
            {res?.result && (
                <View className='mt-1'><Card>
                    <View>
                        <CardTitle>You're joining:</CardTitle>
                        <View className='w-full mt-4 justify-between sm:flex-row gap-y-3'><Profile {...res.data} displayType="unit" size="lg" />
                            <ButtonLink href={res.data.url} variant="primary" size="base" title={t('Continue')} />
                        </View>
                    </View>
                </Card>
                </View>
            )
            }
        </BlockWrapper>
    )

}
