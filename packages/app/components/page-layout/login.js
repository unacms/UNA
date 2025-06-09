import { View, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform, useColorScheme } from 'react-native'
import * as Haptics from 'expo-haptics';
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import AuthPanel from 'app/ui/molecules/auth';
import { appSetting, getPageWidth } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import { useRef, useEffect } from 'react'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import SvgFile from 'app/ui/molecules/svg-file';

const triggerHaptics = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
};

export default function PageLayout(props) {
    const isWeb = Platform.OS === 'web';
    const cardClassName = "w-full mx-auto";
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
    }, []);

    const content = isWeb ? (<View className={'flex-col justify-center mx-auto w-full ' + getPageWidth(props.uri, props.data?.config)}>
        <View className="w-full lg:flex-row max-w-7xl mx-auto py-16">
            <View className="hidden my-auto flex-col flex-auto">
                <Animated.View style={imageAnimatedStyle} className="w-[50%] max-w-[360px] aspect-square">
                    <SvgFile src_dark="login-dark.svg" src_default="login-light.svg" alt="Login illustration"/>
                </Animated.View>
                <Animated.View style={textBlockAnimatedStyle} className="flex-auto items-center lg:items-start gap-y-[16px] sm:gap-y-[24px] max-w-md sm:max-w-lg lg:max-w-3xl">
                    {appStatic('components_logincontent')}
                </Animated.View>
            </View>
            <View className="max-w-xl w-full flex-auto mx-auto p-[16px] sm:p-[32px] lg:p-[64px] my-auto duration-300 gap-y-[16px]">
                <Animated.View style={imageAnimatedStyle} className="rounded-[25px] p-[1px] bg-gradient-to-b from-primary-200 to-primary-300 dark:from-neutral-800 dark:to-primary-950 shadow-[0_0_16px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
                    <Card addClassName={cardClassName}>
                        <View className="flex-col pb-[24px] gap-y-[8px]">
                            <Text className="text-2xl leading-none tracking-tight font-bold text-neutral-800 dark:text-neutral-200">Log in to your {appSetting('app', 'title')} account</Text>
                            <Text className="text-sm text-neutral-600 dark:text-neutral-400">Use your email and password to sign in</Text>
                        </View>
                        <BlockByName name={props.blocks.form} data={props.data} formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} />
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
                <Animated.View style={textBlockAnimatedStyle} className="flex-col">
                    <Text className="text-base text-neutral-600 dark:text-neutral-400 text-center">Don't have an account?</Text>
                    <Link className="w-full" href="/create-account">
                        <Button
                            onPress={triggerHaptics}
                            title="Create new account"
                            startDecorator="UserRoundPlus"
                            variant="accent"
                            size="lg"
                            fullWidth
                            icon="UserRoundPlus"
                        />
                    </Link>
                </Animated.View>
            </View>
        </View>
        <View className="w-full p-4 border-t border-bdr dark:border-bdr-d">
            <View className="mx-auto">
                {appStatic('components_footer')}
            </View>
        </View>
    </View>) : null;

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
                <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', padding: 16, width: '100%' }}>
                    <View className="max-w-md sm:max-w-lg w-full flex-auto mx-auto p-[16px] flex flex-col gap-y-[16px]">
                        <Animated.View style={imageAnimatedStyle} className="rounded-[25px] p-[1px] bg-gradient-to-b from-primary-200 to-primary-300 dark:from-neutral-800 dark:to-primary-950 shadow-[0_0_16px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
                            <Card addClassName={cardClassName}>
                                <View className="flex-col pb-[24px] gap-y-[8px]">
                                    <Text className="text-2xl leading-none tracking-tight font-bold text-neutral-800 dark:text-neutral-200">Log in to your {appSetting('app', 'title')} account</Text>
                                    <Text className="text-sm text-neutral-600 dark:text-neutral-400">Use your email and password to sign in</Text>
                                </View>
                                <BlockByName name={props.blocks.form} data={props.data} formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} />
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
                        <Animated.View style={textBlockAnimatedStyle} className="flex-col">
                            <Text className="text-base text-neutral-600 dark:text-neutral-400 text-center">Don't have an account?</Text>
                            <Link className="w-full" href="/create-account">
                                <Button
                                    onPress={triggerHaptics}
                                    title="Create new account"
                                    startDecorator="UserRoundPlus"
                                    variant="accent"
                                    size="lg"
                                    fullWidth
                                    icon="UserRoundPlus"
                                />
                            </Link>
                        </Animated.View>
                    </View>
                </ScrollView>
            )}
        </KbAvoidingView>
    );
}
