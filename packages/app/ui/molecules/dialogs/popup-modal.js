import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button, ButtonLink } from 'app/design/controls'
import React from 'react'
import BlockByUrl from 'app/ui/molecules/page/block'
import AuthPanel from 'app/ui/molecules/auth/auth'
import { useTranslation } from 'react-i18next'

export default function () {
    const { t } = useTranslation()


    return (
        <View className="gap-y-6 sm:p-2 w-full max-w-lg mx-auto">
            <View className="flex-col flex-auto gap-y-2 justify-center ">
                <Text className="text-xl text-center lg:text-left leading-none tracking-tight font-semibold text-secondary-foreground ">
                    {t('login_modal_heading')}
                </Text>
                <Text className="text-sm text-center lg:text-left text-muted-foreground">
                    {t('login_modal_subheading')}
                </Text>
            </View>
            <BlockByUrl url="/api.php?r=system/login_form/TemplServiceLogin" formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} />
            <View className="flex-row items-center justify-center w-full">
                <View className="flex-1 h-px w-full bg-secondary dark:bg-muted-foreground" />
                <Text className="mx-4 text-xs text-muted-foreground  font-normal">{t('OR')}</Text>
                <View className="flex-1 h-px w-full bg-secondary dark:bg-muted-foreground" />
            </View>
            <View className="gap-y-2 w-full">
                <Row className="flex-row gap-y-2 flex-wrap gap-x-2 w-full items-center justify-center"><AuthPanel /></Row>
               
                    <ButtonLink
                        title={t('login_modal_fp')}
                        variant="default"
                        startDecorator="RotateCcw"
                        fullWidth
                        size="base"
                        href="/forgot-password"
                    />
                
                    <ButtonLink
                        title={t('login_modal_new_account')}
                        variant="default"
                        fullWidth
                        size="base"
                        startDecorator="UserRoundPlus"
                        href="/create-account"
                    />
             
            </View>
        </View>
    )
}
