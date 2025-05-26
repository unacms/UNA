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
                'flex-col w-full mx-auto ' + appSetting('layout', 'max_width')
            }
        >
            <View className="flex-col mx-auto my-auto justify-center sm:justify-start items-center md:items-start flex-auto">
               
                    <Text className="text-3xl mb-6 text-center md:text-left font-bold text-neutral-800 dark:text-neutral-200 ">
                        Sign in to see more
                    </Text>
                
            </View>

            <View className=" flex-auto w-full">
                <BlockByUrl url="/api.php?r=system/login_form/TemplServiceLogin" />

                <Link className=" mx-auto  w-full " href="/forgot-password">
                    <Button
                        title="Forgot password?"
                        variant="link"
                        fullWidth
                        size="sm"
                    />
                </Link>

                <Link className=" w-full " href="/create-account">
                    <Button
                        title="Create new account"
                        startDecorator="UserPlus"
                        size="base"
                        fullWidth
                    />
                </Link>
            </View>
        </View>
    )
}
