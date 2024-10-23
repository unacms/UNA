import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button, Modal } from 'app/design/controls'
import Card from 'app/components/card'
import { useState } from 'react'
import React from 'react'
import { appSetting, BlockDataByName, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { Platform } from 'react-native'
import { useWindowDimensions } from 'react-native'
import { BlockByData } from 'app/components/blocks-content/object-data-array-int';
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';

export default function Splash(props) {
    const isWeb = Platform.OS == 'web'

    const [isCreateAccount, setIsCreateAccount] = useState(false)
    const [isCreateAccountSubmit, setIsCreateAccountSubmit] = useState(false)

    const windowDimensions = useWindowDimensions();
    const isIos = Platform.OS === 'ios'
    const isSmall = windowDimensions.width < LAYOUT_BREAKPOINTS.sm ? true : false;

    const dataSignUp = BlockDataByName(props.data, 'system:create_account_form');
    const dataJoin = BlockDataByName(props.data, 'bx_invites:get_block_form_request');
    const dataForgotPass = BlockDataByName(props.data, 'system:forgot_password');
    const isSignUp = dataSignUp.content[0].type == "form" ? true : false

    const data = {
        create: { content: isSignUp ? dataSignUp?.content : dataJoin?.content, designbox_id: 0, title: isSignUp ? "Create new account" : "Request invitation" },
        forgot: { content: dataForgotPass?.content, designbox_id: 0 }

    }
    const caption = isCreateAccount == 'forgot' ? 'Restore password' : data.create.title

    const headerCreateAccount = <Row className=' w-full justify-between items-center'>
        <View className=''><Button onPress={() => { setIsCreateAccount(false) }} variant='outline' rounded startDecorator="X" /></View>
        <View className='w-full flex-auto items-center justify-center'><Text className="text-neutral-700 dark:text-neutral-200 text-xl font-bold">{caption}</Text></View>
        <View className=' '>
            <Button onPress={() => { setIsCreateAccountSubmit(Date.now()) }} variant='primary' rounded startDecorator="PaperPlane" />
        </View>
    </Row>

    const cnt = (
        <>
            <Modal
                title={isSmall ? headerCreateAccount : caption}
                onVisible={!!isCreateAccount}
                outerClickClose={false}
                {...(!isSmall && { onClose: () => setIsCreateAccount(false) })}
                padding='sm:p-4 sm:pb-0'
                transparent={true}
                headerBorder={true}
            >
                <View className=' w-full h-full pt-2 sm:pt-0'>
                    <KbAvoidingView offset={isIos ? 56 : 72} className="flex-1 w-full h-full">
                        <ScrollView className="w-full h-full flex-1">
                            <View className="w-full px-4 sm:px-1">

                                <BlockByData block={isCreateAccount == 'signup' ? data.create : data.forgot} isSubmit={isCreateAccountSubmit} />
                            </View>
                        </ScrollView>
                    </KbAvoidingView>
                </View>
            </Modal>
            <View className="mx-auto w-full max-w-lg md:w-1/2 lg:w-1/3 my-auto mx-auto items-center xl:p-4 p-2  ">
                <View className=" flex-auto w-full   ">
                    <Card
                        rounded=" rounded-2xl "
                        addClassName=" px-4 py-2 sm:px-6 sm:py-4 w-full  max-w-xl mx-auto flex-auto  "
                    >
                        <View className="">{props.block}</View>
                    </Card>
                    <Button
                        title="Forgot password?"
                        variant="link"
                        fullWidth
                        size="sm"
                        onPress={() => { setIsCreateAccount('forgot') }}

                    />
                    <Card
                        rounded=" rounded-2xl "
                        addClassName=" p-4 mt-4 sm:p-6 sm:mt-6 w-full max-w-xl mx-auto flex-auto  "
                    >
                        <Text className="text-center mb-4 sm:mb-6 text-lg font-semibold  mx-auto text-neutral-700 dark:text-neutral-300  ">
                            Don't have an account?
                        </Text>
                        <Button
                            title={data.create.title}
                            startDecorator="UserCirclePlus"
                            size="base"
                            fullWidth
                            onPress={() => { setIsCreateAccount('signup') }}
                        />
                    </Card>
                </View>
            </View></>
    )

    if (!isWeb) {
        return (
            <View className=" w-full  w-full justify-center mt-16 ">
                <View className="   ">
                    <View className="items-center mb-4 ">
                        <View className="w-60 h-16">
                            {props.logo_native}
                        </View>
                    </View>
                    {cnt}
                </View>
            </View>
        )
    }

    return (
        <View
            className={
                'flex-col w-full mx-auto max-w-screen-2xl mx-auto ' + appSetting('layout', 'max_width')
            }
        >
            <View className="mb-4 md:flex-row border-b border-bdr dark:border-bdr-d  px-2 xl:px-4 py-8 lg:gap-x-4 duration-300  ">
                <View className="group absolute my-auto">
                    <View className="translate-x-8 -rotate-6 translate-y-8 duration-1000 hover:rotate-6 absolute backdrop-blur-sm  bg-primary/5 rounded-2xl w-80 h-80 "></View>
                    <View className="translate-x-32 -rotate-6 translate-y-16 duration-1000 hover:rotate-6 absolute backdrop-blur-sm  bg-primary/5 rounded-2xl w-80 h-80 "></View>
                    <View className="translate-x-60 -rotate-6 translate-y-24 duration-1000 hover:rotate-6 absolute backdrop-blur-sm  bg-primary/5 rounded-2xl w-80 h-80 "></View>
                </View>
                <View className=" p-10 flex-col mx-auto justify-center  my-auto sm:justify-start items-center md:items-start xl:items-center  flex-auto  ">
                    <Text className=" text-4xl mb-8 lg:text-6xl max-w-2xl text-center md:text-left tracking-tight font-bold text-neutral-800 dark:text-neutral-200 ">
                        Welcome to the community!
                    </Text>
                    <Text className=" text-base lg:text-lg xl:text-xl max-w-2xl  text-center md:text-start text-neutral-600 dark:text-neutral-400 ">
                        Connect, engage and collaborate with people who share
                        your interests and passions - create, share, develop,
                        explore, exchange insights, and expand your horizons
                        together.
                    </Text>
                </View>

                {cnt}
            </View>
            <View className=" max-w-screen-2xl mx-auto items-center px-2 xl:px-4 py-4 flex-row flex-wrap w-full duration-300">
                <View className="w-full md:w-1/2 lg:w-1/3 flex-auto max-w-lg mx-auto xl:p-4 p-2">
                    <Card addClassName=" rounded-2xl w-full flex-col p-4 sm:p-6 ">
                        <View className="flex-row gap-x-3 mb-4">
                            <Button
                                variant="outline"
                                startDecorator="Users"
                                size="base"
                                rounded
                            />
                            <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg xl:text-xl font-semibold ">
                                Meet People
                            </Text>
                        </View>
                        <Text
                            numberOfLines={3}
                            className="text-base text-neutral-600 dark:text-neutral-400"
                        >
                            Explore, connect, and build enduring friendships.
                            Share experiences and create bonds that last,
                            enriching your life's journey together.
                        </Text>
                    </Card>
                </View>
                <View className="w-full md:w-1/2 lg:w-1/3 flex-auto max-w-lg mx-auto xl:p-4 p-2">
                    <Card addClassName=" rounded-2xl w-full flex-col p-4 sm:p-6">
                        <View className="flex-row gap-x-3 mb-4">
                            <Button
                                variant="outline"
                                startDecorator="UsersThree"
                                size="base"
                                rounded
                            />
                            <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg xl:text-xl font-semibold ">
                                Join Groups
                            </Text>
                        </View>
                        <Text
                            numberOfLines={3}
                            className="text-base text-neutral-600 dark:text-neutral-400"
                        >
                            Connect with your community by finding groups that
                            resonate with your interests, where you can share,
                            learn, and grow with like-minded individuals on a
                            journey of mutual discovery and support.{' '}
                        </Text>
                    </Card>
                </View>
                <View className="w-full md:w-1/2 lg:w-1/3 flex-auto max-w-lg mx-auto xl:p-4 p-2">
                    <Card addClassName=" rounded-2xl w-full flex-col p-4 sm:p-6 ">
                        <View className="flex-row gap-x-3 mb-4">
                            <Button
                                variant="outline"
                                startDecorator="ChatCenteredText"
                                rounded
                                size="base"
                            />
                            <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg xl:text-xl font-semibold ">
                                Share Ideas
                            </Text>
                        </View>
                        <Text
                            numberOfLines={3}
                            className="text-base text-neutral-600 dark:text-neutral-400"
                        >
                            Toss around your concepts and receive insights from
                            those who understand your vision, offering
                            constructive feedback to refine and elevate your
                            ideas.
                        </Text>
                    </Card>
                </View>
                <View className="w-full md:w-1/2 lg:w-1/3 flex-auto max-w-lg mx-auto xl:p-4 p-2">
                    <Card addClassName=" rounded-2xl w-full flex-col p-4 sm:p-6 ">
                        <View className="flex-row gap-x-3 mb-4">
                            <Button
                                variant="outline"
                                startDecorator="CalendarCheck"
                                rounded
                                size="base"
                            />
                            <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg xl:text-xl font-semibold ">
                                Discover Events
                            </Text>
                        </View>
                        <Text
                            numberOfLines={3}
                            className="text-base text-neutral-600 dark:text-neutral-400"
                        >
                            Stay in the loop with the latest happenings and
                            discover events that align with your interests,
                            ensuring you never miss out on what you enjoy.{' '}
                        </Text>
                    </Card>
                </View>
                <View className="w-full md:w-1/2 lg:w-1/3 flex-auto max-w-lg mx-auto xl:p-4 p-2">
                    <Card addClassName=" rounded-2xl w-full flex-col p-4 sm:p-6 ">
                        <View className="flex-row gap-x-3 mb-4">
                            <Button
                                variant="outline"
                                startDecorator="ChatTeardropDots"
                                rounded
                                size="base"
                            />
                            <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg xl:text-xl font-semibold ">
                                Message Friends
                            </Text>
                        </View>
                        <Text
                            numberOfLines={3}
                            className="text-base text-neutral-600 dark:text-neutral-400"
                        >
                            Keep the conversation flowing with your friends,
                            anytime and anywhere, ensuring you're always
                            connected, no matter the distance.
                        </Text>
                    </Card>
                </View>
                <View className="w-full md:w-1/2 lg:w-1/3 flex-auto max-w-lg mx-auto xl:p-4 p-2">
                    <Card addClassName=" rounded-2xl w-full flex-col p-4 sm:p-6 ">
                        <View className="flex-row gap-x-3 mb-4">
                            <Button
                                variant="outline"
                                startDecorator="Chats"
                                rounded
                                size="base"
                            />
                            <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg xl:text-xl font-semibold ">
                                Discuss Topics
                            </Text>
                        </View>
                        <Text
                            numberOfLines={3}
                            className="text-base text-neutral-600 dark:text-neutral-400"
                        >
                            Dive into a world of interaction by asking
                            questions, engaging in spirited debates, or enjoying
                            casual conversations, fostering a dynamic
                            environment of learning, sharing, and connecting.
                        </Text>
                    </Card>
                </View>
            </View>
        </View>
    )
}