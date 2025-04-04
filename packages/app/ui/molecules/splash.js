import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button, Modal } from 'app/design/controls'
import Card from 'app/components/card'
import { useState, useEffect } from 'react'
import { appSetting, BlockDataByName, LAYOUT_BREAKPOINTS, asyncStorageGet } from 'app/lib/util'
import { Platform, Keyboard } from 'react-native'
import { useWindowDimensions } from 'react-native'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { appStatic } from 'app/lib/app-static'
import { BlockByServiceName } from 'app/components/block'

export default function Splash(props) {
    const isWeb = Platform.OS == 'web'
    const [defaultForm, setDefaultForm] = useState(false)
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const checkFirstLaunch = async () => {
            const hasLaunched = await asyncStorageGet('layout:visited');
            hasLaunched === null ? setDefaultForm('signup') : setDefaultForm('login')
        }
        checkFirstLaunch();
    }, []);

    useEffect(() => {
        // Subscribe to keyboard events
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true); // Set to true when the keyboard is shown
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardVisible(false); // Set to false when the keyboard is hidden
            }
        );

        // Cleanup the event listeners when the component unmounts
        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    const [modalForm, setModalForm] = useState(false)
    const [isCreateAccountSubmit, setIsCreateAccountSubmit] = useState(false)

    const windowDimensions = useWindowDimensions()
    const isIos = Platform.OS === 'ios'
    const isSmall = windowDimensions.width < LAYOUT_BREAKPOINTS.sm ? true : false

    const accountForm = BlockDataByName(props.data, 'system:create_account_form')
    const useInvite = false; //TODO accountForm == 'form' ? false : true

    const forms = {
        signup: { name: 'system:create_account_form', title: 'Create new account', button: 'Login', icon: 'LogIn', action: 'login' },
        fp: { name: 'system:forgot_password', title: 'Restore password' },
        invite: { name: 'bx_invites:get_block_form_request', title: 'Request invitation', button: 'Login', icon: 'LogIn', action: 'login' },
        login: { name: 'system:login_form', title: 'Log in', button: 'Create new account', icon: 'UserPlus', action: 'signup' }
    };

    const defalulFormData = forms[defaultForm];
    const modalFormData = forms[modalForm];

    const headerCreateAccount = (
        <Row className=" w-full justify-between items-center">
            <View className="">
                <Button
                    onPress={() => {
                        setModalForm(false)
                    }}
                    variant="outline"
                    rounded
                    startDecorator="X"
                />
            </View>
            <View className="w-full flex-auto items-center justify-center">
                <Text className="text-neutral-700 dark:text-neutral-200 text-xl font-bold">
                    {modalFormData?.title}
                </Text>
            </View>
            <View className=" ">
                <Button
                    onPress={() => {
                        setIsCreateAccountSubmit(Date.now())
                    }}
                    variant="primary"
                    rounded
                    startDecorator="SendHorizontal"
                />
            </View>
        </Row>
    )

    if (!defaultForm)
        return null;

    const cnt = (
        <>
            <Modal
                title={modalFormData?.title}
                onVisible={!!modalForm}
                outerClickClose={false}
                {...(true && { onClose: () => setModalForm(false) })}
                transparent={true}
                headerBorder={true}
            >
                <View className=" w-full h-full pt-2 sm:pt-0 ">

                    <KbAvoidingView
                        offset={isIos ? 56 : 72}
                        className="flex-1 w-full h-full"
                    >
                        <ScrollView className="w-full h-full flex-1 overflow-visible">
                            <View className="w-full px-4 sm:p-0 ">
                                <BlockByServiceName name={modalFormData?.name} formProps={{ hide_errors: true, button_full_width: true }} data={props.data} isSubmit={isCreateAccountSubmit} />
                            </View>
                        </ScrollView>
                    </KbAvoidingView>
                </View>
            </Modal>
                    <Card
                        rounded=" rounded-[24px] "
                        addClassName="flex-col gap-y-3 p-6 w-full max-w-xl mx-auto "
                    >
                        <BlockByServiceName name={defalulFormData.name} data={props.data} formProps={{ auto_focus:false, hide_errors: true, button_full_width: true }} />
                        <Button
                            title="Forgot password?"
                            variant="link"
                            fullWidth
                            size="sm"
                            onPress={() => {
                                setModalForm('fp')
                            }}
                        />
                        <View className="border-t border-bdr dark:border-bdr-d pt-4 sm:pt-6 ">
                            <Button
                                title={defalulFormData.button}
                                startDecorator={defalulFormData.icon}
                                size="base"
                                fullWidth
                                onPress={() => {
                                    setModalForm(defalulFormData.action)
                                }}
                            />
                        </View>
                    </Card>
        </>
    )

    if (!isWeb) {
        return (
            <View className="justify-around flex-1">


                <KbAvoidingView className="flex-1">
                    <ScrollView>
                        {!isKeyboardVisible && <View className="items-center my-8 ">
                            <View className="w-60 items-center ">{appStatic('logo_native')}</View>
                            <View className="my-4  mx-12">
                                {appStatic('splash_text')}  
                            </View>
                        </View>}
                        {cnt}
                    </ScrollView>
                </KbAvoidingView>

            </View>
        )
    }

    return (
        
            <View className={' flex-col ' + appSetting('layout', 'max_width')}>
                <View className=" max-w-7xl mx-auto md:flex-row my-6 ">
                    <View className=" max-w-lg md:max-w-none items-center md:items-start my-auto p-4 sm:p-6 flex-col gap-y-8 flex-auto">            
                        {appStatic('splash_image')}  
                        {appStatic('splash_text')}  
                    </View>
                    <View className=" w-full flex-auto max-w-lg mx-auto p-4 sm:p-6">                 
                        {cnt}
                    </View>
                </View>
                <View className=" w-full p-4 border-t border-bdr dark:border-bdr-d">
                    <View className=" max-w-7xl mx-auto">
                        {appStatic('components_footer')}
                    </View>
                </View>
            </View>
        
    )
}
