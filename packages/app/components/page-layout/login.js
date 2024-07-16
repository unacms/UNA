import { View, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'

export default function PageLayout(props) {
    

    return (
        <ScrollView className='p-4'>
            <View className=" w-full mx-auto max-w-5xl flex-col items-center lg:flex-row  rounded-3xl lg:bg-bgrnavbar/50 lg:dark:bg-bgrnavbar-d/50 lg:border border-dashed border-bdr dark:border-bdr-d ">
                <View className="flex-col p-4 lg:p-8 flex-auto w-full  items-center lg:items-start gap-y-4 my-auto ">
                    <Text className="text-4xl tracking-tight font-bold text-neutral-800 dark:text-neutral-200 ">
                        Welcome back!
                    </Text>

                    <Text className="text-base lg:text-lg xl:text-xl  text-neutral-700 dark:text-neutral-300  ">
                        Login to your account to continue.
                    </Text>
                    <View className="w-full mt-4"> {appStatic('components_logincontent')}</View>
                   
                </View>


                <View className="w-full max-w-lg md:w-1/2 lg:w-2/5 my-auto mx-auto items-center lg:p-2  ">
                    <View className=" flex-auto w-full   ">
                <Card
                            rounded=" rounded-2xl "
                            addClassName="border px-4 py-2 sm:px-6 sm:py-4 w-full  max-w-xl mx-auto flex-auto  "
                        >
                    <BlockByName name={props.blocks.form} data={props.data} />
                    </Card>
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

                        <Card
                            rounded=" rounded-2xl "
                            addClassName="border p-4 mt-4 sm:p-6 sm:mt-6 w-full  max-w-xl mx-auto flex-auto  "
                        >
                            <Text className="text-center mb-4 sm:mb-6 text-lg font-semibold  mx-auto text-neutral-700 dark:text-neutral-300  ">
                                Don't have an account?
                            </Text>
                            <Link className=" w-full " href="/create-account">
                                <Button
                                    title="Create new account"
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
