import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Input } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user';
import { useState, useRef } from 'react'
import Msg from 'app/ui/molecules/msg';
import { fetcher } from 'app/lib/fetcher';
import { useTranslation } from 'react-i18next';
import { FormError } from 'app/components/form-fields/_field';
import Redirect from 'app/ui/atoms/redirect';
import { storageClear, appSetting } from 'app/lib/util';
import { Platform } from 'react-native';
import Link from 'app/ui/atoms/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from 'app/ui/molecules/card'

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
        <View className={`${appSetting('layout', 'page_content_width_default')} ${appSetting('layout', 'page_content_padding_default')} lg:flex-row mx-auto my-auto`}>
            <View className="max-w-xl w-full flex-auto mx-auto p-4 sm:p-8 my-auto gap-y-4">
                <View>
                    <Redirect ref={redirectdRef} />
                    <Card padding="p-6  gap-6">
                        <CardHeader>
                            <CardTitle>{t("Unconfirmed email address")}</CardTitle>
                            <CardDescription>
                                {t("Please check your email")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="gap-4">
                            <Msg onVisible={showMsg} title={"New verification code emailed"} handleOk={() => { setShowMsg(false) }} />
                            <View className='gap-y-4'>
                                <Row className='w-full gap-x-2 items-start justify-between'>
                                    <View className='flex-auto'>
                                        <Input placeholder={t("Verification code")} value={inputValue} onChangeText={(value) => { setInputValue(value) }} />
                                    </View>
                                    <Button variant="primary" size="lg" title={t("Confirm")} onPress={() => handleConfirm()} />
                                </Row>
                                {inputError && <FormError errorText={t("Code invalid")} />}
                                <View className="flex-row items-center justify-center w-full">
                                    <View className="flex-1 h-px w-full bg-secondary dark:bg-muted-foreground" />
                                    <Text className="mx-4 text-xs text-muted-foreground  font-normal">OR</Text>
                                    <View className="flex-1 h-px w-full bg-secondary dark:bg-muted-foreground" />
                                </View>
                                <View className="gap-y-2 w-full">
                                    <Button size="lg" title={t("Resend email")} onPress={pressBack} fullWidth />
                                    <Link href="/logout" className="w-full">
                                        <Button size="lg" title={t("Sign out")} fullWidth />
                                    </Link>
                                </View>
                            </View>
                        </CardContent>
                    </Card>
                </View>
            </View>
        </View>
    );
}
