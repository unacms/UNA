import { View } from 'app/design/view';
import { appStatic } from 'app/lib/app-static'
import Page from 'app/ui/molecules/page'
import { getUnaPageLayoutClasses } from 'app/lib/util'

export default function PageLayout({ children, data, layoutName }) {
    const unaLayout = getUnaPageLayoutClasses(layoutName)

    if (unaLayout) {
        return (
            <Page data={data}>
                <View className={unaLayout.shell}>
                    <View className={unaLayout.content}>{children}</View>
                </View>
                {appStatic('components_footer')}
            </Page>
        )
    }

    return (
        <Page data={data}>
            <View className="w-full flex-1">
                {children}
            </View>
            {appStatic('components_footer')}
        </Page>
    )
}
