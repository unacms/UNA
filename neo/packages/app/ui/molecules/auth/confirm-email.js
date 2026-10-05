import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { NeoButton, NeoButtonLink, Input } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user'
import { useState, useRef, useEffect } from 'react'
import Msg from 'app/ui/molecules/dialogs/msg';
import { fetcher } from 'app/lib/fetcher';
import { useTranslation } from 'react-i18next';
import { FormError } from 'app/components/form-fields/_field';
import Redirect from 'app/ui/atoms/redirect';
import { storageClear, appSetting } from 'app/lib/util';
import { Platform } from 'react-native';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from 'app/ui/molecules/page/card';
import { useRouter, redirectTo } from 'app/lib/hooks/router'
import { clearAllPageCache } from 'app/lib/cache/clear-page-cache'
import { resetAllTabHistory } from 'app/lib/navigation/tab-history'
import { resolvePostConfirmUrl } from 'app/lib/platform/session-cleanup'

export default function ElementConfirmEmail(props) {
    const isWeb = Platform.OS == 'web'
    let { currentUser, setCurrentUser } = useCurrentUser();
    const [showMsg, setShowMsg] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [inputError, setInputError] = useState(false);
    const redirectdRef = useRef();
    const router = useRouter();
    const { t } = useTranslation();
    // page data the post-confirm refresh started from (props.data comes from layouts)
    const refreshFromRef = useRef(null);

    // Web, same page: unlock only once the page data is fetched again with the confirmed session,
    // otherwise the page loaded before confirmation shows up (stale join state etc).
    useEffect(() => {
        if (!refreshFromRef.current || props.data === refreshFromRef.current) return;
        refreshFromRef.current = null;
        setCurrentUser({ confirmed: true, confirm_pending: false });
    }, [props.data, setCurrentUser]);

    const handleConfirm = async () => {
        // second param: we understand { result, redirect } (old apps get plain true)
        const sRequest = '/api.php?r=system/confirm_email/TemplServiceAccount&params[]=' + inputValue + '&params[]=1';
        // keep the lock (layouts) while confirming: sockets fired by the confirmation may report a confirmed user first
        setCurrentUser({ confirm_pending: true });
        const sResponse = await fetcher(sRequest);
        // true, or { result, redirect } when the server tells where to go after confirmation
        if (sResponse.data == true || sResponse.data?.result) {
            const nextUrl = sResponse.data?.redirect || resolvePostConfirmUrl(props.url);
            storageClear();
            clearAllPageCache();
            resetAllTabHistory();
            if (isWeb) {
                const next = new URL(nextUrl, document.location.href);
                const samePage = next.pathname + next.search === document.location.pathname + document.location.search;
                if (samePage && props.data) {
                    // already there (e.g. home showing the right group): refetch instead of a reload
                    refreshFromRef.current = props.data;
                    router.refresh();
                } else if (samePage) {
                    document.location.reload();
                } else {
                    document.location = nextUrl;
                }
            } else {
                setCurrentUser({
                    confirmed: true,
                    confirm_pending: false,
                });
                // Native previously stayed on whatever deep link was under the
                // confirm lock (often previous account's /g/...), so force a clean route.
                redirectTo(router, nextUrl, '/tab0');
            }
        }
        else {
            setCurrentUser({ confirm_pending: false });
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
                            <CardTitle>{t("Verify your email address")}</CardTitle>
                            <CardDescription>
                                {t("Enter the verification code we sent to your email.")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="gap-4">
                            <Msg onVisible={showMsg} title={"New verification code emailed"} handleOk={() => { setShowMsg(false) }} />
                            <View className='gap-4'>
                                <Row className='w-full gap-3 items-center'>
                                    <View className='flex-auto'>
                                        <Input placeholder={t("Enter verification code")} value={inputValue} onChangeText={(value) => { setInputValue(value) }} />
                                    </View>
                                    <NeoButton
                                        style="borderedProminent"
                                        controlSize="regular"
                                        label={t("Verify")}
                                        onPress={() => handleConfirm()}
                                        classNames={{ root: 'self-center' }}
                                    />
                                </Row>
                                {inputError && <FormError errorText={t("Code invalid")} />}
                                <View className="flex-row items-center justify-center w-full">
                                    <View className="flex-1 h-px w-full bg-secondary dark:bg-muted-foreground" />
                                    <Text className="mx-4 text-xs text-muted-foreground  font-normal">{t('OR')}</Text>
                                    <View className="flex-1 h-px w-full bg-secondary dark:bg-muted-foreground" />
                                </View>
                                <View className="gap-y-2 w-full">
                                    <NeoButton
                                        style="bordered"
                                        controlSize="regular"
                                        label={t("Resend verification email")}
                                        onPress={pressBack}
                                        width="fill"
                                    />
                                    <NeoButtonLink
                                        href="/logout"
                                        style="bordered"
                                        controlSize="regular"
                                        label={t("Sign out")}
                                        width="fill"
                                    />
                                </View>
                            </View>
                        </CardContent>
                    </Card>
                </View>
            </View>
        </View>
    );
}
