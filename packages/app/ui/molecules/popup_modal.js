import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import React from 'react'
import BlockByUrl from 'app/ui/molecules/block'
import Card from 'app/components/card'
import AuthPanel from 'app/ui/molecules/auth'
import { useTranslation } from 'react-i18next'

export default function () {
    const { t } = useTranslation()


    return (
        <View className="gap-y-[24px] sm:p-[8px] w-full max-w-lg mx-auto">
            <View className="flex-col flex-auto gap-y-[8px] justify-center ">
                <Text className="text-[20px] sm:text-[24px] text-center lg:text-left leading-[none] tracking-tight font-semibold text-neutral-800 dark:text-neutral-200">
                    {t('login_modal_heading')}
                </Text>
                <Text className="text-[14px] sm:text-[16px] text-center lg:text-left text-neutral-500">
                    {t('login_modal_subheading')}
                </Text>
            </View>
            <BlockByUrl url="/api.php?r=system/login_form/TemplServiceLogin" formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} />
            <View className="flex-row items-center justify-center  w-full">
                <View className="flex-1 h-[1px] w-full bg-neutral-200 dark:bg-neutral-500" />
                <Text className="mx-[16px] text-xs text-neutral-500 dark:text-neutral-400 font-normal">OR</Text>
                <View className="flex-1 h-[1px] w-full bg-neutral-200 dark:bg-neutral-500" />
            </View>
            <View className="gap-y-[8px] w-full">
                <Row className="flex-row gap-y-[8px] flex-wrap gap-x-[8px] w-full items-center justify-center"><AuthPanel /></Row>
                <Link className="flex-1 min-w-[200px]" href="/forgot-password" haptics="Medium">
                                    <Button
                                        title={t('login_modal_fp')}
                                        variant="default"
                                        startDecorator="RotateCcw"
                                        fullWidth
                                        size="base"
                                        ring="rounded-[13px] bg-neutral-300 dark:bg-neutral-950 shadow-sm hover:shadow-none"

                                    />
                                </Link>
                                <Link className="flex-1 min-w-[200px]" href="/create-account" haptics="Medium">
                                    <Button
                                        title={t('login_modal_new_account')}
                                        variant="default"
                                        fullWidth
                                        size="base"
                                        startDecorator="UserRoundPlus"
                                        ring="rounded-[13px] bg-neutral-300 dark:bg-neutral-950 shadow-sm hover:shadow-none"

                                    />
                                </Link>
            </View>
        </View>
    )
}
