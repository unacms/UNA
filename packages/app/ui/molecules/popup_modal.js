import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button, Modal } from 'app/design/controls'
import { appSetting } from 'app/lib/util'
import Link from 'app/ui/atoms/link'
import React from 'react'
import BlockByUrl from 'app/ui/molecules/block'
import Card from 'app/ui/molecules/card'

export default function () {
    return (
        <View
            className={
                'flex-col mb-4 w-full mx-auto ' +
                appSetting('layout', 'max_width')
            }
        >
            <View className="   duration-300">
                <View className=" flex-col  mx-auto my-auto justify-center sm:justify-start items-center md:items-start  flex-auto   ">
                    <View className=" flex-auto ">
                        <Text className="text-3xl mb-6 text-center md:text-left font-bold text-neutral-800 dark:text-neutral-200 ">
                            Login to see more
                        </Text>
                    </View>
                </View>

                <View className="mx-auto w-full md:w-1/2  my-auto mx-auto items-center ">
                    <View className=" flex-auto w-full   ">
                        <Card
                            rounded=" rounded-2xl "
                            addClassName=" px-4 py-2 sm:px-6 sm:py-4 w-full  max-w-xl mx-auto flex-auto  "
                        >
                            <View className="">
                                <BlockByUrl url="/api.php?r=system/login_form/TemplServiceLogin" />
                            </View>
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
                            addClassName=" p-4 mt-4 sm:p-6 sm:mt-6 w-full  max-w-xl mx-auto flex-auto  "
                        >
                            <Text className="text-center mb-6 text-lg font-semibold  mx-auto text-neutral-700 dark:text-neutral-300  ">
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
        </View>)
}