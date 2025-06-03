import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button, Modal } from 'app/design/controls'
import Card from 'app/components/card'
import { useState, useEffect } from 'react'
import {
    appSetting,
    BlockDataByName,
    LAYOUT_BREAKPOINTS,
    asyncStorageGet,
} from 'app/lib/util'
import { Platform, Keyboard, useColorScheme } from 'react-native'
import { useWindowDimensions } from 'react-native'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { appStatic } from 'app/lib/app-static'
import { BlockByServiceName } from 'app/components/block'
import { KeyboardAvoidingView } from 'react-native'
import AuthPanel from 'app/ui/molecules/auth'
import Link from 'app/ui/atoms/link'
import * as Haptics from 'expo-haptics'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlockByName } from 'app/components/block'
import { useRouter } from 'app/lib/hooks/router';

const triggerHaptics = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
}

export default function Splash(props) {
    const router = useRouter();
    const isWeb = Platform.OS == 'web'
    const [defaultForm, setDefaultForm] = useState(false)
    const [isKeyboardVisible, setKeyboardVisible] = useState(false)
    const [modalForm, setModalForm] = useState(false)
    const [isCreateAccountSubmit, setIsCreateAccountSubmit] = useState(false)

    // Animation values for web - MOVED TO TOP
    const textBlockOpacity = useSharedValue(0);
    const textBlockTranslateY = useSharedValue(20); // Start slightly lower
    const imageOpacity = useSharedValue(0);
    const imageTranslateY = useSharedValue(-20); // Start slightly higher (slide from top)

    const colorScheme = useColorScheme(); // Added for dark mode detection

    useEffect(() => {
        const checkFirstLaunch = async () => {
            const hasLaunched = await asyncStorageGet('layout:visited')
            hasLaunched === null
                ? setDefaultForm('signup')
                : setDefaultForm('login')
        }
        checkFirstLaunch()
    }, [])

    useEffect(() => {
        // Subscribe to keyboard events
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true) // Set to true when the keyboard is shown
            }
        )
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardVisible(false) // Set to false when the keyboard is hidden
            }
        )

        // Cleanup the event listeners when the component unmounts
        return () => {
            keyboardDidHideListener.remove()
            keyboardDidShowListener.remove()
        }
    }, [])

    useEffect(() => {
        // Animation for the text block (heading + main text) - Conditionally run effect logic
        textBlockOpacity.value = withDelay(200, withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) }));
        textBlockTranslateY.value = withDelay(200, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) }));

        // Animation for the image, staggered after the text
        imageOpacity.value = withDelay(500, withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) }));
        imageTranslateY.value = withDelay(500, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) }));
    }, []); // Changed dependency array to [] for one-time mount animation

    const textBlockAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: textBlockOpacity.value,
            transform: [{ translateY: textBlockTranslateY.value }],
        };
    }, [textBlockOpacity, textBlockTranslateY]);

    const imageAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: imageOpacity.value,
            transform: [{ translateY: imageTranslateY.value }],
        };
    }, [imageOpacity, imageTranslateY]);

    const isIos = Platform.OS === 'ios'

    const accountForm = BlockDataByName(
        props.data,
        'system:create_account_form'
    )

    const isInvite = accountForm.content[0].type !== 'form'

    const forms = {
        signup: isInvite
            ? {
                  name: 'bx_invites:get_block_form_request',
                  title: 'Request invitation',
                  button: 'Login',
                  icon: 'LogIn',
                  action: 'login',
                  link: '/login',
              }
            : {
                  name: 'system:create_account_form',
                  title: 'Create new account',
                  button: 'Login',
                  icon: 'LogIn',
                  action: 'login',
                  link: '/login',
              },
        fp: { name: 'system:forgot_password', title: 'Restore password' },
        login: {
            name: 'system:login_form',
            title: 'Account',
            button: 'Create new account',
            icon: 'UserRoundPlus',
            action: 'signup',
            link: '/create-account',
        },
    }

    const defaultFormData = forms[defaultForm]
    const modalFormData = forms[modalForm]

    if (!defaultForm) return null

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
                                <BlockByServiceName
                                    name={modalFormData?.name}
                                    formProps={{
                                        hide_errors: true,
                                        button_full_width: true,
                                    }}
                                    data={props.data}
                                    isSubmit={isCreateAccountSubmit}
                                />
                            </View>
                        </ScrollView>
                    </KbAvoidingView>
                </View>
            </Modal>
            <Card addClassName=" animate-slidein flex-col w-full mx-auto ">
                <BlockByServiceName
                    name={defaultFormData.name}
                    data={props.data}
                    formProps={{
                        auto_focus: false,
                        hide_errors: true,
                        button_full_width: true,
                    }}
                />
                <View className="border-t border-bdr dark:border-bdr-d mt-[16px] pt-[16px] gap-y-[12px]">
                    <Link href={defaultFormData.link}>
                        <Button
                            onPress={triggerHaptics}
                            title={defaultFormData.button}
                            startDecorator={defaultFormData.icon}
                            size="lg"
                            fullWidth
                            /* onPress={() => {
                         setDefaultForm(defaultForm == 'login' ? 'signup' : 'login')

                     }}*/
                        />
                    </Link>
                    <AuthPanel className="" />
                </View>
            </Card>
        </>
    )

    if (!isWeb) {
        const gradientColors = colorScheme === 'dark'
            ? ['rgba(15, 25, 40, 1)', 'rgba(23, 37, 84, 0.5)'] // primary-900 to primary-950/50
            : ['rgba(239, 246, 255, 1)', 'rgba(191, 219, 254, 1)']; // primary-50 to primary-200

        return (
            <LinearGradient
                colors={gradientColors}
                style={{ flex: 1 }}
            >
                <KbAvoidingView
                    className="flex-1"
                    behavior="padding"
                    keyboardVerticalOffset={0}
                >
                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: 'center',
                        }}
                    >
                        <View className="w-full flex-col lg:flex-row gap-y-[32px] mx-auto max-w-[1440px] ">
                        <View className="flex-col items-center lg:items-start gap-x-[32px] flex-auto px-[16px] sm:px-[32px] xl:px-[64px] lg:pb-[64px] "
                        accessible={true}>
                            <Animated.View style={imageAnimatedStyle} className=" w-[80%] max-w-[360px] aspect-square ">
                                {appStatic('splash_image')}
                            </Animated.View>
                            <Animated.View style={[styles.heading, { marginBottom: 8, alignItems: 'center' }]} className=" flex-auto items-center lg:items-start gap-y-[16px] sm:gap-y-[24px] max-w-md sm:max-w-lg lg:max-w-3xl">
                                {appStatic('splash_text')}
                            </Animated.View>
                            
                        </View>
                        <View className=" max-w-xl w-full flex-auto mx-auto px-[16px] pb-[16px] sm:p-[32px] lg:p-[64px] my-auto duration-300 gap-y-[16px]">
                            <Card addClassName=" animate-slidein flex-col w-full mx-auto ">
                                <View className="flex-col pb-[24px] gap-y-[8px]">
                                    <Text className="text-2xl leading-none tracking-tight font-bold text-neutral-800 dark:text-neutral-200">Log in to {appSetting('app', 'title')}</Text>
                                    <Text className="text-sm text-neutral-600 dark:text-neutral-400">Use your email and password to sign in</Text>
                                </View>
                                <BlockByName name={forms.login.name} data={props.data} formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} />
                                <View className="mt-[8px]">
                                    <Link href="/forgot-password">
                                        <Button
                                            onPress={triggerHaptics}
                                            title="Forgot password?"
                                            variant="link"
                                            fullWidth
                                            size="sm"
                                        />
                                    </Link>
                                </View>
                                <View className="flex items-center justify-center gap-y-[8px] border-t border-bdr dark:border-bdr-d mt-[8px] pt-[16px]">
                                    
                                    <AuthPanel className="" />
                                    
                                </View>
                                
                               
                            </Card>
                            <Text className="text-base text-neutral-600 dark:text-neutral-400 text-center">Don't have an account?</Text> 
                            <Button
                                onPress={() => {
                                    triggerHaptics();
                                    router.push('/create-account');
                                }}
                                title="Create new account"
                                startDecorator="UserRoundPlus"
                                variant="accent"
                                size="lg"
                                fullWidth
                            />
                        </View>
                        </View>


                        <View className=" w-full h-[64px]">
                        <View className="mx-auto my-auto">
                            {appStatic('components_footer')}
                        </View>
                    </View>
                        
                    </ScrollView>
                </KbAvoidingView>
            </LinearGradient>
        )
    }

    return (
        <View className=" flex-col justify-center w-full ">
            <View className="w-full flex-auto bg-gradient-to-b from-primary-50 to-primary-200 dark:from-primary-900 dark:to-primary-950/50">
                <View className="w-full lg:flex-row gap-y-[32px] mx-auto pt-[64px] lg:pt-0 max-w-[1440px] ">
                    <View
                        className="my-auto flex-col items-center lg:items-start gap-x-[32px] flex-auto px-[16px] sm:px-[32px] xl:px-[64px] lg:pb-[64px] "
                        accessible={true}
                    >
                        <Animated.View style={imageAnimatedStyle} className=" w-[80%] max-w-[360px] aspect-square">
                            {appStatic('splash_image')}
                        </Animated.View>
                        <Animated.View style={textBlockAnimatedStyle} className=" flex-auto items-center lg:items-start gap-y-[16px] sm:gap-y-[24px] max-w-md sm:max-w-lg lg:max-w-3xl">
                            {appStatic('splash_text')}
                        </Animated.View>
                    </View>
                    <View className=" max-w-xl w-full flex-auto mx-auto px-[16px] pb-[16px] sm:p-[32px] lg:p-[64px] my-auto duration-300 gap-y-[16px]">
                            <Card addClassName=" animate-slidein flex-col w-full mx-auto ">
                                <View className="flex-col pb-[24px] gap-y-[8px]">
                                    <Text className="text-2xl leading-none tracking-tight font-bold text-neutral-800 dark:text-neutral-200">Log in to {appSetting('app', 'title')}</Text>
                                    <Text className="text-sm text-neutral-600 dark:text-neutral-400">Use your email and password to sign in</Text>
                                </View>
                                <BlockByName name={forms.login.name} data={props.data} formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} />
                                <View className="mt-[8px]">
                                    <Link href="/forgot-password">
                                        <Button
                                            onPress={triggerHaptics}
                                            title="Forgot password?"
                                            variant="link"
                                            fullWidth
                                            size="sm"
                                        />
                                    </Link>
                                </View>
                                <View className="flex items-center justify-center gap-y-[8px] border-t border-bdr dark:border-bdr-d mt-[8px] pt-[16px]">
                                    
                                    <AuthPanel className="" />
                                    
                                </View>
                                
                               
                            </Card>
                            <Text className="text-base text-neutral-600 dark:text-neutral-400 text-center">Don't have an account?</Text> 
                            <Button
                                onPress={() => {
                                    triggerHaptics();
                                    router.push('/create-account');
                                }}
                                title="Create new account"
                                startDecorator="UserRoundPlus"
                                variant="accent"
                                size="lg"
                                fullWidth
                            />
                    </View>
                </View>
            </View>
            <View className=" w-full h-[64px]">
                <View className="mx-auto my-auto">
                    {appStatic('components_footer')}
                </View>
            </View>
        </View>
    )
}

const styles = { // Basic styles, can be expanded in a stylesheet
    heading: { // Example, assuming splash_text contains a heading and main text
         // Potentially target specific text elements if splash_text structure allows
    },
    // Add other styles as needed
};
