import { View, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';

export default function PageLayout(props) {
    return (
        <KbAvoidingView style={{ flex: 1 }}>
            <View style={{ flex: 1 }} className={Platform.OS === 'web' ? 'w-full  px-4 py-12 mx-auto max-w-5xl items-center lg:flex-row gap-x-4 gap-y-4  ' : ' items-center p-4'}>
                <View className="flex-col gap-y-4 hidden lg:flex flex-auto">
                    {appStatic('components_logincontent')}
                </View>
                <Card rounded="  rounded-[24px] " addClassName=" animate-slidein p-4 w-full max-w-md mx-auto flex-auto ">
                    <View className="flex-col lg:hidden items-center mb-4">
                        <View className="w-12 m-4 items-center mx-auto text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
                            {appStatic('logo_mark')}
                        </View>
                        <Text className="flex items-center h-12 text-center text-xl font-bold text-neutral-800 dark:text-neutral-200 ">Sign in to your account</Text>
                    </View>
                    <BlockByName name={props.blocks.form} data={props.data} formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} />
                    <Link
                        className=" w-full my-4 "
                        href="/forgot-password"
                    >
                        <Button
                            title="Forgot password?"
                            variant="link"
                            fullWidth
                            size="sm"
                        />
                    </Link>
                    <View className="flex items-center justify-center pt-4 border-t border-bdr dark:border-bdr-d  ">
                        <Link className=" w-full " href="/create-account">
                            <Button
                                title="Create new account"
                                startDecorator="UserPlus"
                                size="base"
                                fullWidth
                            />
                        </Link></View>
                </Card>
            </View>
        </KbAvoidingView>
    )
}
