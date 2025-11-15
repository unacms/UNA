import { View, Row } from 'app/design/view'
import { Text, H2 } from 'app/design/typography'
import {
    Card,
    CardHeader,
    CardDescription,
    CardContent,
    CardFooter,
    CardTitle,
} from 'app/ui/molecules/card'
import { appSetting } from 'app/lib/util'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth'
import { useRef } from 'react'
import { BlockByName } from 'app/components/block'
import MenuFooter from 'app/components/nav/menu-footer'
import AnimatedView from 'app/ui/atoms/animated-view'
import { useTranslation } from 'react-i18next'
import ScrollList from 'app/ui/molecules/scroll_list'
import Link from 'app/ui/atoms/link'

/**
 * Renders the login splash screen with adaptive layouts for web and mobile platforms.
 *
 * Displays an illustration, splash text, and a login form with options for password recovery and account creation. Layout and styling adjust based on platform and theme. Footer content is included at the bottom of the screen.
 *
 * @param {object} props - Component properties, including optional login form data.
 */

function PageContent(props) {
    const { t } = useTranslation()
    return (
        <View className="w-full justify-center lg:w-1/2 p-4 sm:p-8 md:p-12 p-6 ">
            <AnimatedView className="gap-4" direction="up" delay={200}>
                <Card
                    padding="p-6 gap-6 max-w-xl w-full mx-auto rounded-3xl"
                    role="form"
                    titleId="login-card-title"
                    aria-describedby="login-card-description"
                >
                    <CardHeader>
                        <CardTitle id="login-card-title" className="text-center lg:text-start">
                            {t('login_modal_title')} 
                        </CardTitle>
                        <CardDescription id="login-card-description" className="text-center lg:text-start">
                            {t('splash_page_login')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BlockByName
                            name="system:login_form"
                            contentOnly={true}
                            data={props.data}
                            formProps={{
                                hide_errors: true,
                                button_full_width: true,
                            }}
                        />
                    </CardContent>
                    <CardFooter>
                        <AuthPanel
                            forgotPasswordLink={true}
                            showSeparator={true}
                        />
                    </CardFooter>
                </Card>

                <Row
                    className="mx-auto gap-1 justify-center items-center text-center"
                    accessibilityRole="text"
                    accessibilityLabel={`${t('splash_page_login2')} ${t(
                        'splash_page_new_account'
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
            </AnimatedView>
        </View>
    )
}

export default function Splash(props) {
    const isWeb = Platform.OS == 'web'
    const refer = useRef()
    const content = isWeb ? (
        <View className="flex-col justify-center lg:pt-0 w-full ">
            <View
                className={`justify-center w-full mx-auto lg:flex-row ${appSetting(
                    'layout',
                    'max_width_content'
                )}`}
            >
                {appStatic('splash_text')}
                <PageContent {...props} />
            </View>
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-3 p-3"
                variant="ghost"
                size="sm"
                itemClassName=""
            />
        </View>
    ) : (
        <View className=" w-full ">
            <View
                className={`w-full lg:flex-row ${appSetting(
                    'layout',
                    'max_width_content'
                )}`}
            >
                {appStatic('splash_text')}
                <PageContent {...props} />
            </View>
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/40 justify-center flex-row flex-wrap gap-4 p-4"
                variant="ghost"
                size="sm"
                itemClassName=""
            />
        </View>
    )

    return (
        <ScrollList
            refer={refer}
            content={content}
            pageData={props.data}
            headerHeight={isWeb ? 48 : 48}
            contentType="ScrollList"
        />
    )
}
