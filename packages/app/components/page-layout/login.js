import { View, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import AuthPanel from 'app/ui/molecules/auth';
import { appSetting } from 'app/lib/util'

export default function PageLayout(props) {
    const isWeb = Platform.OS === 'web';
    const cardClassName = "animate-slidein p-2 w-full max-w-xl mx-auto shadow-[0_0_2px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(0,0,0,1)]";

    return (
        <KbAvoidingView style={{ flex: 1 }}>
            {isWeb ? (
                <View className="w-full px-4 py-12 mx-auto max-w-7xl items-center lg:flex-row gap-x-4 gap-y-4">
                    <View className="hidden lg:flex flex-auto p-12 flex-col gap-y-8">
                        {appStatic('components_logincontent')}
                    </View>
                    <Card rounded="rounded-[24px]" addClassName={cardClassName}>
                        <View className="flex-col lg:hidden p-4">
                            <Text className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">Sign in to your account</Text>
                        </View>
                        <BlockByName name={props.blocks.form} data={props.data} formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} />
                        <Link
                            className="w-full mb-4 px-4"
                            href="/forgot-password"
                        >
                            <Button
                                title="Forgot password?"
                                variant="outline"
                                fullWidth
                                size="sm"
                            />
                        </Link>
                        <View className="flex items-center justify-center p-4 gap-y-2 border-t border-bdr dark:border-bdr-d">
                            <Link className="w-full" href="/create-account">
                                <Button
                                    title="Create new account"
                                    size="base"
                                    fullWidth
                                />
                            </Link>
                            <AuthPanel className="" />
                        </View>
                    </Card>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', padding: 16, width: '100%' }}>
                    <Card rounded="rounded-[24px]" addClassName={cardClassName}>
                        <View className="flex-col lg:hidden p-4">
                            <Text className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">Sign in to your account</Text>
                        </View>
                        <BlockByName name={props.blocks.form} data={props.data} formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} />
                        <Link
                            className="w-full mb-4 px-4"
                            href="/forgot-password"
                        >
                            <Button
                                title="Forgot password?"
                                variant="outline"
                                fullWidth
                                size="sm"
                            />
                        </Link>
                        <View className="flex items-center justify-center p-4 gap-y-2 border-t border-bdr dark:border-bdr-d">
                            <Link className="w-full" href="/create-account">
                                <Button
                                    title="Create new account"
                                    size="base"
                                    fullWidth
                                />
                            </Link>
                            <AuthPanel className="" />
                        </View>
                    </Card>
                </ScrollView>
            )}
        </KbAvoidingView>
    );
}
