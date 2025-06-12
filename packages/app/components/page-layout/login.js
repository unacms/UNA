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
import { useRef } from 'react'
import SvgFile from 'app/ui/molecules/svg-file';
import MenuFooter from 'app/components/nav/menu-footer';
import AnimatedView from 'app/ui/molecules/animated-view';

const triggerHaptics = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
};

export default function PageLayout(props) {
    const isWeb = Platform.OS === 'web';
    const refer = useRef();
    const colorScheme = useColorScheme();

    const content = isWeb ? (<View className={'flex-col justify-center mx-auto w-full ' + getPageWidth(props.uri, props.data?.config)}>
        <View className="w-full lg:flex-row max-w-7xl mx-auto my-auto lg:py-16 min-h-[100vh]">
            <View className="hidden my-auto flex-col flex-auto">
                <AnimatedView className="w-[50%] max-w-[360px] aspect-square">
                    <SvgFile 
                        src_dark="login-dark.svg" 
                        src_default="login-light.svg" 
                        alt="Login illustration"
                    />
                </AnimatedView>
                <AnimatedView direction="up" className="flex-auto items-center lg:items-start gap-y-[16px] sm:gap-y-[24px] max-w-md sm:max-w-lg lg:max-w-3xl">
                    {appStatic('components_logincontent')}
                </AnimatedView>
            </View>
            <View className="max-w-xl w-full flex-auto mx-auto p-[16px] sm:p-[32px] lg:p-[64px] my-auto gap-y-[16px]">
                <AnimatedView>
                    <View className="relative">
                        <View className="absolute top-4 flex shadow rounded-3xl w-full h-full bg-neutral-500 dark:bg-black blur-lg opacity-20 dark:opacity-50"></View>
                        <Card rounded="rounded-3xl" addClassName="border border-white overflow-hidden dark:border-bdrcard-d">
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
                    </View>
                </AnimatedView>
                <AnimatedView direction="up" className="flex-col">
                    <Text className="text-base py-[16px] text-neutral-600 dark:text-neutral-400 text-center">Don't have an account?</Text>
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
                </AnimatedView>
            </View>
        </View>
        <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-[64px] items-center justify-center"/>
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
                        <Card>
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
                        <AnimatedView direction="up" className="flex-col">
                            <Text className="text-base py-[16px] text-neutral-600 dark:text-neutral-400 text-center">Don't have an account?</Text>
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
                        </AnimatedView>
                    </View>
                </ScrollView>
            )}
        </KbAvoidingView>
    );
}
