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
import { Platform } from 'react-native';
import Link from 'app/ui/atoms/link';
import { appSetting, getPageWidth } from 'app/lib/util';


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
                document.location = props.url[0] != '/' ? '/' + props.url : props.url;
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
            <View className={`mx-auto ${getPageWidth()} p-4 w-full `}>
                <Card rounded="rounded-3xl" margin="p-4 sm:p-6" addClassName="border border-white overflow-hidden dark:border-bdrcard-d gap-y-6">
                    <View className="flex-col flex-auto gap-y-2 justify-center">
                        <Text className="text-xl sm:text-2xl text-center leading-[none] tracking-tight font-semibold text-neutral-800 dark:text-neutral-200">
                            {t("Unconfirmed email address")}
                        </Text>
                        <Text className="text-sm sm:text-base text-center text-neutral-500">
                            {t("Please check your email")}
                        </Text>
                    </View>
                    <View className='gap-y-4'>
                        <Row className='w-full gap-x-2 items-start justify-between'>
                            <View className='flex-auto'>
                                <Input placeholder={t("Verification code")} value={inputValue} onChangeText={(value) => { setInputValue(value) }} />
                            </View>
                            <Button variant="primary" title={t("Confirm")} onPress={() => handleConfirm()} />
                        </Row>
                        {inputError && <View className="label">
                            <Text className="ml-0.5 mt-0.5 label-text-alt text-sm text-red-600 animate-pulse dark:text-red-400 font-medium">{t("Code invalid")}</Text>
                        </View>}
                        <View className="flex-row items-center justify-center w-full">
                            <View className="flex-1 h-px w-full bg-neutral-200 dark:bg-neutral-500" />
                            <Text className="mx-4 text-xs text-neutral-500 dark:text-neutral-400 font-normal">OR</Text>
                            <View className="flex-1 h-px w-full bg-neutral-200 dark:bg-neutral-500" />
                        </View>
                        <View className="gap-y-2 w-full">
                            <Button variant="link" size="sm" title={t("Resend email")} onPress={pressBack} fullWidth />
                            <Link href="/logout" className="w-full">
                                <Button variant="default" size="base" title={t("Sign out")} fullWidth ring="rounded-xl bg-neutral-300 dark:bg-neutral-950 shadow-sm hover:shadow-none" />
                            </Link>
                        </View>
                    </View>
                </Card>
            </View>
        </>
    );
}
