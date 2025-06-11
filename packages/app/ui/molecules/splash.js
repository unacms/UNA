import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Card from 'app/components/card'
import { useState, useEffect } from 'react'
import { appSetting } from 'app/lib/util'
import { Platform, useColorScheme, StyleSheet } from 'react-native'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth'
import Link from 'app/ui/atoms/link'
import * as Haptics from 'expo-haptics'
// import { LinearGradient } from 'expo-linear-gradient';
import { BlockByName } from 'app/components/block'
import { useRouter } from 'app/lib/hooks/router';
import SvgFile from 'app/ui/molecules/svg-file';
import MenuFooter from 'app/components/nav/menu-footer';
import { SvgXml } from 'react-native-svg';

const triggerHaptics = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
}

export default function Splash(props) {
    const router = useRouter();
    const isWeb = Platform.OS == 'web'
    const colorScheme = useColorScheme();

    const gradientColors = colorScheme === 'dark'
        ? ['rgba(23, 37, 84, 1)', 'rgba(23, 37, 84, 0.5)']
        : ['rgba(239, 246, 255, 1)', 'rgba(191, 219, 254, 1)'];

    if (!isWeb) {
        return (
            <View className="flex-1 bg-primary-50 dark:bg-primary-950">
                <KbAvoidingView className="flex-1" behavior="padding" keyboardVerticalOffset={0}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                        <View className="w-full flex-col lg:flex-row gap-y-[32px] mx-auto max-w-[1440px]">
                            <View className="flex-col items-center lg:items-start gap-x-[32px] flex-auto px-[16px] sm:px-[32px] xl:px-[64px] lg:pb-[64px]" accessible={true}>
                                <View className="w-[50%] max-w-[360px] aspect-square">
                                    <SvgFile 
                                        src_dark="splash-dark.svg" 
                                        src_default="splash-light.svg" 
                                        alt="Splash screen illustration"
                                    />
                                </View>
                                <View className="flex-auto items-center lg:items-start gap-y-[16px] sm:gap-y-[24px] max-w-md sm:max-w-lg lg:max-w-3xl">
                                    {appStatic('splash_text')}
                                </View>
                            </View>
                            <View className="max-w-xl w-full flex-auto mx-auto px-[16px] pb-[16px] sm:p-[32px] lg:p-[64px] my-auto gap-y-[16px]">
                                <Card addClassName="flex-col w-full mx-auto">
                                    <View className="flex-col pb-[24px] gap-y-[8px]">
                                        <Text className="text-2xl leading-none tracking-tight font-bold text-neutral-800 dark:text-neutral-200">Log in to {appSetting('app', 'title')}</Text>
                                        <Text className="text-sm text-neutral-600 dark:text-neutral-400">Use your email and password to sign in</Text>
                                    </View>
                                    <BlockByName 
                                        name="system:login_form" 
                                        data={props.data} 
                                        formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} 
                                    />
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
                        <View className="w-full h-[64px]">
                            <View className="mx-auto my-auto">
                                {appStatic('components_footer')}
                            </View>
                        </View>
                    </ScrollView>
                </KbAvoidingView>
            </View>
        )
    }

    const SvgBackground = () => (
        <svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 1200 800' preserveAspectRatio="xMidYMid slice">
            <rect fill='#E7FFF4' width='1200' height='800'/>
            <defs>
                <radialGradient id='a' cx='0' cy='800' r='800' gradientUnits='userSpaceOnUse'>
                    <stop offset='0' stopColor='#f0ffc8'/>
                    <stop offset='1' stopColor='#f0ffc8' stopOpacity='0'/>
                </radialGradient>
                <radialGradient id='b' cx='1200' cy='800' r='800' gradientUnits='userSpaceOnUse'>
                    <stop offset='0' stopColor='#d6fff6'/>
                    <stop offset='1' stopColor='#d6fff6' stopOpacity='0'/>
                </radialGradient>
                <radialGradient id='c' cx='600' cy='0' r='600' gradientUnits='userSpaceOnUse'>
                    <stop offset='0' stopColor='#dbb6ff'/>
                    <stop offset='1' stopColor='#dbb6ff' stopOpacity='0'/>
                </radialGradient>
                <radialGradient id='d' cx='600' cy='800' r='600' gradientUnits='userSpaceOnUse'>
                    <stop offset='0' stopColor='#E7FFF4'/>
                    <stop offset='1' stopColor='#E7FFF4' stopOpacity='0'/>
                </radialGradient>
                <radialGradient id='e' cx='0' cy='0' r='800' gradientUnits='userSpaceOnUse'>
                    <stop offset='0' stopColor='#FFA9A9'/>
                    <stop offset='1' stopColor='#FFA9A9' stopOpacity='0'/>
                </radialGradient>
                <radialGradient id='f' cx='1200' cy='0' r='800' gradientUnits='userSpaceOnUse'>
                    <stop offset='0' stopColor='#C4FEFF'/>
                    <stop offset='1' stopColor='#C4FEFF' stopOpacity='0'/>
                </radialGradient>
            </defs>
            <rect fill='url(#a)' width='1200' height='800'/>
            <rect fill='url(#b)' width='1200' height='800'/>
            <rect fill='url(#c)' width='1200' height='800'/>
            <rect fill='url(#d)' width='1200' height='800'/>
            <rect fill='url(#e)' width='1200' height='800'/>
            <rect fill='url(#f)' width='1200' height='800'/>
        </svg>
    );

    const SvgBackgroundDark = () => (
        <svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%' viewBox='0 0 1200 800' preserveAspectRatio="xMidYMid slice">
            <rect fill='#0D1117' width='1200' height='800'/>
            <defs>
                <radialGradient id='a' cx='0' cy='800' r='800' gradientUnits='userSpaceOnUse'>
                    <stop offset='0' stopColor='#002d2d'/>
                    <stop offset='1' stopColor='#002d2d' stopOpacity='0'/>
                </radialGradient>
                <radialGradient id='b' cx='1200' cy='800' r='800' gradientUnits='userSpaceOnUse'>
                    <stop offset='0' stopColor='#0c373a'/>
                    <stop offset='1' stopColor='#0c373a' stopOpacity='0'/>
                </radialGradient>
                <radialGradient id='c' cx='600' cy='0' r='600' gradientUnits='userSpaceOnUse'>
                    <stop offset='0' stopColor='#210f4a'/>
                    <stop offset='1' stopColor='#210f4a' stopOpacity='0'/>
                </radialGradient>
                <radialGradient id='d' cx='600' cy='800' r='600' gradientUnits='userSpaceOnUse'>
                    <stop offset='0' stopColor='#0D1117'/>
                    <stop offset='1' stopColor='#0D1117' stopOpacity='0'/>
                </radialGradient>
                <radialGradient id='e' cx='0' cy='0' r='800' gradientUnits='userSpaceOnUse'>
                    <stop offset='0' stopColor='#4a0f0f'/>
                    <stop offset='1' stopColor='#4a0f0f' stopOpacity='0'/>
                </radialGradient>
                <radialGradient id='f' cx='1200' cy='0' r='800' gradientUnits='userSpaceOnUse'>
                    <stop offset='0' stopColor='#0f3a4a'/>
                    <stop offset='1' stopColor='#0f3a4a' stopOpacity='0'/>
                </radialGradient>
            </defs>
            <rect fill='url(#a)' width='1200' height='800'/>
            <rect fill='url(#b)' width='1200' height='800'/>
            <rect fill='url(#c)' width='1200' height='800'/>
            <rect fill='url(#d)' width='1200' height='800'/>
            <rect fill='url(#e)' width='1200' height='800'/>
            <rect fill='url(#f)' width='1200' height='800'/>
        </svg>
    );

    return (
        <View className="flex-col justify-center w-full">
            <View className="w-full flex-auto">
                <View className="absolute w-full inset-0">
                    {colorScheme === 'dark' ? <SvgBackgroundDark /> : <SvgBackground />}
                </View>
                <View className="w-full lg:flex-row gap-y-[16px] mx-auto pt-[64px] pb-[32px] max-w-[1440px]">
                    <View className="my-auto flex-col items-center lg:items-start gap-x-[32px] flex-auto px-[16px] sm:px-[32px] xl:px-[64px] lg:pb-[64px]" accessible={true}>
                        <View className="w-[50%] max-w-[360px] aspect-square">
                            <SvgFile src_dark="splash-dark.svg" src_default="splash-light.svg" alt="Splash screen illustration" />
                        </View>
                        <View className="flex-auto items-center lg:items-start gap-y-[16px] sm:gap-y-[24px] max-w-md sm:max-w-lg lg:max-w-3xl">
                            {appStatic('splash_text')}
                        </View>
                    </View>
                    <View className="flex-col-reverse lg:flex-col max-w-xl w-full flex-auto mx-auto px-[16px] pb-[16px] sm:p-[32px] lg:py-[64px] my-auto gap-y-[16px]">
                            <View className="relative">
                                <View className="absolute top-4 flex shadow rounded-3xl w-full h-full bg-neutral-500 dark:bg-black blur-lg opacity-20 dark:opacity-50"></View>
                                <Card rounded="rounded-3xl" addClassName="border border-white overflow-hidden dark:border-bdrcard-d">
                                    <View className="flex-col pb-[24px] gap-y-[8px]">
                                        <Text className="text-center lg:text-start text-2xl leading-none tracking-tight font-bold text-neutral-800 dark:text-neutral-200">Log in to {appSetting('app', 'title')}</Text>
                                        <Text className="hidden lg:block text-sm text-neutral-600 dark:text-neutral-400">Use your email and password to sign in</Text>
                                    </View>
                                    <BlockByName 
                                        name="system:login_form" 
                                        data={props.data} 
                                        formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} 
                                    />
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
                            </View>
                        <View className="lg:hidden flex-col">
                            <Text className="text-base text-neutral-600 dark:text-neutral-400 text-center">Already have an account?</Text>
                        </View>
                        <View className="flex-col py-[16px] gap-y-[16px]">
                            <Text className="hidden lg:block text-base text-neutral-600 dark:text-neutral-400 text-center">Don't have an account?</Text>
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
            </View>
            <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-[64px] items-center justify-center"/>
        </View>
    )
}
