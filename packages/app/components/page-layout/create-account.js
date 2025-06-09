import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName, DataByName } from 'app/components/block'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform, useColorScheme } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AuthPanel from 'app/ui/molecules/auth'
import * as Haptics from 'expo-haptics'
import { appSetting } from 'app/lib/util'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import ScrollList from 'app/ui/molecules/scroll_list'
import { LinearGradient } from 'expo-linear-gradient';
import SvgFile from 'app/ui/molecules/svg-file';

const triggerHaptics = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
}

export default function PageLayout(props) {
    const { t } = useTranslation()
    const joinData = DataByName(props.data, props.blocks.form_join)
    const isAllowJoin = joinData.content[0].type == 'form'
    const isWeb = Platform.OS === 'web'
    const cardClassName = 'flex-col w-full mx-auto'
    const refer = useRef();
    const colorScheme = useColorScheme();

    // Animation values
    const textBlockOpacity = useSharedValue(0);
    const textBlockTranslateY = useSharedValue(20);
    const imageOpacity = useSharedValue(0);
    const imageTranslateY = useSharedValue(-20);

    const imageAnimatedStyle = useAnimatedStyle(() => ({
        opacity: imageOpacity.value,
        transform: [{ translateY: imageTranslateY.value }],
    }), [imageOpacity, imageTranslateY]);

    const textBlockAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textBlockOpacity.value,
        transform: [{ translateY: textBlockTranslateY.value }],
    }), [textBlockOpacity, textBlockTranslateY]);

    useEffect(() => {
        // Animate image
        imageOpacity.value = withDelay(200, withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) }));
        imageTranslateY.value = withDelay(200, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) }));

        // Animate text blocks
        textBlockOpacity.value = withDelay(400, withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) }));
        textBlockTranslateY.value = withDelay(400, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) }));
    }, []); // Empty dependency array since we only want to run this once on mount

    const gradientColors = colorScheme === 'dark'
        ? ['rgba(23, 37, 84, 1)', 'rgba(23, 37, 84, 0.5)']
        : ['rgba(239, 246, 255, 1)', 'rgba(191, 219, 254, 1)'];

    const content = isWeb ? (
        <View className="flex-col justify-center w-full">
            <View className="w-full flex-auto bg-gradient-to-b from-primary-50 to-primary-200 dark:from-primary-950 dark:to-primary-950/50">
                <View className="w-full lg:flex-row gap-y-[16px] mx-auto pt-[64px] pb-[64px] max-w-[1440px]">
                    <View className="my-auto flex-col items-center lg:items-start gap-x-[32px] flex-auto px-[16px] sm:px-[32px] xl:px-[64px] lg:pb-[64px]" accessible={true}>
                        <Animated.View style={imageAnimatedStyle} className="w-[50%] max-w-[360px] aspect-square">
                            <SvgFile src_dark="create-account-dark.svg" src_default="create-account-light.svg" alt="Create account illustration"/>
                        </Animated.View>
                        <View className="flex-col items-center lg:items-start gap-y-[16px] sm:gap-y-[24px]">
                            <Animated.View style={textBlockAnimatedStyle} className="flex-auto items-center lg:items-start gap-y-[16px] sm:gap-y-[24px] max-w-md sm:max-w-lg lg:max-w-3xl">
                                <Text
                                    accessible={true}
                                    accessibilityRole="heading"
                                    aria-level={1}
                                    className="text-4xl lg:text-5xl xl:text-6xl text-center lg:text-start tracking-tight font-bold text-neutral-800 dark:text-neutral-200 text-pretty duration-300"
                                >
                                    {isAllowJoin
                                        ? 'Join ' + appSetting('app', 'title') + ' Now !'
                                        : 'Request Invitation'}
                                </Text>
                            </Animated.View>
                            <Animated.View style={textBlockAnimatedStyle} className="flex-auto items-center lg:items-start gap-y-[16px] sm:gap-y-[24px] max-w-md sm:max-w-lg lg:max-w-3xl">
                                <Text
                                    accessible={true}
                                    accessibilityRole="text"
                                    className="text-base lg:text-lg xl:text-xl text-center lg:text-start text-neutral-600 dark:text-neutral-400 text-pretty duration-300"
                                >
                                    {isAllowJoin
                                        ? t('Create an account to get started. It\'s quick and easy to join')
                                        : t('Registration is by invitation only. Please use invitation code to join.')}
                                </Text>
                            </Animated.View>
                        </View>
                    </View>
                    <View className="max-w-xl w-full flex-auto mx-auto px-[16px] pb-[16px] sm:p-[32px] lg:py-[64px] my-auto duration-300 gap-y-[16px]">
                        <Animated.View style={imageAnimatedStyle} className="rounded-[25px] p-[1px] bg-gradient-to-b from-primary-200 to-primary-300 dark:from-neutral-800 dark:to-primary-950 shadow-[0_0_16px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
                            <Card>
                                <View className="hidden lg:flex flex-col pb-[24px] gap-y-[8px]">
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
                        </Animated.View>
                        <Animated.View style={textBlockAnimatedStyle} className="flex-col">
                            <Text className="text-base mt-[16px] text-neutral-600 dark:text-neutral-400 text-center pb-[16px]">Already have an account?</Text>
                            <Link className="w-full" href="/login">
                                <Button
                                    onPress={triggerHaptics}
                                    title="Sign in"
                                    startDecorator="LogIn"
                                    variant="default"
                                    size="lg"
                                    fullWidth
                                />
                            </Link>
                        </Animated.View>
                    </View>
                </View>
            </View>
            <View className="w-full h-[64px]">
                <View className="mx-auto my-auto">
                    {appStatic('components_footer')}
                </View>
            </View>
        </View>
    ) : (
        <View className="flex-col justify-center w-full p-4">
            <Card>
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
            <View className="w-full h-[64px]">
                <View className="mx-auto my-auto">
                    {appStatic('components_footer')}
                </View>
            </View>
        </View>
    );

    return (
        <KbAvoidingView style={{ flex: 1 }} offset={isWeb ? undefined : 0}>
            {isWeb ? (
                <ScrollList
                    refer={refer}
                    content={content}
                    pageData={props.data}
                    headerHeight={0}
                    contentType="ScrollList"
                />
            ) : (
                <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
                    <ScrollList
                        refer={refer}
                        content={content}
                        pageData={props.data}
                        headerHeight={0}
                        contentType="ScrollList"
                    />
                </LinearGradient>
            )}
        </KbAvoidingView>
    )
}
