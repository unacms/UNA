import { View, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'

export default function PageLayout(props) {
    let cls = 'lg:h-[calc(100vh-4rem)]';
    const isWeb = Platform.OS == 'web';
    if (isWeb) {
        cls += ' justify-center';
    }

    return (
        <ScrollView className={cls} >
            <View className=" w-full mx-auto max-w-5xl flex-col items-center lg:flex-row  rounded-3xl lg:bg-bgrnavbar/50 lg:dark:bg-bgrnavbar-d/50 lg:border border-dashed border-bdr dark:border-bdr-d ">
                <View className="flex-col p-8 flex-auto w-full  items-center lg:items-start  gap-y-4 lg:gap-y-8 my-auto ">
                    <Text className="text-4xl lg:text-5xl tracking-tight font-bold text-neutral-800 dark:text-neutral-200 ">
                        Welcome back!
                    </Text>

                    <Text className="text-base lg:text-lg xl:text-xl  text-neutral-700 dark:text-neutral-300  ">
                        Login to your account to continue.
                    </Text>
                    {appStatic('components_logincontent')}
                </View>


                <View className=" flex-auto flex-col w-full  max-w-md gap-y-2 p-2">
                    <BlockByName name={props.blocks.form} data={props.data} />
                    <Link
                        className=" mx-auto  w-full "
                        href="/forgot-password"
                    >
                        <Button
                            title="Forgot password?"
                            variant="link"
                            fullWidth
                            size="sm"
                        />
                    </Link>
                    <View className="">
                        <Card addClassName="border  p-6 rounded-2xl justify-center w-full max-w-xl mx-auto flex-auto flex-col ">
                            <Text className="text-center mb-6 text-lg font-semibold  mx-auto text-neutral-700 dark:text-neutral-300  ">
                                Don't have an account?
                            </Text>
                            <Link className=" w-full " href="/create-account">
                                <Button
                                    title="Create account"
                                    variant="outline"
                                    startDecorator="UserCirclePlus"
                                    size="base"
                                    fullWidth
                                />
                            </Link>
                        </Card>
                    </View>
                </View>

            </View>
        </ScrollView>
    )
}
