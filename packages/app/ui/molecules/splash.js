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
import { KeyboardAvoidingView } from 'react-native'
import AuthPanel from 'app/ui/molecules/auth';
import Link from 'app/ui/atoms/link'
import * as Haptics from 'expo-haptics';

const triggerHaptics = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
};

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

    const isIos = Platform.OS === 'ios'

    const accountForm = BlockDataByName(props.data, 'system:create_account_form');

    const isInvite = accountForm.content[0].type !== 'form';

    const forms = {
        signup: isInvite ? { name: 'bx_invites:get_block_form_request', title: 'Request invitation', button: 'Login', icon: 'LogIn', action: 'login', link: '/login' } : { name: 'system:create_account_form', title: 'Create new account', button: 'Login', icon: 'LogIn', action: 'login', link: '/login' },
        fp: { name: 'system:forgot_password', title: 'Restore password' },
        login: { name: 'system:login_form', title: 'Account', button: 'Create new account', icon: 'UserRoundPlus', action: 'signup', link: '/create-account', }
    };

    const defaultFormData = forms[defaultForm];
    const modalFormData = forms[modalForm];

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
                <View className=" w-full h-full pt-2 sm:pt-0 mx-auto">

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
               
                addClassName=" animate-slidein flex-col w-full max-w-xl mx-auto  "
            >

                <BlockByServiceName name={defaultFormData.name} data={props.data} formProps={{ auto_focus: false, hide_errors: true, button_full_width: true }} />
                
                <View className="border-t border-bdr dark:border-bdr-d mt-[16px] pt-[16px] gap-y-[8px]">
                    <Link href={defaultFormData.link}><Button
                        onPress={triggerHaptics}
                        title={defaultFormData.button}
                        startDecorator={defaultFormData.icon}
                        size="base"
                        fullWidth
                    /* onPress={() => {
                         setDefaultForm(defaultForm == 'login' ? 'signup' : 'login')

                     }}*/
                    /></Link>
                    <AuthPanel className="" />
                </View>
                
            </Card>

        </>
    )

    if (!isWeb) {
        return (
            <View className="flex-1 bg-screen-light dark:bg-screen-dark"> 
                <KbAvoidingView className="flex-1" behavior="padding" keyboardVerticalOffset={0}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                        <View className="w-full flex-auto max-w-lg mx-auto p-4 items-center">
                            <View className="mb-8 items-center">
                                {appStatic('splash_text')}
                            </View>
                            {cnt}
                        </View>
                    </ScrollView>
                </KbAvoidingView>
            </View>
        )
    }

    return (

        <View className={' flex-col justify-center mx-auto ' + appSetting('layout', 'max_width')}>
            <View className=" w-full lg:flex-row max-w-7xl mx-auto py-16 ">
                <View className=" w-full items-center  lg:items-start my-auto  flex-col flex-auto text-primary dark:text-primary-d">
                    {/*{appStatic('splash_image')}*/}
                    {appStatic('splash_text')}
                </View>
                <View className=" max-w-lg w-full flex-auto mx-auto p-4">
                    {cnt}
                </View>
            </View>
            <View className=" w-full p-4 border-t border-bdr dark:border-bdr-d">
                <View className="mx-auto">
                    {appStatic('components_footer')}
                </View>
            </View>
        </View>

    )
}
