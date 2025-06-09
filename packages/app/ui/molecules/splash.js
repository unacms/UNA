import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Card from 'app/components/card'
import { useState, useEffect } from 'react'
import { appSetting } from 'app/lib/util'
import { Platform, useColorScheme } from 'react-native'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth'
import Link from 'app/ui/atoms/link'
import * as Haptics from 'expo-haptics'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlockByName } from 'app/components/block'
import { useRouter } from 'app/lib/hooks/router';
import SvgFile from 'app/ui/molecules/svg-file';
import MenuFooter from 'app/components/nav/menu-footer';

const triggerHaptics = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
}

export default function Splash(props) {
    const router = useRouter();
    const isWeb = Platform.OS == 'web'
    const colorScheme = useColorScheme();

    // Animation values
    const textBlockOpacity = useSharedValue(0);
    const textBlockTranslateY = useSharedValue(20);
    const imageOpacity = useSharedValue(0);
    const imageTranslateY = useSharedValue(-20);

    useEffect(() => {
        // Animation for the text block
        textBlockOpacity.value = withDelay(200, withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) }));
        textBlockTranslateY.value = withDelay(200, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) }));

        // Animation for the image
        imageOpacity.value = withDelay(500, withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) }));
        imageTranslateY.value = withDelay(500, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) }));
    }, []);

    const textBlockAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textBlockOpacity.value,
        transform: [{ translateY: textBlockTranslateY.value }],
    }), [textBlockOpacity, textBlockTranslateY]);

    const imageAnimatedStyle = useAnimatedStyle(() => ({
        opacity: imageOpacity.value,
        transform: [{ translateY: imageTranslateY.value }],
    }), [imageOpacity, imageTranslateY]);

    const gradientColors = colorScheme === 'dark'
        ? ['rgba(23, 37, 84, 1)', 'rgba(23, 37, 84, 0.5)']
        : ['rgba(239, 246, 255, 1)', 'rgba(191, 219, 254, 1)'];

    if (!isWeb) {
        return (
            <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
                <KbAvoidingView className="flex-1" behavior="padding" keyboardVerticalOffset={0}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                        <View className="w-full flex-col lg:flex-row gap-y-[32px] mx-auto max-w-[1440px]">
                            <View className="flex-col items-center lg:items-start gap-x-[32px] flex-auto px-[16px] sm:px-[32px] xl:px-[64px] lg:pb-[64px]" accessible={true}>
                                <Animated.View style={imageAnimatedStyle} className="w-[50%] max-w-[360px] aspect-square">
                                    <SvgFile src_dark="splash-dark.svg" src_default="splash-light.svg" alt="Splash screen illustration" />
                                </Animated.View>
                                <Animated.View style={textBlockAnimatedStyle} className="flex-auto items-center lg:items-start gap-y-[16px] sm:gap-y-[24px] max-w-md sm:max-w-lg lg:max-w-3xl">
                                    {appStatic('splash_text')}
                                </Animated.View>
                            </View>
                            <View className="max-w-xl w-full flex-auto mx-auto px-[16px] pb-[16px] sm:p-[32px] lg:p-[64px] my-auto duration-300 gap-y-[16px]">
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
            </LinearGradient>
        )
    }

    return (
        <View className="flex-col justify-center w-full">
            <View className="w-full flex-auto bg-gradient-to-b from-primary-50 to-primary-200 dark:from-primary-950 dark:to-primary-950/50">
                <View className="w-full lg:flex-row gap-y-[16px] mx-auto pt-[64px] pb-[32px] max-w-[1440px]">
                    <View className="my-auto flex-col items-center lg:items-start gap-x-[32px] flex-auto px-[16px] sm:px-[32px] xl:px-[64px] lg:pb-[64px]" accessible={true}>
                        <Animated.View style={imageAnimatedStyle} className="w-[50%] max-w-[360px] aspect-square">
                            <SvgFile src_dark="splash-dark.svg" src_default="splash-light.svg" alt="Splash screen illustration" />
                        </Animated.View>
                        <Animated.View style={textBlockAnimatedStyle} className="flex-auto items-center lg:items-start gap-y-[16px] sm:gap-y-[24px] max-w-md sm:max-w-lg lg:max-w-3xl">
                            {appStatic('splash_text')}
                        </Animated.View>
                    </View>
                    <View className="flex-col-reverse lg:flex-col max-w-xl w-full flex-auto mx-auto px-[16px] pb-[16px] sm:p-[32px] lg:py-[64px] my-auto duration-300 gap-y-[16px]">
                        <Animated.View style={imageAnimatedStyle} className="rounded-[25px] p-[1px] bg-gradient-to-b from-primary-200 to-primary-300 dark:from-neutral-800 dark:to-primary-950 shadow-[0_0_16px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
                            <Card>
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
                        </Animated.View>
                        <Animated.View style={textBlockAnimatedStyle} className="lg:hidden flex-col">
                            <Text className="text-base text-neutral-600 dark:text-neutral-400 text-center">Already have an account?</Text>
                        </Animated.View>
                        <Animated.View style={textBlockAnimatedStyle} className="flex-col py-[16px] gap-y-[16px]">
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
                        </Animated.View>
                    </View>
                </View>
            </View>
            <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-[64px] items-center justify-center"/>
        </View>
    )
}
