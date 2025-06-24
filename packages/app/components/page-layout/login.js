import { View, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics';
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import AuthPanel from 'app/ui/molecules/auth';
import { appSetting, getPageWidth } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import { useRef } from 'react'
import SvgFile from 'app/ui/molecules/svg-file';
import MenuFooter from 'app/components/nav/menu-footer';
import AnimatedView from 'app/ui/atoms/animated-view';

export default function PageLayout(props) {
    const isWeb = Platform.OS === 'web';
    const refer = useRef();


    const content = isWeb ? (<View className={'flex-col justify-center mx-auto w-full min-h-[calc(100vh-64px)]' + getPageWidth(props.uri, props.data?.config)}>
        <View className="w-full lg:flex-row max-w-7xl mx-auto my-auto lg:py-16 ">
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
            <View className="max-w-xl w-full flex-auto mx-auto p-[16px] sm:p-[32px] my-auto gap-y-[16px]">
                <AnimatedView>
                    <View className="relative">
                        <View className="absolute top-4 flex shadow rounded-3xl w-full h-full bg-neutral-500 dark:bg-black blur-lg opacity-20 dark:opacity-50"></View>
                        <Card rounded="rounded-[24px]" margin="p-[16px] sm:p-[24px]" addClassName="border border-white overflow-hidden dark:border-bdrcard-d gap-y-[16px] sm:gap-y-[24px]">
                                                <View className="flex-col flex-auto gap-y-[8px] justify-center ">
                                                    <Text className="text-[20px] sm:text-[24px] text-center lg:text-left leading-[none] tracking-tight font-semibold text-neutral-800 dark:text-neutral-200">
                                                    Log in to your account</Text>

                                                    <Text className="text-[14px] sm:text-[16px] text-center lg:text-left text-neutral-500">
                                                    Enter your email and password to login</Text>
                                                
                                                </View>
                            <BlockByName name={props.blocks.form} data={props.data} formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} />
                            
                                        <View className="flex-row items-center justify-center  w-full">
                                            <View className="flex-1 h-[1px] w-full bg-neutral-200 dark:bg-neutral-500" />
                                            <Text className="mx-[16px] text-xs text-neutral-500 dark:text-neutral-400 font-normal">OR</Text>
                                            <View className="flex-1 h-[1px] w-full bg-neutral-200 dark:bg-neutral-500" /> 
                                        </View>
                                        <View className="flex-row flex-wrap gap-x-[8px] gap-y-[8px] w-full">
                                        <AuthPanel  />
                                            <Link className="flex-1 min-w-[200px]" href="/forgot-password" haptics="Medium">
                                                    <Button
                                                        title="Reset password"
                                                        variant="default"
                                                        startDecorator="RotateCcw"
                                                        fullWidth
                                                        size="base"
                                                        ring="rounded-[13px] bg-neutral-300 dark:bg-neutral-950 shadow-sm hover:shadow-none"

                                                    />
                                            </Link>
                                            <Link className="flex-1 min-w-[200px]" href="/create-account" haptics="Medium">
                                            <Button
                                                title="Create new account"
                                                variant="default"
                                                fullWidth
                                                size="base"
                                                startDecorator="UserRoundPlus"
                                                ring="rounded-[13px] bg-neutral-300 dark:bg-neutral-950 shadow-sm hover:shadow-none"

                                            />
                                        </Link>
                                        </View>
                        </Card>
                    </View>
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
                                <Link href="/forgot-password" haptics="Medium">
                                    <Button
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
                            <Link className="w-full" href="/create-account" haptics="Medium">
                                <Button
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
