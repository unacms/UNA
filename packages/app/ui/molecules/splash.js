import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
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
        <Card padding="p-0 pb-4" className="bg-card/50">
        <AnimatedView direction="up" delay={300}>
        <Card padding="p-6  ">
            <CardHeader>
                <CardTitle>{t('login_modal_title')} {t('app_name')}</CardTitle>
                <CardDescription>
                    {t('splash_page_login')}
                
                </CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
                <BlockByName
                    name="system:login_form"
                    contentOnly={true}
                    data={props.data}
                    formProps={{ hide_errors: true, button_full_width: true }}
                />
                
            </CardContent>
            <CardFooter>
                
                <AuthPanel forgotPasswordLink={true} showSeparator={true} />
            </CardFooter>
        </Card></AnimatedView>
        <CardFooter>
                <Row className="text-center flex-none mx-auto text-base items-center text-muted-foreground gap-1">
                    <Text className="text-muted-foreground text-base">{t('splash_page_login2')}</Text>
                    <Link
                        variant="primary"
                        size="md"
                        href="/create-account"
                        haptics="Medium"
                    >
                        {t('splash_page_new_account')}
                    </Link>
                </Row>
        </CardFooter>
        </Card>
    )
}

export default function Splash(props) {
    const isWeb = Platform.OS == 'web'
    const refer = useRef()
    const content = !isWeb ? (
        <>
            <View className="w-full gap-y-8 mx-auto p-3 pt-16">
                {appStatic('splash_text')}
                <PageContent {...props} />
            </View>
            <MenuFooter
                            cntClasses="mx-auto flex-row flex-wrap gap-3 p-1"
                            variant="ghost"
                            size="sm"
                            itemClassName="text-sm p-1"
                            
                        />
        </>
    ) : (
        <View
            className={`flex-col justify-center pt-14 lg:pt-0 web:min-h-[calc(100vh-16rem)] w-full absolute`}
        >
            <View className="w-full lg:flex-row mx-auto my-auto max-w-7xl ">
                {appStatic('splash_text')}
                <View className="flex-col-reverse lg:flex-col max-w-xl w-full flex-auto mx-auto p-4 sm:p-8 my-auto">
                    <AnimatedView direction="up">
                        <PageContent {...props} />
                    </AnimatedView>
                </View>
            </View>
            <MenuFooter
                            cntClasses="mx-auto flex-row flex-wrap gap-3 p-1"
                            variant="ghost"
                            size="sm"
                            itemClassName="text-sm p-1"
                            
                        />
        </View>
    )

    return (
        <ScrollList
            refer={refer}
            content={content}
            pageData={props.data}
            headerHeight={isWeb ? 0 : 64}
            contentType="ScrollList"
        />
    )
}
