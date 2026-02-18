import { View } from 'app/design/view';
import { appStatic } from 'app/lib/app-static'
import Page from 'app/ui/molecules/page'

export default function PageLayout({children, data}) {
    return (
        <Page data={data}>
            <View className='sm:p-4 w-full flex-1'>
                {children}
            </View>
            {appStatic('components_footer')}
        </Page>
    )
}
