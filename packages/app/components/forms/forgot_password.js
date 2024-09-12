import { View, Row, ScrollView } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useState, useContext } from 'react'
import { getFormFieldByData } from 'app/lib/form-helpers'
import { useLayoutData } from 'app/context/layout'
import { FeedbackHaptics, getAlert } from 'app/lib/util'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import { Platform } from 'react-native'
import { Text } from 'app/design/typography'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import Card from 'app/ui/molecules/card'
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { appSetting, stripTags } from 'app/lib/util'
import { useWindowDimensions } from 'react-native'
import { Keyboard } from 'react-native';
import { useFormContext } from 'react-hook-form';

export default function FormComments(props) {

    const formContext = useFormContext();
    const { t } = useTranslation();
    const [showImage, setShowImage] = useState(false)
    const [responseId, setResponseId] = useState(0)
    const [imageSource, setImageSource] = useState([])
    const { setLayoutData } = useLayoutData()
    let { currentUser, setCurrentUser } = useCurrentUser()
    const windowDimensions = useWindowDimensions();

    const isSmall = windowDimensions.width < 640 ? true : false;
    const isWeb = Platform.OS === 'web'
    const isIos = Platform.OS === 'ios'

    const handlePress = () => {
        Keyboard.dismiss();
        props.handleSubmit();
    };

    const header = <Row className=' w-full justify-between items-center'>
        <View className=''><Button onPress={() => { setShowImage(null) }} variant='outline' rounded startDecorator="X" /></View>
        <View className='w-full flex-auto items-center justify-center'><Text className="text-neutral-700 dark:text-neutral-200 text-xl font-bold">Restore password</Text></View>
        <View className=' '>
            <Button onPress={() => { handlePress() }} variant='primary' rounded startDecorator="PaperPlane" />
        </View>
    </Row>

    return (
        <>
            <Modal
                title={isSmall ? header : t("Restore password")}
                onVisible={showImage}
                outerClickClose={false}
                {...(!isSmall && { onClose: () => setShowImage(null) })}
                padding='sm:p-4 sm:pb-0'
                transparent={true}
                headerBorder={true}
            >

                <KbAvoidingView offset={isIos ? 56 : 72}>
                    <View className='justify-between mb-2 h-full  '>
                        <ScrollView className="w-full h-full flex-1">
                            <View className="w-full  flex-col px-2 ">
                                <Text className="text-black dark:text-white text-base">Enter your account email address to get a password-reset link.</Text>
                                {getFormFieldByData(props.data.inputs['email'], props.handleSubmit, 'default')}


                                <View className='hidden sm:flex'>
                                    {/* <Button onPress={() => { handlePress() }} variant='primary' disabled={text!='' ? false : true}   startDecorator="PaperPlane" title="Post" />*/}
                                    {getFormFieldByData(props.data.inputs['do_submit'], props.handleSubmit, 'default',)}
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </KbAvoidingView>
            </Modal>
            <Button
                            title="Forgot password?"
                            variant="link"
                            fullWidth
                            size="sm"
                            onPress={() => { setShowImage(true) }}

                        />
            
                
        </>
    )
}

