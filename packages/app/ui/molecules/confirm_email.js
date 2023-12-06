import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Input, InputRounded, Modal } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user';
import { useState, useContext, useRef } from 'react'
import Msg from 'app/ui/molecules/msg';
import { fetcher } from 'app/lib/fetcher';
import { useTranslation } from 'react-i18next';
import Card from 'app/ui/molecules/card'

export default function ElementConfirmEmail(props) {
    let { currentUser, setCurrentUser } = useCurrentUser();
    const [showMsg, setShowMsg] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [inputError, setInputError] = useState(false);
    const { t } = useTranslation();

    const handleConfirm = async () => {
        const sRequest = '/api.php?r=system/confirm_email/TemplServiceAccount&params[]='+inputValue;
        const sResponse = await fetcher(sRequest);
        if (sResponse.data == true){
            const updatedUser = {
                ...currentUser, 
                confirmed: true,
            };
        
            setCurrentUser(updatedUser);
        }
        else{
            setInputError(true);
        }   
    }

    const pressBack = async () => {
        const sRequest = '/api.php?r=system/email_confirmation/TemplServiceAccount&resend[]=1';
        const sResponse = await fetcher(sRequest);
        setShowMsg(true);  
    };

    return (
        <>
            <Msg onVisible={showMsg} title={"letter sent"} handleOk ={() => {setShowMsg(false)}} />
            <View className='mx-auto max-w-xl p-4'>
            <Card rounded margin=' p-4 '>       
                <View className='mb-4 '>
                    <Text className="text-base text-center">{t("Your email address is unconfirmed. Please, check your email for a confirmation letter and enter confirmation code below.")}</Text>
                </View>
                <View className='gap-y-4'>
                    <Row className='w-full gap-x-4 items-start justify-between'>
                        <View className='flex-auto'>
                            <Input  placeholder={t("Input verification code")} value={inputValue} onChangeText={(value) => {setInputValue(value)}}  />  
                            { inputError && <View className="label" >
                                <Text className="ml-0.5 mt-0.5 label-text-alt text-sm text-red-600 animate-pulse dark:text-red-400 font-medium">{t("Code invalid")}</Text>
                            </View> }
                        </View>
                        <Button variant="primary" title={t("Confirm account")} onPress={()=> handleConfirm()} />
                    </Row>
                    <Button variant="text" title={t("Send the verification letter again.")}  onPress={pressBack} />
                </View>
            </Card>    
           </View>
        </>
    );
}
