import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button, Modal } from 'app/design/controls'
import Card from 'app/components/card'
import { useState } from 'react'
import { appSetting, BlockDataByName, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { Platform } from 'react-native'
import { useWindowDimensions } from 'react-native'
import { BlockByData } from 'app/components/blocks-content/object-data-array-int'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { appStatic } from 'app/lib/app-static'

export default function Splash(props) {
    const isWeb = Platform.OS == 'web'

    const [isCreateAccount, setIsCreateAccount] = useState(false)
    const [isCreateAccountSubmit, setIsCreateAccountSubmit] = useState(false)

    const windowDimensions = useWindowDimensions()
    const isIos = Platform.OS === 'ios'
    const isSmall =
        windowDimensions.width < LAYOUT_BREAKPOINTS.sm ? true : false

    const dataSignUp = BlockDataByName(props.data, 'system:create_account_form')
    const dataJoin = BlockDataByName(
        props.data,
        'bx_invites:get_block_form_request'
    )
    const dataForgotPass = BlockDataByName(props.data, 'system:forgot_password')
    const isSignUp = dataSignUp?.content[0].type == 'form' ? true : false

    const data = {
        create: {
            content: isSignUp ? dataSignUp?.content : dataJoin?.content,
            designbox_id: 0,
            title: isSignUp ? 'Create new account' : 'Request invitation',
        },
        forgot: { content: dataForgotPass?.content, designbox_id: 0 },
    }
    const caption =
        isCreateAccount == 'forgot' ? 'Restore password' : data.create.title

    const headerCreateAccount = (
        <Row className=" w-full justify-between items-center">
            <View className="">
                <Button
                    onPress={() => {
                        setIsCreateAccount(false)
                    }}
                    variant="outline"
                    rounded
                    startDecorator="X"
                />
            </View>
            <View className="w-full flex-auto items-center justify-center">
                <Text className="text-neutral-700 dark:text-neutral-200 text-xl font-bold">
                    {caption}
                </Text>
            </View>
            <View className=" ">
                <Button
                    onPress={() => {
                        setIsCreateAccountSubmit(Date.now())
                    }}
                    variant="primary"
                    rounded
                    startDecorator="PaperPlane"
                />
            </View>
        </Row>
    )

    const cnt = (
        <>
            <Modal
                title={isSmall ? headerCreateAccount : caption}
                onVisible={!!isCreateAccount}
                outerClickClose={false}
                {...(!isSmall && { onClose: () => setIsCreateAccount(false) })}
                transparent={true}
                headerBorder={true}
            >
                <View className=" w-full h-full pt-2 sm:pt-0">
                    <KbAvoidingView
                        offset={isIos ? 56 : 72}
                        className="flex-1 w-full h-full"
                    >
                        <ScrollView className="w-full h-full flex-1">
                            <View className="w-full px-4 sm:p-0">
                                <BlockByData
                                    block={
                                        isCreateAccount == 'signup'
                                            ? data.create
                                            : data.forgot
                                    }
                                    isSubmit={isCreateAccountSubmit}
                                />
                            </View>
                        </ScrollView>
                    </KbAvoidingView>
                </View>
            </Modal>
            <View className="mx-auto w-full max-w-md md:w-1/2  my-auto mx-auto items-center ">
                <View className=" flex-auto w-full  ">
                    <Card
                        rounded=" rounded-2xl "
                        addClassName="flex-col gap-y-3 p-4 sm:p-6 w-full max-w-xl mx-auto "
                    >
                        {props.block}

                        <Button
                            title="Forgot password?"
                            variant="link"
                            fullWidth
                            size="sm"
                            onPress={() => {
                                setIsCreateAccount('forgot')
                            }}
                        />
                        <View className="border-t border-bdr dark:border-bdr-d pt-4 sm:pt-6 ">
                            <Button
                                title={data.create.title}
                                startDecorator="UserCirclePlus"
                                size="lg"
                                fullWidth
                                onPress={() => {
                                    setIsCreateAccount('signup')
                                }}
                            />
                        </View>
                    </Card>
                </View>
            </View>
        </>
    )

    if (!isWeb) {
        return (
            <View className="justify-center">
                <View className="items-center my-8 ">
                    <View className="w-60 h-16 items-center">{appStatic('logo_native')}</View>
                </View>
                {cnt}
            </View>
        )
    }

    return (
        <View className={' flex-col w-full mx-auto max-w-screen-2xl mx-auto ' + appSetting('layout', 'max_width')}>
            <View className=" md:h-[calc(100vh-128px)]  md:flex-row border-b border-bdr dark:border-bdr-d p-4 sm:p-6 gap-y-4 gap-x-4 duration-300">
                <View className="max-w-2xl p-4 sm:p-6 flex-col mx-auto justify-center my-auto sm:justify-start items-center md:items-start xl:items-center flex-auto">
                    <View className="mb-8 w-full">
                        <View className="group flex-row mx-auto md:mx-0 flex-none gap-x-6 my-auto">
                            <View className="w-16 h-16">
                                {appStatic('logo_mark')}
                            </View>
                            <View className="items-center w-[136px] h-[64px]">
                                {appStatic('logo_text')}
                            </View>
                        </View>
                    </View>
                    <Text className=" text-xl sm:text-2xl text-center md:text-start text-neutral-800 dark:text-neutral-200 ">
                        Discover the community where you can connect and engage
                        with people who share your interests.
                    </Text>
                </View>

                {cnt}
            </View>
            <View className=" mx-auto mt-2">{appStatic('components_footer')}</View>
        </View>
    )
}
