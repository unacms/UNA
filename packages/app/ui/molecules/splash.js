import { View, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Card from 'app/components/card'
import { appSetting } from 'app/lib/util'
import { Platform } from 'react-native'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth'
import Link from 'app/ui/atoms/link'
import * as Haptics from 'expo-haptics'
import { BlockByName } from 'app/components/block'
import { useRouter } from 'app/lib/hooks/router';
import SvgFile from 'app/ui/molecules/svg-file';
import MenuFooter from 'app/components/nav/menu-footer';
import AnimatedView from 'app/ui/atoms/animated-view';
 import { ThemeName } from 'app/design/theme';

/**
 * Renders the login splash screen with adaptive layouts for web and mobile platforms.
 *
 * Displays an illustration, splash text, and a login form with options for password recovery and account creation. Layout and styling adjust based on platform and theme. Footer content is included at the bottom of the screen.
 *
 * @param {object} props - Component properties, including optional login form data.
 */
export default function Splash(props) {
    const router = useRouter();
    const isWeb = Platform.OS == 'web'
    const theme = ThemeName();

    const gradientColors = theme === 'dark'
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
                                <Text className="text-base text-neutral-600 dark:text-neutral-400 text-center">Don't have an account?</Text>
                                <Link href="/create-account" haptics="Medium">
                                    <Button
                                        title="Create new account"
                                        startDecorator="UserRoundPlus"
                                        variant="accent"
                                        size="lg"
                                        fullWidth
                                    />
                                </Link>
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

    return (
        <View className="flex-col justify-center pt-[64px] min-h-[100vh] w-full">
            
                <View className="w-full lg:flex-row gap-y-[16px] mx-auto my-auto max-w-[1440px] ">
                    <View className="my-auto flex-col items-center lg:items-start  gap-x-[32px] flex-auto px-[16px] sm:px-[32px] xl:px-[64px] " accessible={true}>
                        <AnimatedView className="w-[50%] max-w-[360px] aspect-square">
                            <SvgFile src_dark="splash-dark.svg" src_default="splash-light.svg" alt="Splash screen illustration" />
                        </AnimatedView>
                        <AnimatedView delay={100} direction="up" className="flex-auto items-center lg:items-start gap-y-[16px] sm:gap-y-[24px] max-w-md sm:max-w-lg lg:max-w-3xl">
                            {appStatic('splash_text')}
                        </AnimatedView>
                        <AnimatedView delay={200} className="py-[32px]" direction="up">
                            <Link href="/create-account"  haptics="Medium"><Button
                                title="Create new account"
                                startDecorator="UserRoundPlus"
                                variant="accent"
                                size="lg"
                                fullWidth
                            />
                            </Link>
                        </AnimatedView>
                    </View>
                    <View className="flex-col-reverse lg:flex-col max-w-xl w-full flex-auto mx-auto p-[16px] sm:p-[32px] my-auto gap-y-[16px]">
                       
                        <AnimatedView direction="up">
                            <View className="relative">
                                <View className="absolute top-4 flex shadow rounded-3xl w-full h-full bg-neutral-500 dark:bg-black blur-lg opacity-20 dark:opacity-50"></View>
                                <Card rounded="rounded-[24px]" margin="p-[24px]" addClassName="border border-white overflow-hidden dark:border-bdrcard-d">
                                    <View className="flex-col pb-[24px] gap-y-[12px] ">
                                        <Text className="text-2xl text-center lg:text-left leading-none tracking-tight font-bold text-neutral-800 dark:text-neutral-200">
                                        Log in with your {appSetting('app', 'title')} account</Text>
                                        <Text className="text-center lg:text-left text-base text-neutral-600 dark:text-neutral-400">
                                        Don't have an account? <Link href="/create-account">Sign up</Link>.</Text>
                                    </View>
                                    <BlockByName 
                                        name="system:login_form" 
                                        data={props.data} 
                                        formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} 
                                    />
                                    
                                        <View className="flex-row items-center justify-center my-[24px] w-full">
                                            <View className="flex-1 h-[1px] w-full bg-neutral-200 dark:bg-neutral-500" />
                                            <Text className="mx-[16px] text-xs text-neutral-500 dark:text-neutral-400 font-normal">OR</Text>
                                            <View className="flex-1 h-[1px] w-full bg-neutral-200 dark:bg-neutral-500" /> 
                                        </View>
                                        <AuthPanel className="pb-[8px]" />
                                        <Link className="w-full" href="/forgot-password" haptics="Medium">
                                            <Button
                                                title="Reset password"
                                                variant="default"
                                                ring="rounded-[13px] bg-neutral-300 dark:bg-neutral-950 shadow-sm hover:shadow-none"
                                                fullWidth
                                                size="base"
                                                startDecorator="RotateCcw"
                                            />
                                        </Link>
                                    
                                    
                                </Card>
                            </View>
                        </AnimatedView>
                        
                    </View>
                </View>
            
            <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-[64px] items-center justify-center"/>
        </View>
    )
}
