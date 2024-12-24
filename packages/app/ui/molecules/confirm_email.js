import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Input, InputRounded, Modal } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user';
import { useState, useContext, useRef } from 'react'
import Msg from 'app/ui/molecules/msg';
import { fetcher } from 'app/lib/fetcher';
import { useTranslation } from 'react-i18next';
import Card from 'app/ui/molecules/card'
import Redirect from 'app/ui/atoms/redirect';
import { storageClear } from 'app/lib/util';
import { Platform } from 'react-native'
import Link from 'app/ui/atoms/link'

export default function ElementConfirmEmail(props) {
    const isWeb = Platform.OS == 'web'
    let { currentUser, setCurrentUser } = useCurrentUser();
    const [showMsg, setShowMsg] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [inputError, setInputError] = useState(false);
    const redirectdRef = useRef();
    const { t } = useTranslation();
    const handleConfirm = async () => {
        const sRequest = '/api.php?r=system/confirm_email/TemplServiceAccount&params[]=' + inputValue;
        const sResponse = await fetcher(sRequest);
        if (sResponse.data == true) {
            storageClear();
            setCurrentUser({
                confirmed: true,
            });
            if (isWeb)
                document.location = props.url;
        }
        else {
            setInputError(true);
        }
    }

    const pressBack = async () => {
        const sRequest = '/api.php?r=system/email_confirmation/TemplServiceAccount&resend[]=1';
        const sResponse = await fetcher(sRequest);
        setShowMsg(true);
    };

    return (
        <><Redirect ref={redirectdRef} />
            <Msg onVisible={showMsg} title={"New verification code emailed"} handleOk={() => { setShowMsg(false) }} />
            <View className='mx-auto max-w-xl p-4 w-full '>
                <Card rounded margin=' p-4 '>
                    <View className='mb-4 '>
                        <Text className="text-lg text-center mb-2 text-neutral-700 dark:text-neutral-300">{t("Unconfirmed email address")}</Text>
                        <Text className="text-base text-center text-neutral-700 dark:text-neutral-300">{t("Please check your email")}</Text>
                    </View>
                    <View className='gap-y-4'>
                        <Row className='w-full gap-x-4 items-start justify-between'>
                            <View className='flex-auto w-24 lg:w-auto'>
                                <Input placeholder={t("Verification code")} value={inputValue} onChangeText={(value) => { setInputValue(value) }} />
                            </View>
                            <Button variant="primary" title={t("Confirm")} onPress={() => handleConfirm()} />
                        </Row>
                        {inputError && <View className="label" >
                            <Text className="ml-0.5 mt-0.5 label-text-alt text-sm text-red-600 animate-pulse dark:text-red-400 font-medium">{t("Code invalid")}</Text>
                        </View>}
                        <Row className='w-full gap-x-4 items-start justify-between'>
                            <Button variant="link" size="sm" title={t("Resend email")} onPress={pressBack} />
                            <Link href="/logout"><Button variant="link" size="sm" title={t("Sign out")}  /></Link>
                        </Row>
                    </View>
                </Card>
            </View>
        </>
    );
}
