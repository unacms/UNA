import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName, DataByName } from 'app/components/block'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform, Keyboard } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AuthPanel from 'app/ui/molecules/auth'
import * as Haptics from 'expo-haptics'
import { appSetting } from 'app/lib/util'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import ScrollList from 'app/ui/molecules/scroll_list'

const triggerHaptics = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
}


export default function PageLayout(props) {
    const { t } = useTranslation()
    const [isKeyboardVisible, setKeyboardVisible] = useState(false)
    const joinData = DataByName(props.data, props.blocks.form_join)
    const isAllowJoin = joinData.content[0].type == 'form'
    const isWeb = Platform.OS === 'web'
    const cardClassName = ' animate-slidein flex-col w-full mx-auto ' // flex-auto removed
    const refer = useRef();
    const textBlockOpacity = useSharedValue(0);
    const textBlockTranslateY = useSharedValue(20); // Start slightly lower
    const imageOpacity = useSharedValue(0);
    const imageTranslateY = useSharedValue(-20); // Start slightly higher (slide from top)

    const imageAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: imageOpacity.value,
            transform: [{ translateY: imageTranslateY.value }],
        };
    }, [imageOpacity, imageTranslateY]);

    const textBlockAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: textBlockOpacity.value,
            transform: [{ translateY: textBlockTranslateY.value }],
        };
    }, [textBlockOpacity, textBlockTranslateY]);

    useEffect(() => {
        // Animate image
        imageOpacity.value = withDelay(200, withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) }));
        imageTranslateY.value = withDelay(200, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) }));

        // Animate text blocks
        textBlockOpacity.value = withDelay(400, withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) }));
        textBlockTranslateY.value = withDelay(400, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) }));

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
    }, [imageOpacity, imageTranslateY, textBlockOpacity, textBlockTranslateY]);

    const content = isWeb ? (
        <View className="flex-col justify-center w-full ">
            <View className="w-full flex-auto bg-gradient-to-b from-primary-50 to-primary-200 dark:from-primary-950 dark:to-neutral-950 ">
                <View className="w-full lg:flex-row gap-y-[32px] mx-auto pt-[64px] lg:pt-0 max-w-[1440px] ">
                    <View className="my-auto flex-col flex-auto">
                        <View className="my-auto flex-col items-center lg:items-start gap-x-[32px] flex-auto px-[16px] sm:px-[32px] xl:px-[64px] lg:pb-[64px] "
                            accessible={true}>
                            <Animated.View style={imageAnimatedStyle} className="w-[80%] max-w-[360px] aspect-square">
                                {appStatic('join_image')}
                            </Animated.View>
                            <View className="flex-col items-center lg:items-start gap-y-[16px] sm:gap-y-[24px]">
                                <Animated.View style={textBlockAnimatedStyle} className=" flex-auto items-center lg:items-start gap-y-[16px] sm:gap-y-[24px] max-w-md sm:max-w-lg lg:max-w-3xl">
                                    <Text
                                        accessible={true}
                                        accessibilityRole="heading"
                                        aria-level={1}
                                        className="text-4xl lg:text-5xl xl:text-6xl text-center lg:text-start tracking-tight font-bold text-neutral-800 dark:text-neutral-200 text-pretty duration-300"
                                    >
                                        {isAllowJoin
                                            ? 'Join ' +
                                            appSetting('app', 'title') +
                                            ' Now !'
                                            : 'Request Invitation'}
                                    </Text>
                                </Animated.View>
                                <Animated.View style={textBlockAnimatedStyle} className=" flex-auto items-center lg:items-start gap-y-[16px] sm:gap-y-[24px] max-w-md sm:max-w-lg lg:max-w-3xl">
                                    <Text
                                        accessible={true}
                                        accessibilityRole="text"
                                        className="text-base lg:text-lg xl:text-xl text-center lg:text-start text-neutral-600 dark:text-neutral-400 text-pretty duration-300"
                                    >
                                        {isAllowJoin
                                            ? t('Create an account to get started. It\'s quick and easy to join')
                                            : t(
                                                'Registration is by invitation only. Please use invitation code to join.'
                                            )}
                                    </Text>
                                </Animated.View>
                            </View>

                        </View>

                    </View>
                    <View className=" max-w-xl w-full flex-auto mx-auto p-[16px] sm:p-[32px] lg:p-[64px] my-auto duration-300">
                        <Card addClassName={cardClassName}>
                            <View className="flex-col pb-[24px] gap-y-[8px]">
                                <Text className="text-2xl leading-none tracking-tight font-bold text-neutral-800 dark:text-neutral-200">
                                    Create your account
                                </Text>
                                <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                                    It's quick and easy to join
                                </Text>
                            </View>
                            {!isAllowJoin && (
                                <BlockByName
                                    name={props.blocks.form_invitation}
                                    data={props.data}
                                    formProps={{
                                        auto_focus: true,
                                        hide_errors: true,
                                        button_full_width: true,
                                    }}
                                />
                            )}
                            {isAllowJoin && (
                                <BlockByName
                                    name={props.blocks.form_join}
                                    data={props.data}
                                    formProps={{
                                        auto_focus: true,
                                        hide_errors: true,
                                        button_full_width: true,
                                    }}
                                />
                            )}
                            <View className="flex items-center justify-center gap-y-2 border-t border-bdr dark:border-bdr-d mt-[16px] pt-[16px]">

                                <AuthPanel />
                            </View>
                        </Card>

                        <Text className="text-base mt-[16px]  text-neutral-600 dark:text-neutral-400 text-center pb-[16px]">Already have an account?</Text>
                        <Link className="w-full" href="/login">
                            <Button
                                onPress={triggerHaptics}
                                title="Sign in"
                                startDecorator="LogIn"
                                variant="outline"
                                size="lg"
                                fullWidth
                            />
                        </Link>
                    </View>
                </View>
            </View>
            <View className=" w-full p-4 border-t border-bdr dark:border-bdr-d">
                <View className="mx-auto">
                    {appStatic('components_footer')}
                </View>
            </View>
        </View>
    ) : null;


    return (
        <KbAvoidingView style={{ flex: 1 }}>
            {isWeb ? (
                <ScrollList
                    refer={refer}
                    content={content}
                    pageData={props.data}

                    contentType="ScrollList"
                />
            ) : (
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        alignItems: 'center',
                        padding: 16,
                        width: '100%',
                    }}
                >
                    {/* On native, the left content (Join now/Request invitation text etc) is not rendered for create account, similar to login screen */}
                    <Card rounded="rounded-[24px]" addClassName={cardClassName}>
                        <View className="flex-col lg:hidden pb-4">
                            <Text className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                                Create an account
                            </Text>
                        </View>
                        {!isAllowJoin && (
                            <BlockByName
                                name={props.blocks.form_invitation}
                                data={props.data}
                                formProps={{
                                    auto_focus: true,
                                    hide_errors: true,
                                    button_full_width: true,
                                }}
                            />
                        )}
                        {isAllowJoin && (
                            <BlockByName
                                name={props.blocks.form_join}
                                data={props.data}
                                formProps={{
                                    auto_focus: true,
                                    hide_errors: true,
                                    button_full_width: true,
                                }}
                            />
                        )}
                        <View className="flex items-center justify-center pt-4 mt-4 gap-y-2 border-t border-bdr dark:border-bdr-d">
                            <Link className="w-full" href="/login">
                                <Button
                                    onPress={triggerHaptics}
                                    title="Continue with email"
                                    size="base"
                                    fullWidth
                                />
                            </Link>
                            <AuthPanel />
                        </View>
                    </Card>
                </ScrollView>
            )}
        </KbAvoidingView>
    )
}
