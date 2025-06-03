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

const triggerHaptics = () => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
};

export default function PageLayout(props) {
    const isWeb = Platform.OS === 'web';
    const cardClassName = "animate-slidein w-full mx-auto";

    return (
        <KbAvoidingView style={{ flex: 1 }}>
            {isWeb ? (
                <View className={' flex-col justify-center mx-auto w-full ' + getPageWidth(props.uri, props.data?.config)}>
                    <View className=" w-full lg:flex-row max-w-7xl mx-auto py-16 ">
                        <View className="hidden my-auto flex-col flex-auto">
                            {appStatic('components_logincontent')}
                        </View>
                        <View className=" max-w-xl w-full flex-auto mx-auto p-[16px] sm:p-[32px] lg:p-[64px] my-auto duration-300  gap-y-[16px]">
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
                        </View>
                    </View>
                    <View className=" w-full p-4 border-t border-bdr dark:border-bdr-d">
                        <View className="mx-auto">
                            {appStatic('components_footer')}
                        </View>
                    </View>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', padding: 16, width: '100%' }}>
                    <View className=" max-w-md sm:max-w-lg w-full flex-auto mx-auto p-[16px] flex flex-col gap-y-[16px]">
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
                        </View>
                </ScrollView>
            )}
        </KbAvoidingView>
    );
}
