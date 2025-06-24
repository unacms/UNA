import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName, DataByName } from 'app/components/block'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AuthPanel from 'app/ui/molecules/auth'
import * as Haptics from 'expo-haptics'
import { appSetting } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import SvgFile from 'app/ui/molecules/svg-file';
import MenuFooter from 'app/components/nav/menu-footer';
import AnimatedView from 'app/ui/atoms/animated-view';

export default function PageLayout(props) {
    const { t } = useTranslation()
    const joinData = DataByName(props.data, props.blocks.form_join)
    const isAllowJoin = joinData.content[0].type == 'form'
    const isWeb = Platform.OS === 'web'
    const refer = useRef();

    const content = isWeb ? (
        <View className="flex-col justify-center min-h-[calc(100vh-64px)] w-full">
                <View className="w-full lg:flex-row mx-auto my-auto  max-w-[1440px]">
                    <View className="my-auto flex-col items-center lg:items-start flex-auto p-[16px] sm:p-[32px] xl:p-[64px]" accessible={true}>
                        <AnimatedView className="w-[200px] h-[200px] lg:w-[320px] lg:h-[320px] web:duration-300">
                            <SvgFile src_dark="create-account-dark.svg" src_default="create-account-light.svg" alt="Create account illustration"/>
                        </AnimatedView>
                        <AnimatedView direction="up" className="flex-auto hidden lg:flex items-center lg:items-start gap-y-[16px] sm:gap-y-[24px] max-w-md sm:max-w-lg lg:max-w-3xl">
                            <Text
                                accessible={true}
                                accessibilityRole="heading"
                                aria-level={1}
                                className="text-4xl lg:text-5xl xl:text-6xl text-center lg:text-start tracking-tight font-bold text-neutral-800 dark:text-neutral-200 text-pretty"
                            >
                                {isAllowJoin
                                    ? 'Join ' + appSetting('app', 'title') + ' Now !'
                                    : 'Request Invitation'}
                            </Text>
                            <Text
                                accessible={true}
                                accessibilityRole="text"
                                className="text-base lg:text-lg xl:text-xl text-center lg:text-start text-neutral-600 dark:text-neutral-400 text-pretty"
                            >
                                {isAllowJoin
                                    ? t('Create an account to get started. It\'s quick and easy to join')
                                    : t('Registration is by invitation only. Please use invitation code to join.')}
                            </Text>
                        </AnimatedView>
                        
                    </View>
                    <View className="max-w-xl w-full flex-auto mx-auto p-[16px] sm:p-[32px] my-auto">
                        <AnimatedView>
                            <View className="relative">
                                <View className="absolute top-4 flex shadow rounded-3xl w-full h-full bg-neutral-500 dark:bg-black blur-lg opacity-20 dark:opacity-50"></View>
                                <Card rounded="rounded-[24px]" margin="p-[16px] sm:p-[24px]" addClassName="border border-white overflow-hidden dark:border-bdrcard-d gap-y-[24px]">
                                    
                                    <View className="flex-col flex-auto gap-y-[8px] justify-center ">
                                                    <Text className="text-[20px] sm:text-[24px] text-center lg:text-left leading-[none] tracking-tight font-semibold text-neutral-800 dark:text-neutral-200">
                                                    Create your {appSetting('app', 'title')} account</Text>

                                                    <Text className="text-[14px] sm:text-[16px] text-center lg:text-left text-neutral-500">
                                                    Already have an account? <Link href="/login">Sign in</Link>.</Text>
                                                
                                                </View>
                                    {!isAllowJoin && (
                                        <BlockByName
                                            name={props.blocks.form_invitation}
                                            data={props.data}
                                            formProps={{
                                                auto_focus: true,
                                                hide_errors: true,
                                                button_full_width: true,
                                            }}
                                        />
                                    )}
                                    {isAllowJoin && (
                                        <BlockByName
                                            name={props.blocks.form_join}
                                            data={props.data}
                                            formProps={{
                                                auto_focus: true,
                                                hide_errors: true,
                                                button_full_width: true,
                                            }}
                                        />
                                    )}
                                    <View className="flex items-center justify-center gap-y-2 border-t border-bdr dark:border-bdr-d mt-[16px] pt-[16px]">
                                        <AuthPanel />
                                    </View>
                                </Card>
                            </View>
                        </AnimatedView>
                        
                    </View>
                </View>
                <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-[64px] items-center justify-center" />
        </View>
    ) : (
        <View className="flex-col justify-center w-full p-4">
            <Card>
                <View className="flex-col lg:hidden pb-4">
                    <Text className="text-[20px] sm:text-[24px] text-center lg:text-left leading-[none] tracking-tight font-semibold text-neutral-800 dark:text-neutral-200">
                        Create an account
                    </Text>
                </View>
                {!isAllowJoin && (
                    <BlockByName
                        name={props.blocks.form_invitation}
                        data={props.data}
                        formProps={{
                            auto_focus: true,
                            hide_errors: true,
                            button_full_width: true,
                        }}
                    />
                )}
                {isAllowJoin && (
                    <BlockByName
                        name={props.blocks.form_join}
                        data={props.data}
                        formProps={{
                            auto_focus: true,
                            hide_errors: true,
                            button_full_width: true,
                        }}
                    />
                )}
                <View className="flex items-center justify-center pt-4 mt-4 gap-y-2 border-t border-bdr dark:border-bdr-d">
                    <Link className="w-full" href="/login" haptics="Medium">
                        <Button
                            title="Login with email"
                            size="base"
                            fullWidth
                        />
                    </Link>
                    <AuthPanel />
                </View>
            </Card>
           <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-[64px] items-center justify-center"/>
        </View>
    );

    return (
        <KbAvoidingView style={{ flex: 1 }} offset={isWeb ? undefined : 0}>
            {isWeb ? (
                <ScrollList
                    refer={refer}
                    content={content}
                    pageData={props.data}
                    headerHeight={0}
                    contentType="ScrollList"
                />
            ) : (
                <View className="flex-1 bg-primary-50 dark:bg-primary-950">
                    <ScrollList
                        refer={refer}
                        content={content}
                        pageData={props.data}
                        headerHeight={0}
                        contentType="ScrollList"
                    />
                </View>
            )}
        </KbAvoidingView>
    )
}
