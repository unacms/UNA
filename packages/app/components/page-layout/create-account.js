import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName, DataByName } from 'app/components/block'
import { getPageWidth } from 'app/lib/util'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform, Keyboard } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AuthPanel from 'app/ui/molecules/auth'
import { Icon, IconSet } from 'app/icons'
import { IconSet as IconSetDefault } from 'app/icons.default'
import * as Haptics from 'expo-haptics'
import { appSetting } from 'app/lib/util'

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
    const cardClassName = 'animate-slidein mx-auto w-full max-w-lg ' // flex-auto removed

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

    return (
        <KbAvoidingView style={{ flex: 1 }}>
            {isWeb ? (
                <View
                    className={
                        ' flex-col justify-center mx-auto w-full ' +
                        appSetting('layout', 'max_width')
                    }
                >
                    <View className="w-full lg:flex-row max-w-7xl gap-y-[32px] mx-auto py-[64px] lg:pt-0"
                    accessible={true} >
                                    <View className="my-auto flex-col flex-auto">
                                        <View className="flex-col p-4 lg:p-8 flex-auto w-full items-center lg:items-start gap-y-2 my-auto">
                                        <View className=" w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] mx-auto lg:mx-0 duration-300">
                                    {appStatic('join_image')}
                                </View>
                                <View className="flex-col items-center lg:items-start gap-y-[16px] sm:gap-y-[24px]">
                                <Text
                                    accessible={true}
                                    accessibilityRole="heading"
                                    aria-level={1}
                                    className="text-4xl lg:text-5xl xl:text-6xl text-center lg:text-start tracking-tight font-bold text-neutral-800 dark:text-neutral-200 text-pretty duration-300 max-w-md sm:max-w-2xl "
                                >
                                    {isAllowJoin
                                        ? 'Join ' +
                                          appSetting('app', 'title') +
                                          ' Now !'
                                        : 'Request Invitation'}
                                </Text>
                                <Text
                                    accessible={true}
                                    accessibilityRole="text"
                                    className="text-base lg:text-lg xl:text-xl mb-8 text-neutral-600 dark:text-neutral-400"
                                >
                                    {isAllowJoin
                                        ? t('Create an account to get started')
                                        : t(
                                              'Registration is by invitation only.'
                                          )}
                                </Text>
                                </View>
                               
                            </View>
                       
                        </View>
                        <View className=" max-w-md sm:max-w-lg w-full flex-auto mx-auto p-[16px] flex flex-col gap-y-[16px]">
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
                                     
                                    <Text className="text-base mt-[16px] font-semibold text-neutral-800 dark:text-neutral-200 text-center">Already have an account?</Text> 
                            <Link className="w-full" href="/login">
                                <Button
                                            onPress={triggerHaptics}
                                            title="Sign in"
                                            startDecorator="LogIn"
                                            size="lg"
                                            fullWidth
                                        />
                            </Link>
                        </View>
                    </View>
                    <View className=" w-full p-4 border-t border-bdr dark:border-bdr-d">
                        <View className="mx-auto">
                            {appStatic('components_footer')}
                        </View>
                    </View>
                </View>
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
