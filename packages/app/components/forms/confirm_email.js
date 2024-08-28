import { getFormFieldByData } from 'app/lib/form-helpers'
import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Input, InputRounded, Modal } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user';
import { useState, useEffect, useCallback , useRef } from 'react'
import Msg from 'app/ui/molecules/msg';
import { fetcher } from 'app/lib/fetcher';
import { useTranslation } from 'react-i18next';
import Card from 'app/ui/molecules/card'
import Redirect from 'app/ui/atoms/redirect';
import { subscribe } from 'app/ui/atoms/socket';

export default function FormComments(props) {

    let { currentUser, setCurrentUser } = useCurrentUser();
    const [showMsg, setShowMsg] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [inputError, setInputError] = useState(false);
    const { t } = useTranslation();
    const redirectdRef = useRef();
    const pressBack = async () => {
        const sRequest = '/api.php?r=system/email_confirmation/TemplServiceAccount&resend[]=1';
        const sResponse = await fetcher(sRequest);
        setShowMsg(true);
    };

    useEffect(() => {
        if (currentUser?.account_id)
            subscribe('sys_account_'+currentUser.account_id, 'confirmed', updateAccount);
    }, [currentUser.id])


    
    const updateAccount = useCallback((data) => {
        setCurrentUser(prevUser => ({
            ...prevUser,
            confirmed: true,
        }));
    }, []);

    props.data.inputs['do_submit'].value = 'Confirm';

    return <>
        <Redirect ref={redirectdRef} />
        <Msg onVisible={showMsg} title={"New verification code emailed"} handleOk={() => { setShowMsg(false) }} />
        <View className='mx-auto max-w-xl p-4 w-full '>
            <Card rounded margin=' p-4 '>
                <View className='mb-4 '>
                    <Text className="text-lg text-center mb-2 text-neutral-700 dark:text-neutral-300">{t("Unconfirmed email address")}</Text>
                    <Text className="text-base text-center text-neutral-700 dark:text-neutral-300">{t("Please check your email.")}</Text>
                </View>
                <View className=''>
                    <Row className='w-full items-start justify-between '>
                        <View className='w-2/3 lg:w-5/6 pr-4'>
                            {getFormFieldByData(props.data.inputs['code'], props.handleSubmit, 'custom',  { placeholder: 'Verification code', autoFocus: true})}
                        </View>
                        <Row className='w-1/3 lg:w-1/6 justify-end items-end'>
                            {getFormFieldByData(props.data.inputs['do_submit'], props.handleSubmit, 'custom')}
                        </Row>
                    </Row>
                    {!!currentUser && <View className="font-medium">
                        <Button variant="link" size="sm" title={t("Resend email")} onPress={pressBack} />
                    </View>}
                </View>
            </Card>
        </View>
    </>
}

