import { View, Row } from 'app/design/view'
import { Text, H2 } from 'app/design/typography'
import {
    Card,
    CardHeader,
    CardDescription,
    CardContent,
    CardFooter,
    CardTitle,
    CardIcon,
} from 'app/ui/molecules/card'
import { appSetting } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth'
import { BlockByName, DataByName } from 'app/components/block'
import MenuFooter from 'app/components/nav/menu-footer'
import { useTranslation } from 'react-i18next'
import Link from 'app/ui/atoms/link'
import Page from 'app/ui/molecules/page'
import { Icon } from 'app/ui/atoms/icon'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { BlockDataByName } from 'app/lib/util';
/**
 * Renders the login splash screen with adaptive layouts for web and mobile platforms.
 *
 * Displays an illustration, splash text, and a login form with options for password recovery and account creation. Layout and styling adjust based on platform and theme. Footer content is included at the bottom of the screen.
 *
 * @param {object} props - Component properties, including optional login form data.
 */

function PageContent({ data }) {
    const { t } = useTranslation()

    const isShowCreateAccount = BlockDataByName(data, 'system:login_form');

    return (
        <View className="w-full max-w-md ">
            <View className="sm:py-6 gap-4 sm:gap-6 max-w-md w-full mx-auto">
                <KbAvoidingView>
                    <BlockByName
                        name={isShowCreateAccount ? "system:login_form" : "system:login_form_only"}
                        data={data}
                        formProps={{
                            hide_errors: true,
                            button_full_width: true,
                        }}
                    />
                </KbAvoidingView>
                <AuthPanel forgotPasswordLink={true} showSeparator={true} />
            </View>
            {isShowCreateAccount && <View className="sm:px-6 ">
                <Row
                    className="mx-auto gap-1 justify-center items-center text-center"
                    accessibilityRole="text"
                    accessibilityLabel={`${t('splash_page_login2')} ${t(
                        'splash_page_new_account',
                    )}`}
                >
                    <Text
                        className="text-secondary-foreground text-base"
                        accessibilityRole="text"
                    >
                        {t('splash_page_login2')}
                    </Text>
                    <Link
                        variant="accent"
                        size="md"
                        href="/create-account"
                        haptics="Medium"
                    >
                        {t('splash_page_new_account')}
                    </Link>
                </Row>
            </View>}

        </View>
    )
}

export default function Splash(props) {
    return (
        <Page processKeyboard={false}>
            <View className={`flex-1 items-center justify-center lg:flex-row p-4 lg:p-6 gap-6 lg:gap-12 w-full mx-auto ${appSetting('layout', 'max_width_landing')}`}>
                {appStatic('splash_text')}
                <PageContent {...props} />
            </View>

            <MenuFooter cntClasses="flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap p-4 min-h-14" />
        </Page>
    )
}
