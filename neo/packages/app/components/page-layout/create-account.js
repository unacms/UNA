import { View, Row } from 'app/design/view'
import { DataByName, BlockByData } from 'app/components/block'
import { Text, H1 } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import { appStatic } from 'app/lib/app-static'
import { useTranslation } from 'react-i18next'
import AuthPanel from 'app/ui/molecules/auth/auth'
import { PageFooter } from 'app/components/nav/menu-footer'
import Page from 'app/ui/molecules/page/page'
import Html from 'app/ui/atoms/html'
import { appSetting, getPageForms } from 'app/lib/util'
import { landingText } from 'app/lib/landing-text'
import { PageHeaderOptions } from 'app/ui/molecules/header/options'
import { PageChromeProvider } from 'app/ui/molecules/page/page-chrome'

function PageContent({ children }) {
    const { t } = useTranslation()

    return (
        <View className="w-full justify-center max-w-md gap-6 mx-auto">
            {children}
            <AuthPanel showSeparator={true} createAccountLink={false} loginLink={false} />
            <Html
                customClassName="text-xs text-center text-muted-foreground u-html-links"
                data={t('create_account_page_terms')}
            />
            <Row className="mx-auto gap-1 justify-center items-center text-center">
                <Text className="text-secondary-foreground text-base">
                    {t('create_account_page_already_have')}
                </Text>
                <Link
                    variant="accent"
                    size="md"
                    href="/login"
                    haptics="Medium"
                >
                    {t('create_account_page_sign_in')}
                </Link>
            </Row>
        </View>
    )
}

function formDisplay(item) {
    return item?.data?.params?.display || item?.object || item?.name
}

function pageHasForm(data) {
    return getPageForms(data).length > 0
}

// The Invites request form is not a way to join: with invitation-only registration UNA sends it,
// after a message, in place of the join form.
function isJoinForm(item) {
    return item?.type === 'form' && formDisplay(item) !== 'bx_invites_request_send'
}

function pageAllowsJoin(data) {
    return getPageForms(data).some(isJoinForm)
}

export default function PageLayout({ data, blocks, children }) {
    const { t, i18n } = useTranslation()
    const texts = data?.texts
    const joinData = DataByName(data, blocks?.form_join)
    const inviteData = DataByName(data, blocks?.form_invitation)

    const isAllowJoin = joinData
        ? joinData.content.some(isJoinForm)
        : pageAllowsJoin(data)
    const hasForm =
        Boolean(children) ||
        isAllowJoin ||
        inviteData?.content?.some((item) => item.type === 'form') ||
        pageHasForm(data)

    const formContent = children ?? (
        <BlockByData
            url={data.url}
            uri={data.uri}
            data={joinData || inviteData}
            formProps={{ hide_errors: true, button_full_width: true }}
            // Each item of a block draws its own card: with the invitation-only message and the
            // request form, the block title would repeat on both.
            showTitle={isAllowJoin ? undefined : false}
        />
    )

    if (!hasForm) {
        return formContent
    }

    return (
        <Page data={data}>
            <PageHeaderOptions band={false} showTitle={false} />
            {/* The same frame as the home splash (ui/molecules/sections/splash.tsx), on every platform. */}
            <View
                className={`flex-auto items-center justify-center lg:flex-row p-4 sm:p-6 lg:p-12 gap-6 lg:gap-12 w-full mx-auto ${appSetting('layout', 'max_width_landing')}`}
            >
                <View className="items-center lg:items-start gap-6 my-auto flex-auto w-full">
                    {appStatic('join_text')}
                    <H1 isfirst islast className="text-center lg:text-start text-balance">
                        {isAllowJoin
                            ? landingText(t, i18n, 'create_account_page_title', texts?.title, 'Time to join!')
                            : landingText(t, i18n, 'create_account_page_title_request_invite', texts?.title_invite, 'Request an invitation')}
                    </H1>
                    <Text
                        accessible={true}
                        accessibilityRole="text"
                        className="max-w-3xl text-secondary-foreground text-center lg:text-start text-base sm:text-lg text-pretty"
                    >
                        {isAllowJoin
                            ? landingText(t, i18n, 'create_account_page_text', texts?.text, 'Joining is quick and easy. Create your own community account to get started.')
                            : landingText(t, i18n, 'create_account_page_text_request_invite', texts?.text_invite, 'Registration is by invitation only. Use your invitation code to join.')}
                    </Text>
                </View>
                {/* The frame's padding keeps the form off the screen edge at every size. */}
                <PageChromeProvider inset>
                    <PageContent>{formContent}</PageContent>
                </PageChromeProvider>
            </View>
            <PageFooter />
        </Page>
    )
}
