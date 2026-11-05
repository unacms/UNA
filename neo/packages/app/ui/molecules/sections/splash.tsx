import { View } from 'app/design/view'
import { appSetting } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static'
import { staticComponents } from 'app/customization/static'
import { SplashTextBuiltIn } from 'app/default/static'
import { PageFooter } from 'app/components/nav/menu-footer'
import Page from 'app/ui/molecules/page/page'
import { PageHeaderOptions } from 'app/ui/molecules/header/options'
import UnaSplash from './una-splash'
import { SplashLoginForm } from './splash-parts'

/**
 * The guest splash (a guest's home when UNA sends `layout: 'splash'`, see isSplashPage).
 *
 * What it shows, first match wins:
 * 1. A project's own splash: this component replaced in `customization/molecules/_map.js` (then none of
 *    this runs), or its own `splash_text` in `customization/static.js`, shown here with the sign-in form.
 * 2. UNA's splash code (Studio > Designer > Splash), `data.splash.code`, through UnaSplash: its HTML with
 *    the placeholders drawn as NEO components.
 * 3. The built-in splash: illustration, title and text (`splash_text`), and the sign-in form.
 *
 */
type SplashProps = {
    /** The page data: `splash` (UNA's code), `texts` (the built-in splash's words), the login form block. */
    data?: { splash?: { source?: string; code?: string }; texts?: Record<string, string>; [key: string]: any }
}

export default function Splash(props: Readonly<SplashProps>) {
    const code = props.data?.splash?.code
    const hasOwnText = (staticComponents as Record<string, unknown>).splash_text !== SplashTextBuiltIn
    return (
        // Keyboard-aware scroll (Page default): the login form sits low on
        // the screen, and a plain ScrollView leaves the keyboard over it.
        <Page>
            <PageHeaderOptions band={false} showTitle={false} />
            {code && !hasOwnText ? (
                <UnaSplash code={code} data={props.data} />
            ) : (
                <View className={`flex-auto items-center justify-center lg:flex-row p-4 sm:p-6 lg:p-12 gap-6 lg:gap-12 w-full mx-auto ${appSetting('layout', 'max_width_landing')}`}>
                    {appStatic('splash_text', { texts: props.data?.texts })}
                    <SplashLoginForm data={props.data} />
                </View>
            )}
            <PageFooter />
        </Page>
    )
}
